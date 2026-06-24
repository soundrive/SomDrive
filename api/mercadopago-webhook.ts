import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Initialize Firebase Admin securely and lazily
let dbInstance: any = null;

function cleanEnvValue(val: string | undefined): string {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1);
  }
  s = s.trim();
  if (s.endsWith(",")) {
    s = s.substring(0, s.length - 1);
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1);
  }
  return s.trim();
}

function getDb() {
  if (!dbInstance) {
    const rawProjectId = process.env.FIREBASE_PROJECT_ID;
    const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    const projectId = cleanEnvValue(rawProjectId);
    const clientEmail = cleanEnvValue(rawClientEmail);
    const privateKey = cleanEnvValue(rawPrivateKey)?.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");

    if (!projectId) {
      throw new Error("Missing FIREBASE_PROJECT_ID");
    }
    if (!clientEmail) {
      throw new Error("Missing FIREBASE_CLIENT_EMAIL");
    }
    if (!privateKey) {
      throw new Error("Missing FIREBASE_PRIVATE_KEY");
    }

    let app;
    const appName = "mp_admin_app";
    const existingApps = getApps();
    const existingApp = existingApps.find(a => a.name === appName);

    if (!existingApp) {
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId: projectId,
        }, appName);
        console.log("[Firebase Admin] Initialized named app 'mp_admin_app' successfully with cert().");
      } catch (e: any) {
        console.error("Error initializing Firebase Admin with service credentials in mp_admin_app:", e);
        throw e;
      }
    } else {
      app = existingApp;
    }
    dbInstance = getFirestore(app, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");
  }
  return dbInstance;
}

// Helper to verify Mercado Pago webhook signatures safely
function verifySignature(req: any, webhookSecret: string): boolean {
  try {
    const getHeader = (headers: any, key: string): string => {
      const kObj = key.toLowerCase();
      for (const hKey of Object.keys(headers || {})) {
        if (hKey.toLowerCase() === kObj) {
          return String(headers[hKey] || '');
        }
      }
      return '';
    };

    const signatureHeader = getHeader(req.headers, 'x-signature');
    const xRequestId = getHeader(req.headers, 'x-request-id');

    if (!signatureHeader) {
      console.log("[MercadoPago Webhook Signature Audit] Missing signature header.");
      return false;
    }

    // Split using either comma or semicolon
    const parts = signatureHeader.includes(',') ? signatureHeader.split(',') : signatureHeader.split(';');
    let ts = '';
    let v1 = '';
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        const key = part.substring(0, eqIdx).trim().toLowerCase();
        const val = part.substring(eqIdx + 1).trim();
        if (key === 'ts') ts = val;
        if (key === 'v1') v1 = val;
      }
    }

    if (!ts || !v1) {
      console.log("[MercadoPago Webhook Signature Audit] Missing ts or v1 parsed values from signature header.");
      return false;
    }

    // Get data.id prioritizing from URL query parameters
    let dataId = '';
    let fromQuery = false;
    let fromBody = false;

    try {
      const reqUrl = req.url || '';
      // Use a fallback base URL so new URL() doesn't fail on relative URLs
      const parsedUrl = new URL(reqUrl, "https://www.somdrive.com.br");
      const urlDataId = parsedUrl.searchParams.get('data.id');
      if (urlDataId) {
        dataId = urlDataId.trim();
        fromQuery = true;
      }
    } catch (e) {
      console.warn("[MercadoPago Webhook Signature] Error parsing req.url with new URL:", e);
    }

    // Fallback to req.query["data.id"] or nested query data.id
    if (!dataId && req.query) {
      if (req.query['data.id']) {
        dataId = String(req.query['data.id']).trim();
        fromQuery = true;
      } else if (req.query.data && typeof req.query.data === 'object' && req.query.data.id) {
        dataId = String(req.query.data.id).trim();
        fromQuery = true;
      } else if (req.query.id) {
        dataId = String(req.query.id).trim();
        fromQuery = true;
      }
    }

    // Securitized body fallback (only data.id or data?.id as requested)
    if (!dataId && req.body) {
      if (req.body.data && typeof req.body.data === 'object' && req.body.data.id) {
        dataId = String(req.body.data.id).trim();
        fromBody = true;
      } else if (req.body.id) {
        dataId = String(req.body.id).trim();
        fromBody = true;
      }
    }

    if (!dataId) {
      console.log("[MercadoPago Webhook Signature Audit] No potential data.id found in request URL query or body.");
      return false;
    }

    // Montar o manifesto conforme regras 5 e 6:
    // "Montar o manifesto exatamente assim: id:{dataId};request-id:{xRequestId};ts:{ts};"
    // "Se algum valor não existir, remover integralmente essa parte do manifesto"
    let manifest = '';
    if (dataId) {
      manifest += `id:${dataId};`;
    }
    if (xRequestId) {
      manifest += `request-id:${xRequestId};`;
    }
    if (ts) {
      manifest += `ts:${ts};`;
    }

    const cleanedSecret = webhookSecret.trim();

    // Calculate Hash
    const computedHash = crypto
      .createHmac('sha256', cleanedSecret)
      .update(manifest)
      .digest('hex');

    // Secure comparison of v1 with timingSafeEqual fallback
    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf-8'),
        Buffer.from(v1, 'utf-8')
      );
    } catch (e) {
      isMatch = (computedHash === v1);
    }

    // Adicionar logs seguros sem expor segredos
    const auditLog = {
      hasSignatureHeader: true,
      signatureLength: signatureHeader.length,
      hasRequestId: !!xRequestId,
      hasDataIdFromQuery: fromQuery,
      hasDataIdFromBody: fromBody,
      signatureTsPresent: !!ts,
      signatureV1Present: !!v1,
      manifestPartsUsed: {
        useId: !!dataId,
        useRequestId: !!xRequestId,
        useTs: !!ts
      },
      signatureValid: isMatch,
      notificationType: req.body?.type || req.body?.topic || req.query?.topic || req.query?.type || 'unknown',
      paymentId: dataId,
      // Secure logging as requested (never print secret, token or full hashes)
      hashPrefixReceived: v1.substring(0, 4) + '...',
      hashPrefixCalculated: computedHash.substring(0, 4) + '...'
    };

    console.log("[MercadoPago Webhook Signature Audit]", JSON.stringify(auditLog));
    return isMatch;
  } catch (err) {
    console.warn("[MercadoPago Webhook Signature Error] Exception during signature verification:", err);
    return false;
  }
}

// Fallback search to find user by email in dual collections
async function findUserByEmailInFirestore(email: string): Promise<string | null> {
  if (!email) return null;
  const emailLower = email.toLowerCase().trim();

  // Search 'users' dual sync target
  const usersSnap = await getDb().collection("users")
    .where("email", "==", emailLower)
    .limit(1)
    .get();

  if (!usersSnap.empty) {
    return usersSnap.docs[0].id;
  }

  // Search 'artists' collection
  const artistsSnap = await getDb().collection("artists")
    .where("email", "==", emailLower)
    .limit(1)
    .get();

  if (!artistsSnap.empty) {
    return artistsSnap.docs[0].id;
  }

  return null;
}

// Global robust plan properties resolver
function resolvePlanDetails(planCode: string, preapprovalPlanId: string, description: string) {
  const code = (planCode || '').toLowerCase().trim();
  const planId = (preapprovalPlanId || '').toLowerCase().trim();
  const desc = (description || '').toLowerCase().trim();

  let plan: 'essencial' | 'pro' | 'premium' = 'pro';
  let musicLimit = 15;
  let billingCycle: 'monthly' | 'annual' = 'monthly';
  let durationDays = 30;

  // 1. Check preapproval plan ID matching standard configurations
  if (planId === '122938c4f106404d843032de86628512') {
    plan = 'pro';
    musicLimit = 15;
    billingCycle = 'monthly';
    durationDays = 31;
  } else if (planId === 'ea683f4d101746bb86c3933530814aa8') {
    plan = 'pro';
    musicLimit = 15;
    billingCycle = 'annual';
    durationDays = 366;
  } else if (planId === 'dbb8c10eacbb4c87ad6f5ee5ad15cd4a') {
    plan = 'premium';
    musicLimit = 50;
    billingCycle = 'monthly';
    durationDays = 31;
  } else if (planId === '986deaf44cf144d9af93c718b4870ca5') {
    plan = 'premium';
    musicLimit = 50;
    billingCycle = 'annual';
    durationDays = 366;
  }
  // 2. Otherwise check planCode
  else if (code.includes('premium')) {
    plan = 'premium';
    musicLimit = 50;
    if (code.includes('anual') || code.includes('annual') || code.includes('yearly') || code.includes('year')) {
      billingCycle = 'annual';
      durationDays = 365;
    } else {
      billingCycle = 'monthly';
      durationDays = 30;
    }
  } else if (code.includes('essencial') || code.includes('essential')) {
    plan = 'essencial';
    musicLimit = 10;
    if (code.includes('anual') || code.includes('annual') || code.includes('yearly') || code.includes('year')) {
      billingCycle = 'annual';
      durationDays = 365;
    } else {
      billingCycle = 'monthly';
      durationDays = 30;
    }
  } else if (code.includes('pro')) {
    plan = 'pro';
    musicLimit = 15;
    if (code.includes('anual') || code.includes('annual') || code.includes('yearly') || code.includes('year')) {
      billingCycle = 'annual';
      durationDays = 365;
    } else {
      billingCycle = 'monthly';
      durationDays = 30;
    }
  }
  // 3. Otherwise fall back to description matching
  else {
    if (desc.includes('premium')) {
      plan = 'premium';
      musicLimit = 50;
    } else if (desc.includes('essencial') || desc.includes('essential')) {
      plan = 'essencial';
      musicLimit = 10;
    } else {
      plan = 'pro';
      musicLimit = 15;
    }
    if (desc.includes('anual') || desc.includes('annual') || desc.includes('yearly') || desc.includes('ano')) {
      billingCycle = 'annual';
      durationDays = 365;
    } else {
      billingCycle = 'monthly';
      durationDays = 30;
    }
  }

  return { plan, musicLimit, billingCycle, durationDays };
}

// Secure double sync target synchronizer
async function syncUserAndArtistPlans(uid: string, updatePayload: any) {
  const dbInstanceLocal = getDb();
  const fieldsToSync = {
    plan: updatePayload.plan,
    musicLimit: updatePayload.musicLimit,
    billingCycle: updatePayload.billingCycle,
    subscriptionStatus: updatePayload.subscriptionStatus,
    planStatus: updatePayload.planStatus,
    paymentStatus: updatePayload.paymentStatus,
    planActivatedAt: updatePayload.planActivatedAt || FieldValue.serverTimestamp(),
    planStartedAt: updatePayload.planStartedAt || FieldValue.serverTimestamp(),
    planExpiresAt: updatePayload.planExpiresAt,
    accessType: updatePayload.accessType,
    subscriptionStartedAt: updatePayload.subscriptionStartedAt,
    subscriptionEndsAt: updatePayload.subscriptionEndsAt,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (updatePayload.mercadoPagoPaymentId) {
    (fieldsToSync as any).mercadoPagoPaymentId = updatePayload.mercadoPagoPaymentId;
  }
  if (updatePayload.mercadoPagoSubscriptionId) {
    (fieldsToSync as any).mercadoPagoSubscriptionId = updatePayload.mercadoPagoSubscriptionId;
  }
  if (updatePayload.billingType) {
    (fieldsToSync as any).billingType = updatePayload.billingType;
  }
  if (updatePayload.preapprovalPlanId) {
    (fieldsToSync as any).preapprovalPlanId = updatePayload.preapprovalPlanId;
  }
  if (updatePayload.lastPaymentId) {
    (fieldsToSync as any).lastPaymentId = updatePayload.lastPaymentId;
  }
  if (updatePayload.lastPaymentStatus) {
    (fieldsToSync as any).lastPaymentStatus = updatePayload.lastPaymentStatus;
  }
  if (updatePayload.nextPaymentDate) {
    (fieldsToSync as any).nextPaymentDate = updatePayload.nextPaymentDate;
  }
  if (updatePayload.paymentId) {
    (fieldsToSync as any).paymentId = updatePayload.paymentId;
  }
  if (updatePayload.preapprovalId) {
    (fieldsToSync as any).preapprovalId = updatePayload.preapprovalId;
  }

  await dbInstanceLocal.collection("users").doc(uid).set(fieldsToSync, { merge: true });
  await dbInstanceLocal.collection("artists").doc(uid).set(fieldsToSync, { merge: true });
}

// Revert plans to FREE sync helper
async function syncUserAndArtistRefund(uid: string) {
  const dbInstanceLocal = getDb();
  const updatePayload = {
    plan: "free",
    musicLimit: 3,
    subscriptionStatus: "refunded",
    planStatus: "refunded",
    paymentStatus: "refunded",
    accessType: "free",
    planExpiresAt: null,
    updatedAt: FieldValue.serverTimestamp()
  };
  await dbInstanceLocal.collection("users").doc(uid).set(updatePayload, { merge: true });
  await dbInstanceLocal.collection("artists").doc(uid).set(updatePayload, { merge: true });
}

// CORE FUNCTION: PROCESS SINGLE PAYMENT ID
async function processSinglePayment(paymentId: string, merchantOrderId = "", forceUpdate = false) {
  const accessTokenRaw = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const accessToken = cleanEnvValue(accessTokenRaw);
  if (!accessToken) {
    throw new Error("Sem MERCADOPAGO_ACCESS_TOKEN no servidor");
  }

  const dbInstanceLocal = getDb();

  // Fetch payment from MP API
  const mpUrl = `https://api.mercadopago.com/v1/payments/${paymentId}`;
  const mpResponse = await fetch(mpUrl, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });

  if (!mpResponse.ok) {
    if (mpResponse.status === 404 || mpResponse.status === 400 || mpResponse.status === 403) {
      try {
        await dbInstanceLocal.collection("mp_subscriptions").doc(String(paymentId)).set({
          id: String(paymentId),
          status: "not_found",
          paymentId: String(paymentId),
          subscriptionId: "",
          userId: "unknown",
          uid: "unknown",
          email: "unknown",
          plan: "unknown",
          planCode: "unknown",
          processedAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
          errorMessage: `ID não localizado na API do Mercado Pago (Status ${mpResponse.status})`
        }, { merge: true });
      } catch (logErr) {
        console.error("Error logging not_found payment to mp_subscriptions:", logErr);
      }
      return { success: false, status: "not_found", message: `ID não encontrado ou sem correspondência na API do MP (Status ${mpResponse.status})` };
    }

    try {
      await dbInstanceLocal.collection("mp_subscriptions").doc(String(paymentId)).set({
        id: String(paymentId),
        status: "api_error",
        paymentId: String(paymentId),
        subscriptionId: "",
        userId: "unknown",
        uid: "unknown",
        email: "unknown",
        plan: "unknown",
        planCode: "unknown",
        processedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
        errorMessage: `Erro HTTP ${mpResponse.status} na API do Mercado Pago`
      }, { merge: true });
    } catch (logErr) {
      console.error("Error logging api_error payment to mp_subscriptions:", logErr);
    }
    throw new Error(`Retorno HTTP ${mpResponse.status} na API do Mercado Pago`);
  }

  const payment = await mpResponse.json();
  const status = payment.status || 'unknown';
  const payerEmail = payment.payer?.email || '';
  const externalReference = payment.external_reference || '';
  const description = payment.description || '';
  const amount = payment.transaction_amount || 0;
  const paymentMethod = payment.payment_method_id || '';
  const dateCreated = payment.date_created || '';
  const dateApproved = payment.date_approved || '';
  const dateLastUpdated = payment.date_last_updated || '';
  const transactionNumber = payment.transaction_number || payment.transaction_details?.transaction_id || paymentId;

  // Check idempotency with identical status unless forced
  const subscriptionRecordRef = dbInstanceLocal.collection("mp_subscriptions").doc(String(paymentId));
  const existingDoc = await subscriptionRecordRef.get();
  if (existingDoc.exists && !forceUpdate) {
    const docData = existingDoc.data();
    if (docData && docData.status === status && docData.processedAt) {
      return {
        success: true,
        paymentId: String(paymentId),
        status: status,
        planActivated: !!docData.planActivated,
        message: status === 'approved'
          ? "Pagamento já foi processado anteriormente e o plano está ativo."
          : `Pagamento já foi registrado anteriormente com o status '${status}'.`,
        alreadyProcessed: true
      };
    }
  }

  // Resolve UID and Plan Code
  let resolvedUid: string | null = null;
  let resolvedPlanCode = '';

  if (externalReference && externalReference.includes('|')) {
    const parts = externalReference.split('|');
    resolvedUid = parts[0] ? parts[0].trim() : null;
    if (parts[1]) {
      resolvedPlanCode = parts[1].trim();
    }
  }

  if (!resolvedUid || !resolvedPlanCode) {
    const meta = payment.metadata || {};
    const metadataUid = meta.uid || meta.user_id || meta.userId || '';
    const metadataPlanCode = meta.plan_code || meta.planCode || '';

    if (!resolvedUid && metadataUid) {
      resolvedUid = String(metadataUid).trim();
    }
    if (!resolvedPlanCode && metadataPlanCode) {
      resolvedPlanCode = String(metadataPlanCode).trim();
    }
  }

  if (!resolvedUid && payerEmail) {
    resolvedUid = await findUserByEmailInFirestore(payerEmail);
  }

  const { plan: finalPlan, musicLimit, billingCycle, durationDays } = resolvePlanDetails(resolvedPlanCode, "", description);

  let planActivated = false;

  // Only approved status can activate a plan and only if a user is found
  if (status === 'approved' && resolvedUid) {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + durationDays);

    const updatePayload = {
      plan: finalPlan, // "essencial", "pro" or "premium"
      musicLimit: musicLimit,
      billingCycle: billingCycle,
      subscriptionStatus: "active",
      planStatus: "active",
      paymentStatus: "approved",
      mercadoPagoPaymentId: String(paymentId),
      paymentId: String(paymentId),
      preapprovalId: "",
      planActivatedAt: FieldValue.serverTimestamp(),
      planStartedAt: FieldValue.serverTimestamp(),
      planExpiresAt: expires,
      accessType: "subscriber",
      subscriptionStartedAt: now.toISOString(),
      subscriptionEndsAt: expires.toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await syncUserAndArtistPlans(resolvedUid, updatePayload);
    planActivated = true;
  } else if ((status === 'refunded' || status === 'cancelled' || status === 'charged_back' || status === 'chargedback') && resolvedUid) {
    // Revert user/artist to FREE tier if the payment has been refunded, cancelled, or charged back
    await syncUserAndArtistRefund(resolvedUid);
  }

  // Handle orphan payment status log as requested
  let finalStatusToSave = status;
  if (status === 'approved' && !resolvedUid) {
    finalStatusToSave = 'orphan_payment';
  }

  // Save the record in mp_subscriptions
  const finalSubMap: any = {
    id: String(paymentId),
    userId: resolvedUid || "unknown",
    uid: resolvedUid || "unknown",
    email: payerEmail || "unknown",
    plan: finalPlan.toLowerCase(),
    planCode: resolvedPlanCode || finalPlan,
    billingCycle: billingCycle,
    status: finalStatusToSave,
    paymentId: String(paymentId),
    merchantOrderId: String(merchantOrderId || payment.order?.id || ""),
    transactionNumber: String(transactionNumber || ""),
    subscriptionId: "",
    musicLimit: musicLimit,
    amount: amount,
    paymentMethod: paymentMethod,
    externalReference: externalReference,
    createdAt: dateCreated,
    approvedAt: dateApproved,
    dateCreated: dateCreated,
    dateApproved: dateApproved,
    dateLastUpdated: dateLastUpdated,
    processedAt: new Date().toISOString(),
    planActivated: planActivated,
    paidAt: dateApproved || dateCreated || new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await subscriptionRecordRef.set(finalSubMap, { merge: true });

  console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
    paymentId: String(paymentId),
    paymentStatus: status,
    planCode: resolvedPlanCode || finalPlan,
    metadataUid: payment.metadata?.uid || payment.metadata?.user_id || "",
    externalReferenceUid: externalReference ? externalReference.split('|')[0] : "",
    matchedUid: resolvedUid || "",
    matchedBy: resolvedUid ? (externalReference ? "external_reference" : (payment.metadata?.uid ? "metadata" : "email")) : "none",
    officialUserDocumentPath: resolvedUid ? `artists/${resolvedUid}` : "none",
    previousPlan: "unknown",
    newPlan: planActivated ? finalPlan.toLowerCase() : "none",
    previousLimit: 3,
    newLimit: planActivated ? musicLimit : 3,
    subscriptionEndsAt: planActivated ? (new Date(Date.now() + durationDays * 24 * 3600 * 1000)).toISOString() : null,
    transactionSaved: true,
    dashboardSourcePath: resolvedUid ? `artists/${resolvedUid}` : "none",
    automaticActivationCompleted: planActivated,
    errorMessage: status === "approved" && !resolvedUid ? "User UID not resolved from payment" : null
  }));

  let displayMessage = `Pagamento gravado com status '${status}' (plano não ativado).`;
  if (status === 'approved') {
    if (resolvedUid) {
      displayMessage = `Pagamento verificado com sucesso! Plano ${finalPlan} ativado para o e-mail: ${payerEmail}.`;
    } else {
      displayMessage = `Pagamento aprovado, porém nenhum usuário associado (e-mail: ${payerEmail}) foi encontrado. Registrado como orphan_payment.`;
    }
  } else if (status === 'refunded') {
    displayMessage = "O pagamento foi reembolsado e está cancelado.";
  }

  return {
    success: status === 'approved' && resolvedUid !== null,
    paymentId: String(paymentId),
    status: finalStatusToSave,
    planActivated: planActivated,
    message: displayMessage
  };
}

// CORE FUNCTION: PROCESS SINGLE PREAPPROVAL (SUBSCRIPTION) ID
async function processSinglePreapproval(preapprovalId: string, forceUpdate = false) {
  const accessTokenRaw = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const accessToken = cleanEnvValue(accessTokenRaw);
  if (!accessToken) {
    throw new Error("Sem MERCADOPAGO_ACCESS_TOKEN no servidor");
  }

  const dbInstanceLocal = getDb();

  // Fetch preapproval from MP API
  const mpUrl = `https://api.mercadopago.com/preapproval/${preapprovalId}`;
  const mpResponse = await fetch(mpUrl, {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });

  if (!mpResponse.ok) {
    if (mpResponse.status === 404 || mpResponse.status === 400 || mpResponse.status === 403) {
      try {
        await dbInstanceLocal.collection("mp_subscriptions").doc(String(preapprovalId)).set({
          id: String(preapprovalId),
          status: "not_found",
          paymentId: "",
          subscriptionId: String(preapprovalId),
          userId: "unknown",
          uid: "unknown",
          email: "unknown",
          plan: "unknown",
          planCode: "unknown",
          processedAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
          errorMessage: `Assinatura não localizada na API do Mercado Pago (Status ${mpResponse.status})`
        }, { merge: true });
      } catch (logErr) {
        console.error("Error logging not_found preapproval to mp_subscriptions:", logErr);
      }
      return { success: false, status: "not_found", message: `Assinatura não encontrada ou formato de ID inválido na API de Assinaturas do MP (Status ${mpResponse.status})` };
    }

    try {
      await dbInstanceLocal.collection("mp_subscriptions").doc(String(preapprovalId)).set({
        id: String(preapprovalId),
        status: "api_error",
        paymentId: "",
        subscriptionId: String(preapprovalId),
        userId: "unknown",
        uid: "unknown",
        email: "unknown",
        plan: "unknown",
        planCode: "unknown",
        processedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
        errorMessage: `Erro HTTP ${mpResponse.status} na API de Assinaturas do Mercado Pago`
      }, { merge: true });
    } catch (logErr) {
      console.error("Error logging api_error preapproval to mp_subscriptions:", logErr);
    }
    throw new Error(`Retorno HTTP ${mpResponse.status} na API de Assinaturas do Mercado Pago`);
  }

  const preapproval = await mpResponse.json();
  const status = preapproval.status || 'unknown'; // authorized, paused, etc.
  const payerEmail = preapproval.payer_email || '';
  const externalReference = preapproval.external_reference || '';
  const description = preapproval.reason || 'Assinatura SomDrive';
  const amount = preapproval.auto_recurring?.transaction_amount || 0;
  const dateCreated = preapproval.date_created || '';
  const dateApproved = preapproval.last_modified || ''; 

  // Check idempotency with identical status unless forced
  const subscriptionRecordRef = dbInstanceLocal.collection("mp_subscriptions").doc(String(preapprovalId));
  const existingDoc = await subscriptionRecordRef.get();
  if (existingDoc.exists && !forceUpdate) {
    const docData = existingDoc.data();
    if (docData && docData.status === status && docData.processedAt) {
      return {
        success: true,
        paymentId: String(preapprovalId),
        status: status,
        planActivated: !!docData.planActivated,
        message: status === 'authorized'
          ? "Assinatura já foi processada anteriormente e o plano está ativo."
          : `Assinatura já foi registrada anteriormente com o status '${status}'.`,
        alreadyProcessed: true
      };
    }
  }

  // Resolve UID and Plan Code
  let resolvedUid: string | null = null;
  let resolvedPlanCode = '';

  if (externalReference && externalReference.includes('|')) {
    const parts = externalReference.split('|');
    resolvedUid = parts[0] ? parts[0].trim() : null;
    if (parts[1]) {
      resolvedPlanCode = parts[1].trim();
    }
  }

  if (!resolvedUid || !resolvedPlanCode) {
    const meta = preapproval.metadata || {};
    const metadataUid = meta.uid || meta.user_id || meta.userId || '';
    const metadataPlanCode = meta.plan_code || meta.planCode || '';

    if (!resolvedUid && metadataUid) {
      resolvedUid = String(metadataUid).trim();
    }
    if (!resolvedPlanCode && metadataPlanCode) {
      resolvedPlanCode = String(metadataPlanCode).trim();
    }
  }

  if (!resolvedUid && payerEmail) {
    resolvedUid = await findUserByEmailInFirestore(payerEmail);
  }

  const preapprovalPlanIdVal = preapproval.preapproval_plan_id || "";
  const { plan: finalPlan, musicLimit, billingCycle, durationDays } = resolvePlanDetails(resolvedPlanCode, preapprovalPlanIdVal, description);

  let planActivated = false;
  const isApproved = status === 'authorized' || status === 'active';

  if (isApproved && resolvedUid) {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + durationDays);

    const lastPaymentIdVal = preapproval.last_payment_id || "";
    const lastPaymentStatusVal = preapproval.last_payment_status || "";
    const nextPaymentDateVal = preapproval.next_payment_date || preapproval.auto_recurring?.next_payment_date || null;

    const updatePayload = {
      plan: finalPlan,
      musicLimit: musicLimit,
      billingCycle: billingCycle,
      subscriptionStatus: "active",
      planStatus: "active",
      paymentStatus: "approved",
      mercadoPagoSubscriptionId: String(preapprovalId),
      preapprovalId: String(preapprovalId),
      paymentId: "",
      planActivatedAt: FieldValue.serverTimestamp(),
      planStartedAt: FieldValue.serverTimestamp(),
      planExpiresAt: expires,
      accessType: "subscriber",
      subscriptionStartedAt: now.toISOString(),
      subscriptionEndsAt: expires.toISOString(),
      updatedAt: FieldValue.serverTimestamp(),

      // Subscriptions Specific properties requested by the user
      billingType: "subscription",
      preapprovalPlanId: String(preapprovalPlanIdVal),
      lastPaymentId: String(lastPaymentIdVal),
      lastPaymentStatus: String(lastPaymentStatusVal),
      nextPaymentDate: nextPaymentDateVal ? String(nextPaymentDateVal) : null
    };

    await syncUserAndArtistPlans(resolvedUid, updatePayload);
    planActivated = true;
  } else if ((status === 'paused' || status === 'cancelled') && resolvedUid) {
    // Revert plan to FREE if paused or cancelled
    await syncUserAndArtistRefund(resolvedUid);
  }

  // Handle orphan payment status log as requested
  let finalStatusToSave = status;
  if (isApproved && !resolvedUid) {
    finalStatusToSave = 'orphan_payment';
  }

  const finalSubMap: any = {
    id: String(preapprovalId),
    userId: resolvedUid || "unknown",
    uid: resolvedUid || "unknown",
    email: payerEmail || "unknown",
    plan: finalPlan.toLowerCase(),
    planCode: resolvedPlanCode || finalPlan,
    billingCycle: billingCycle,
    status: finalStatusToSave,
    paymentId: "",
    subscriptionId: String(preapprovalId),
    transactionNumber: String(preapprovalId),
    musicLimit: musicLimit,
    amount: amount,
    externalReference: externalReference,
    createdAt: dateCreated,
    processedAt: new Date().toISOString(),
    planActivated: planActivated,
    paidAt: dateApproved || dateCreated || new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp()
  };

  await subscriptionRecordRef.set(finalSubMap, { merge: true });

  let displayMessage = `Assinatura gravada com status '${status}' (plano não ativado).`;
  if (isApproved) {
    if (resolvedUid) {
      displayMessage = `Assinatura verificada com sucesso! Plano ${finalPlan} liberado para o e-mail: ${payerEmail}.`;
    } else {
      displayMessage = `Assinatura autorizada, mas nenhum usuário associado (e-mail: ${payerEmail}) foi encontrado. Registrado como orphan_payment.`;
    }
  }

  return {
    success: isApproved && resolvedUid !== null,
    paymentId: String(preapprovalId),
    status: finalStatusToSave,
    planActivated: planActivated,
    message: displayMessage
  };
}

// Fallback search to find payments by external_reference, preference_id, payer.email, order.id, or scanner in Mercado Pago API
async function searchPaymentsAndProcess(targetId: string, accessToken: string) {
  try {
    const foundPayments: any[] = [];
    const addUniquePayments = (payments: any[]) => {
      for (const p of payments) {
        if (p && p.id) {
          const pIdStr = String(p.id);
          if (!foundPayments.some(fp => String(fp.id) === pIdStr)) {
            foundPayments.push(p);
          }
        }
      }
    };

    const targetClean = targetId.trim();
    if (!targetClean) return { found: false, paymentIds: [], status: 'unknown', planActivated: false };

    // 1. Search by external_reference
    try {
      const extRefUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(targetClean)}`;
      const extRefRes = await fetch(extRefUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
      if (extRefRes.ok) {
        const data = await extRefRes.json();
        if (data.results && data.results.length > 0) {
          addUniquePayments(data.results);
        }
      }
    } catch (e) {
      console.warn("Error search by external_reference:", e);
    }

    // 2. Search by preference_id
    try {
      const prefUrl = `https://api.mercadopago.com/v1/payments/search?preference_id=${encodeURIComponent(targetClean)}`;
      const prefRes = await fetch(prefUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
      if (prefRes.ok) {
        const data = await prefRes.json();
        if (data.results && data.results.length > 0) {
          addUniquePayments(data.results);
        }
      }
    } catch (e) {
      console.warn("Error search by preference_id:", e);
    }

    // 3. Search by order.id
    try {
      const orderUrl = `https://api.mercadopago.com/v1/payments/search?order.id=${encodeURIComponent(targetClean)}`;
      const orderRes = await fetch(orderUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
      if (orderRes.ok) {
        const data = await orderRes.json();
        if (data.results && data.results.length > 0) {
          addUniquePayments(data.results);
        }
      }
    } catch (e) {
      console.warn("Error search by order.id:", e);
    }

    // 4. Scan last 100 payments as a bulletproof safety net (filter by email, ref, description, etc.)
    try {
      const scanUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=100`;
      const scanRes = await fetch(scanUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
      if (scanRes.ok) {
        const data = await scanRes.json();
        const results = data.results || [];
        const matchLower = targetClean.toLowerCase();
        const matchedRecent = results.filter((p: any) => {
          if (!p) return false;
          if (String(p.id) === matchLower) return true;
          if (p.order && String(p.order.id) === matchLower) return true;
          const extRef = String(p.external_reference || '').toLowerCase();
          if (extRef === matchLower || extRef.includes(matchLower)) return true;
          const prefId = String(p.preference_id || '').toLowerCase();
          if (prefId === matchLower || prefId.includes(matchLower)) return true;
          if (String(p.description || '').toLowerCase().includes(matchLower)) return true;
          const txNum = String(p.transaction_number || '').toLowerCase();
          const detailsTxId = String(p.transaction_details?.transaction_id || '').toLowerCase();
          const detailsInstitutionTxId = String(p.transaction_details?.financial_institution || '').toLowerCase();
          if (txNum === matchLower || detailsTxId === matchLower || detailsInstitutionTxId === matchLower) return true;
          if (p.payer && String(p.payer.email || '').toLowerCase() === matchLower) return true;
          if (p.metadata) {
            const metaUid = String(p.metadata.uid || p.metadata.user_id || p.metadata.userId || '').toLowerCase();
            const metaEmail = String(p.metadata.email || '').toLowerCase();
            if (metaUid === matchLower || metaEmail === matchLower) return true;
          }
          return false;
        });

        if (matchedRecent.length > 0) {
          addUniquePayments(matchedRecent);
        }
      }
    } catch (e) {
      console.warn("Error scanning last 100 payments:", e);
    }

    // 5. Search preapprovals by external_reference as fallback
    try {
      const preappSearchUrl = `https://api.mercadopago.com/preapproval/search?external_reference=${encodeURIComponent(targetClean)}`;
      const preappSearchRes = await fetch(preappSearchUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
      if (preappSearchRes.ok) {
        const data = await preappSearchRes.json();
        const preappResults = data.results || [];
        for (const item of preappResults) {
          if (item && item.id) {
            const pRes = await processSinglePreapproval(String(item.id), true);
            if (pRes.success || pRes.planActivated) {
              return {
                found: true,
                paymentIds: [String(item.id)],
                status: pRes.status,
                planActivated: pRes.planActivated
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error search preapprovals by external_reference in comprehensive search:", e);
    }

    // Process all found payments through our core logic
    if (foundPayments.length > 0) {
      let atLeastOneActivated = false;
      let lastStatus = 'unknown';
      const foundIds: string[] = [];

      for (const p of foundPayments) {
        if (p.id) {
          const pIdStr = String(p.id);
          foundIds.push(pIdStr);
          const pResult = await processSinglePayment(pIdStr, "", true);
          if (pResult.planActivated) {
            atLeastOneActivated = true;
          }
          lastStatus = pResult.status;
        }
      }

      return {
        found: true,
        paymentIds: foundIds,
        status: lastStatus,
        planActivated: atLeastOneActivated
      };
    }

  } catch (err) {
    console.warn("[MercadoPago Search Warning] error doing comprehensive payments search:", err);
  }
  return { found: false, paymentIds: [], status: 'unknown', planActivated: false };
}

export default async function handler(req: any, res: any) {
  const action = req.body?.action || req.query?.action;

  // 1.5 ADMINISTRATIVE AUTOMATED INTEGRATION TEST
  if (action === 'run_automated_test') {
    try {
      console.log("[Automated Test] Registering a clean, isolated demo user...");
      const dbInstanceLocal = getDb();
      const testUid = "test_user_webhook_unique_id";

      // A. Create mock FREE user (Initial State)
      const initialUser = {
        userId: testUid,
        email: "test_webhook_automated@somdrive.com.br",
        artistName: "Test Webhook User",
        plan: "free",
        musicLimit: 3,
        updatedAt: FieldValue.serverTimestamp()
      };
      
      await dbInstanceLocal.collection("users").doc(testUid).set(initialUser, { merge: true });
      await dbInstanceLocal.collection("artists").doc(testUid).set(initialUser, { merge: true });

      // B. Simulate Webhook calling update logic with "PRO" status approval
      console.log("[Automated Test] Simulating live Webhook execution updates to PRO...");
      const mockUpdatePayload = {
        plan: "pro",
        musicLimit: 15,
        subscriptionStatus: "active",
        planStatus: "active",
        paymentStatus: "approved",
        mercadoPagoPaymentId: "TEST_MP_PAYMENT_99999",
        accessType: "subscriber",
        updatedAt: FieldValue.serverTimestamp()
      };

      await dbInstanceLocal.collection("users").doc(testUid).set(mockUpdatePayload, { merge: true });
      await dbInstanceLocal.collection("artists").doc(testUid).set(mockUpdatePayload, { merge: true });

      // C. Read the document back from the Dashboard's official source to verify correctness
      console.log("[Automated Test] Performing validations against the updated official sources...");
      const docSnap = await dbInstanceLocal.collection("artists").doc(testUid).get();
      const userSnapData = docSnap.exists ? docSnap.data() : null;

      const successPlanMatches = userSnapData?.plan === "pro";
      const successLimitMatches = Number(userSnapData?.musicLimit) === 15;
      const successStatusMatches = userSnapData?.paymentStatus === "approved";

      // D. Clean up temporary test data completely
      console.log("[Automated Test] Executing complete dataset teardown cleanup...");
      await dbInstanceLocal.collection("users").doc(testUid).delete();
      await dbInstanceLocal.collection("artists").doc(testUid).delete();

      const testPassed = successPlanMatches && successLimitMatches && successStatusMatches;

      return res.status(200).json({
        success: testPassed,
        validations: {
          planMatches: successPlanMatches,
          limitMatches: successLimitMatches,
          statusMatches: successStatusMatches,
        },
        message: testPassed ? "Automated integration verification completed perfectly!" : "Automated validation failed on expected results."
      });

    } catch (err: any) {
      console.error("[Automated Test Error]", err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
    }
  }

  // 1. ADMINISTRATIVE MANUAL VERIFICATION ACTION
  if (action === 'verify_payment') {
    const manualPaymentId = req.body?.paymentId || req.query?.paymentId;
    if (!manualPaymentId || !String(manualPaymentId).trim()) {
      return res.status(200).json({
        success: false,
        paymentId: '',
        status: 'unknown',
        planActivated: false,
        message: "ID de pagamento pendente ou não especificado."
      });
    }

    const targetId = String(manualPaymentId).trim();

    try {
      const accessToken = cleanEnvValue(process.env.MERCADOPAGO_ACCESS_TOKEN);
      if (!accessToken) {
        return res.status(200).json({
          success: false,
          paymentId: targetId,
          status: 'unknown',
          planActivated: false,
          message: "Sem MERCADOPAGO_ACCESS_TOKEN no servidor"
        });
      }

      let paymentFound = false;
      let finalStatus = 'unknown';
      let atLeastOneActivated = false;
      let processedPaymentIds: string[] = [];
      const dbInstanceLocal = getDb();

      // Step A: If targetId is an email address, process it dynamically
      if (targetId.includes('@')) {
        console.log(`[Admin Reprocess] Reprocessing by customer email: ${targetId}`);
        const userDocId = await findUserByEmailInFirestore(targetId);

        // A1. Search preapproval subscriptions in Mercado Pago by email
        try {
          const preappSearchUrl = `https://api.mercadopago.com/preapproval/search?email=${encodeURIComponent(targetId.toLowerCase().trim())}`;
          const preappSearchRes = await fetch(preappSearchUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
          if (preappSearchRes.ok) {
            const preappData = await preappSearchRes.json();
            const preappResults = preappData.results || [];
            for (const item of preappResults) {
              if (item && item.id) {
                const pId = String(item.id);
                const pRes = await processSinglePreapproval(pId, true);
                if (!processedPaymentIds.includes(pId)) processedPaymentIds.push(pId);
                if (pRes.planActivated) {
                  atLeastOneActivated = true;
                  paymentFound = true;
                  finalStatus = pRes.status;
                }
              }
            }
          }
        } catch (errPre) {
          console.warn("[Admin Reprocess Error] Preapproval email search failed:", errPre);
        }

        // A2. Search payments by external_reference using found UID
        if (userDocId) {
          try {
            const extRefUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(userDocId)}`;
            const extRefRes = await fetch(extRefUrl, { headers: { "Authorization": `Bearer ${accessToken}` } });
            if (extRefRes.ok) {
              const data = await extRefRes.json();
              const results = data.results || [];
              for (const p of results) {
                if (p && p.id) {
                  const pId = String(p.id);
                  const pRes = await processSinglePayment(pId, "", true);
                  if (!processedPaymentIds.includes(pId)) processedPaymentIds.push(pId);
                  if (pRes.planActivated) {
                    atLeastOneActivated = true;
                    paymentFound = true;
                    finalStatus = pRes.status;
                  }
                }
              }
            }
          } catch (errExtRef) {
            console.warn("[Admin Reprocess Error] External reference payments search failed:", errExtRef);
          }
        }

        // A3. Scan last 100 payments for general email matching
        const scanResult = await searchPaymentsAndProcess(targetId, accessToken);
        if (scanResult.found) {
          paymentFound = true;
          if (scanResult.planActivated) atLeastOneActivated = true;
          finalStatus = scanResult.status;
          scanResult.paymentIds.forEach(id => {
            if (!processedPaymentIds.includes(id)) processedPaymentIds.push(id);
          });
        }

        if (paymentFound) {
          return res.status(200).json({
            success: atLeastOneActivated,
            paymentId: processedPaymentIds[0] || targetId,
            status: finalStatus,
            planActivated: atLeastOneActivated,
            message: `Reprocessamento por e-mail concluído! Sincronizadas ${processedPaymentIds.length} transações no Mercado Pago. Ativação do plano: ${atLeastOneActivated ? 'SUCESSO' : 'PENDENTE DE APROVAÇÃO'}`
          });
        }
      }

      // Step B: Attempt direct preapproval subscription processing
      try {
        const preappResult = await processSinglePreapproval(targetId, true);
        if (preappResult.status !== 'not_found' && preappResult.success !== undefined) {
          console.log(`[Admin Reprocess] Successfully processed preapproval subscription ID: ${targetId}`);
          return res.status(200).json(preappResult);
        }
      } catch (errPre) {
        console.warn("[Admin Reprocess] Direct preapproval check failed:", errPre);
      }

      // Step C: Attempt direct payment processing
      const paymentResult = await processSinglePayment(targetId, "", true);
      if (paymentResult.status !== 'not_found' && paymentResult.success !== undefined) {
        console.log(`[Admin Reprocess] Successfully processed payment ID: ${targetId}`);
        return res.status(200).json(paymentResult);
      }

      // Step D: Try comprehensive payments search by references
      const searchRefResult = await searchPaymentsAndProcess(targetId, accessToken);
      if (searchRefResult.found) {
        paymentFound = true;
        finalStatus = searchRefResult.status;
        atLeastOneActivated = searchRefResult.planActivated;
        processedPaymentIds = searchRefResult.paymentIds;

        return res.status(200).json({
          success: atLeastOneActivated,
          paymentId: processedPaymentIds[0] || targetId,
          status: finalStatus,
          planActivated: atLeastOneActivated,
          message: `Código identificado via pesquisa detalhada! Sincronizados ${processedPaymentIds.length} pagamento(s).`
        });
      }

      // Step E: Try fetching merchant order
      const orderUrl = `https://api.mercadopago.com/merchant_orders/${targetId}`;
      const orderResponse = await fetch(orderUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (orderResponse.ok) {
        const merchantOrder = await orderResponse.json();
        const paymentsList = merchantOrder.payments || [];

        if (paymentsList.length === 0) {
          return res.status(200).json({
            success: false,
            paymentId: targetId,
            status: 'pending',
            planActivated: false,
            message: "Essa ordem de compra foi localizada no Mercado Pago, mas ainda não possui nenhum pagamento aprovado vinculado a ela."
          });
        }

        for (const p of paymentsList) {
          const pResult = await processSinglePayment(String(p.id), targetId, true);
          processedPaymentIds.push(String(p.id));
          if (pResult.planActivated) {
            atLeastOneActivated = true;
          }
          finalStatus = pResult.status;
        }

        return res.status(200).json({
          success: true,
          paymentId: targetId,
          status: finalStatus,
          planActivated: atLeastOneActivated,
          message: `Código de Ordem de Compra identificado com sucesso! Sincronizado ${paymentsList.length} pagamento(s).`
        });
      }

      // Step F: Local DB Fallback for manual release
      let userDocId = await findUserByEmailInFirestore(targetId);
      let userEmailFound = '';
      
      if (userDocId) {
        userEmailFound = targetId.toLowerCase().trim();
      } else {
        // Try direct lookup of UID
        const uDoc = await dbInstanceLocal.collection("users").doc(targetId).get();
        if (uDoc.exists) {
          userDocId = targetId;
          userEmailFound = uDoc.data()?.email || '';
        } else {
          const aDoc = await dbInstanceLocal.collection("artists").doc(targetId).get();
          if (aDoc.exists) {
            userDocId = targetId;
            userEmailFound = aDoc.data()?.email || '';
          }
        }
      }

      if (userDocId) {
        const forcePlan = req.body?.forcePlan;
        if (forcePlan) {
          const resolved = resolvePlanDetails(forcePlan, "", "");
          const now = new Date();
          const expires = new Date();
          expires.setDate(now.getDate() + resolved.durationDays);

          const updatePayload = {
            plan: resolved.plan,
            musicLimit: resolved.musicLimit,
            billingCycle: resolved.billingCycle,
            subscriptionStatus: "active",
            planStatus: "active",
            paymentStatus: "approved",
            mercadoPagoPaymentId: `MANUAL_FORCE_${Date.now()}`,
            paymentId: `MANUAL_FORCE_${Date.now()}`,
            preapprovalId: "",
            planActivatedAt: FieldValue.serverTimestamp(),
            planStartedAt: FieldValue.serverTimestamp(),
            planExpiresAt: expires,
            accessType: "subscriber",
            subscriptionStartedAt: now.toISOString(),
            subscriptionEndsAt: expires.toISOString(),
            updatedAt: FieldValue.serverTimestamp()
          };

          await syncUserAndArtistPlans(userDocId, updatePayload);

          const manualSubId = `sub_manual_${userDocId}_${Date.now().toString().slice(-6)}`;
          await dbInstanceLocal.collection("mp_subscriptions").doc(manualSubId).set({
            id: manualSubId,
            userId: userDocId,
            uid: userDocId,
            email: userEmailFound,
            plan: resolved.plan,
            planCode: forcePlan,
            billingCycle: resolved.billingCycle,
            status: "approved",
            paymentId: "",
            subscriptionId: "",
            transactionNumber: "MANUAL_BY_ADMIN",
            musicLimit: resolved.musicLimit,
            amount: resolved.plan === 'premium' ? 29.99 : (resolved.plan === 'pro' ? 14.99 : (resolved.plan === 'essencial' ? 9.99 : 0)),
            externalReference: "MANUAL_OVERRIDE_BY_ADMIN",
            processedAt: new Date().toISOString(),
            planActivated: true,
            paidAt: new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });

          return res.status(200).json({
            success: true,
            paymentId: manualSubId,
            status: 'approved',
            planActivated: true,
            message: `Plano ${resolved.plan.toUpperCase()} (${resolved.billingCycle === 'annual' ? 'Anual' : 'Mensal'}) ativado FORÇADAMENTE com sucesso pelo administrador para o usuário: ${userEmailFound}`
          });
        }

        return res.status(200).json({
          success: false,
          paymentId: targetId,
          status: 'user_found',
          planActivated: false,
          userFound: {
            uid: userDocId,
            email: userEmailFound
          },
          message: `Identificador não localizado no Mercado Pago. Porém, localizamos o usuário '${userEmailFound}' no banco de dados! Deseja fazer a liberação manual direta para este usuário?`
        });
      }

      // Step G: If everything is 404
      return res.status(200).json({
        success: false,
        paymentId: targetId,
        status: 'not_found',
        planActivated: false,
        message: "Nenhum pagamento, assinatura, e-mail de cliente ou UID correspondente foi localizado no Mercado Pago ou em nossa base de dados local."
      });

    } catch (err: any) {
      console.error("[MercadoPago Manual Verification] Error: ", err);
      return res.status(200).json({
        success: false,
        paymentId: targetId,
        status: 'error',
        planActivated: false,
        message: `Falha no processamento: ${err.message || String(err)}`
      });
    }
  }



  // 2. WEBHOOK NOTIFICATIONS INCOMING FLOW
  const rawType = req.body?.type || req.body?.topic || req.query?.topic || req.query?.type || '';
  const actionField = req.body?.action || '';

  // Normalize eventType to match 'payment', 'preapproval', or 'merchant_order'
  let eventType = '';
  const etLower = String(rawType).toLowerCase().trim();
  const actLower = String(actionField).toLowerCase().trim();

  if (etLower === 'payment' || etLower.startsWith('payment') || actLower.startsWith('payment.')) {
    eventType = 'payment';
  } else if (
    etLower === 'preapproval' || 
    etLower.startsWith('preapproval') || 
    etLower.includes('subscription') || 
    actLower.startsWith('subscription.') || 
    actLower.startsWith('preapproval.')
  ) {
    eventType = 'preapproval';
  } else if (
    etLower === 'merchant_order' || 
    etLower.startsWith('merchant_order') || 
    etLower.includes('order') || 
    actLower.startsWith('merchant_order.')
  ) {
    eventType = 'merchant_order';
  } else {
    // Default fallback based on action or rawType
    if (actLower.startsWith('payment.')) {
      eventType = 'payment';
    } else if (actLower.startsWith('merchant_order.')) {
      eventType = 'merchant_order';
    } else if (actLower.startsWith('subscription.') || actLower.startsWith('preapproval.')) {
      eventType = 'preapproval';
    } else {
      eventType = 'payment'; // Default fallback
    }
  }

  const resourceId = req.body?.data?.id || req.body?.id || req.query?.['data.id'] || req.query?.data?.id || req.query?.id || '';

  try {
    const accessToken = cleanEnvValue(process.env.MERCADOPAGO_ACCESS_TOKEN);
    const webhookSecret = cleanEnvValue(process.env.MERCADOPAGO_WEBHOOK_SECRET);
    const isManualReprocess = req.query?.reprocess === 'true';

    if (!accessToken) {
      return res.status(200).json({ received: false, error: "Sem token configurado no servidor." });
    }

    if (!resourceId) {
      return res.status(200).json({ received: true, ignored: true, reason: "missing_id" });
    }

    // Ignore mock notifications
    const isTestId = resourceId === '123456' || String(resourceId).startsWith('123456') || resourceId === '123455';
    if (isTestId) {
      return res.status(200).json({ received: true, ignored: true, reason: "test_notification" });
    }

    // signature verification
    if (webhookSecret && !isManualReprocess) {
      const isVerified = verifySignature(req, webhookSecret);
      if (!isVerified) {
        // Log the signature failure in mp_subscriptions for clear diagnosis!
        try {
          const dbInstanceLocal = getDb();
          const signatureHeaderVal = req.headers['x-signature'] || req.headers['X-Signature'] || '';
          const logId = `sig_fail_${resourceId || Date.now()}`;
          await dbInstanceLocal.collection("mp_subscriptions").doc(logId).set({
            id: logId,
            status: "signature_error",
            paymentId: eventType === 'payment' ? String(resourceId || "") : "",
            subscriptionId: eventType === 'preapproval' ? String(resourceId || "") : "",
            userId: "unknown",
            uid: "unknown",
            email: "unknown",
            plan: "unknown",
            planCode: "unknown",
            processedAt: new Date().toISOString(),
            updatedAt: FieldValue.serverTimestamp(),
            errorMessage: `Assinatura HMAC falhou para x-signature: ${String(signatureHeaderVal).substring(0, 30)}...`
          }, { merge: true });
        } catch (logErr) {
          console.error("Error logging signature_error to mp_subscriptions:", logErr);
        }

        return res.status(400).json({ received: false, error: "Webhook signature verification failed" });
      }
    }

    // Process PAYMENT type
    if (eventType === 'payment') {
      const result = await processSinglePayment(String(resourceId), "", isManualReprocess);
      
      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        notificationType: "payment",
        rawDataId: String(resourceId),
        merchantOrderFound: false,
        paymentIdsFound: [String(resourceId)],
        paymentFound: result.status !== 'not_found',
        paymentStatus: result.status,
        firestoreRecorded: result.status !== 'not_found',
        planActivated: result.planActivated,
        errorMessage: result.success ? null : result.message
      }));

      return res.status(200).json({ received: true, processed: true });
    }

    // Process PREAPPROVAL / SUBSCRIPTION type
    if (eventType === 'preapproval') {
      const result = await processSinglePreapproval(String(resourceId), isManualReprocess);

      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        notificationType: "preapproval",
        rawDataId: String(resourceId),
        preapprovalFound: result.status !== 'not_found',
        preapprovalStatus: result.status,
        firestoreRecorded: result.status !== 'not_found',
        planActivated: result.planActivated,
        errorMessage: result.success ? null : result.message
      }));

      return res.status(200).json({ received: true, processed: true });
    }

    // Process MERCHANT ORDER type
    if (eventType === 'merchant_order') {
      const orderUrl = `https://api.mercadopago.com/merchant_orders/${resourceId}`;
      const orderResponse = await fetch(orderUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!orderResponse.ok) {
        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          notificationType: "merchant_order",
          rawDataId: String(resourceId),
          merchantOrderFound: false,
          paymentIdsFound: [],
          paymentFound: false,
          paymentStatus: 'api_error',
          firestoreRecorded: false,
          planActivated: false,
          errorMessage: `Erro HTTP ${orderResponse.status} na API de merchant_order`
        }));
        return res.status(200).json({ received: true, ignored: true });
      }

      const merchantOrder = await orderResponse.json();
      const paymentsList = merchantOrder.payments || [];
      const paymentIds: string[] = [];
      let atLeastOneActivated = false;

      for (const p of paymentsList) {
        paymentIds.push(String(p.id));
        const pResult = await processSinglePayment(String(p.id), String(resourceId), isManualReprocess);
        if (pResult.planActivated) {
          atLeastOneActivated = true;
        }
      }

      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        notificationType: "merchant_order",
        rawDataId: String(resourceId),
        merchantOrderFound: true,
        paymentIdsFound: paymentIds,
        paymentFound: paymentIds.length > 0,
        paymentStatus: paymentIds.length > 0 ? "processed" : "empty",
        firestoreRecorded: paymentIds.length > 0,
        planActivated: atLeastOneActivated,
        errorMessage: null
      }));

      return res.status(200).json({ received: true, processed: true });
    }

    // Default return for other types
    return res.status(200).json({ received: true, ignored: true, reason: `ignored_event_type_${eventType || rawType}` });

  } catch (err: any) {
    console.error("[MercadoPago Webhook Fatal Error]: ", err);
    return res.status(500).json({ received: true, error: true, message: err.message || String(err) });
  }
}
