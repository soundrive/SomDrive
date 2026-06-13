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
    const signatureHeader = req.headers['x-signature'] as string || req.headers['X-Signature'] as string || '';
    if (!signatureHeader) return false;

    // Split using either comma or semicolon
    const parts = signatureHeader.includes(',') ? signatureHeader.split(',') : signatureHeader.split(';');
    let ts = '';
    let v1 = '';
    for (const part of parts) {
      const [key, val] = part.trim().split('=');
      if (key === 'ts') ts = val;
      if (key === 'v1') v1 = val;
    }

    if (!ts || !v1) return false;

    const requestId = req.headers['x-request-id'] || req.headers['X-Request-Id'] || req.headers['request-id'] || '';
    const dataId = req.body?.data?.id || req.body?.id || req.query?.['data.id'] || req.query?.data?.id || req.query?.id || '';

    if (!dataId) return false;

    const signatureTemplate = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const computedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureTemplate)
      .digest('hex');

    const isMatch = computedHash === v1;

    console.log("[MercadoPago Webhook Signature Audit]", {
      hasSignatureHeader: true,
      signatureLength: signatureHeader.length,
      ts,
      hasV1: !!v1,
      requestId,
      dataId,
      template: signatureTemplate,
      computedHashPrefix: computedHash ? computedHash.substring(0, 5) : "",
      receivedV1Prefix: v1 ? v1.substring(0, 5) : "",
      isMatch
    });

    return isMatch;
  } catch (err) {
    console.warn("[MercadoPago Webhook Signature Error] Exception during verification:", err);
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

// CORE FUNCTION: PROCESS SINGLE PAYMENT ID
async function processSinglePayment(paymentId: string, merchantOrderId = "", forceUpdate = false) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
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
    if (mpResponse.status === 404) {
      return { success: false, status: "not_found", message: "Sem correspondencia para este ID na API do MP (404)" };
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

  let planKey = (resolvedPlanCode || '').toLowerCase().trim();
  if (planKey.includes('premium')) {
    if (planKey.includes('anual') || planKey.includes('annual') || planKey.includes('yearly')) {
      planKey = 'premium_anual';
    } else {
      planKey = 'premium_mensal';
    }
  } else {
    if (planKey.includes('anual') || planKey.includes('annual') || planKey.includes('yearly')) {
      planKey = 'pro_anual';
    } else {
      planKey = 'pro_mensal';
    }
  }

  const PLANS_MAP: Record<string, {
    plan: 'PRO' | 'PREMIUM';
    musicLimit: number;
    durationDays: number;
    billingCycle: 'monthly' | 'annual';
  }> = {
    pro_mensal: { plan: 'PRO', musicLimit: 15, durationDays: 30, billingCycle: 'monthly' },
    premium_mensal: { plan: 'PREMIUM', musicLimit: 50, durationDays: 30, billingCycle: 'monthly' },
    pro_anual: { plan: 'PRO', musicLimit: 15, durationDays: 365, billingCycle: 'annual' },
    premium_anual: { plan: 'PREMIUM', musicLimit: 50, durationDays: 365, billingCycle: 'annual' },
    pro_monthly: { plan: 'PRO', musicLimit: 15, durationDays: 30, billingCycle: 'monthly' },
    premium_monthly: { plan: 'PREMIUM', musicLimit: 50, durationDays: 30, billingCycle: 'monthly' },
    pro_yearly: { plan: 'PRO', musicLimit: 15, durationDays: 365, billingCycle: 'annual' },
    premium_yearly: { plan: 'PREMIUM', musicLimit: 50, durationDays: 365, billingCycle: 'annual' }
  };

  let finalPlan: 'PRO' | 'PREMIUM' = 'PRO';
  let musicLimit = 15;
  let durationDays = 30;
  let billingCycle = 'monthly';

  const matchedConfig = PLANS_MAP[planKey];
  if (matchedConfig) {
    finalPlan = matchedConfig.plan;
    musicLimit = matchedConfig.musicLimit;
    durationDays = matchedConfig.durationDays;
    billingCycle = matchedConfig.billingCycle;
  } else {
    const dLower = description.toLowerCase();
    if (dLower.includes('premium')) {
      finalPlan = 'PREMIUM';
      musicLimit = 50;
    }
    if (dLower.includes('anual') || dLower.includes('annual') || dLower.includes('yearly') || dLower.includes('ano')) {
      billingCycle = 'annual';
      durationDays = 365;
    }
  }

  let planActivated = false;

  // Only approved status can activate a plan and only if a user is found
  if (status === 'approved' && resolvedUid) {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + durationDays);

    const updatePayload = {
      plan: finalPlan, // "PRO" or "PREMIUM"
      musicLimit: musicLimit,
      billingCycle: billingCycle,
      subscriptionStatus: "active",
      planStatus: "active",
      paymentStatus: "approved",
      mercadoPagoPaymentId: String(paymentId),
      planActivatedAt: FieldValue.serverTimestamp(),
      planStartedAt: FieldValue.serverTimestamp(),
      planExpiresAt: expires,
      accessType: "subscriber",
      subscriptionStartedAt: now.toISOString(),
      subscriptionEndsAt: expires.toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await dbInstanceLocal.collection("users").doc(resolvedUid).set(updatePayload, { merge: true });
    await dbInstanceLocal.collection("artists").doc(resolvedUid).set(updatePayload, { merge: true });
    planActivated = true;
  }

  // Save the record in mp_subscriptions
  const finalSubMap: any = {
    id: String(paymentId),
    userId: resolvedUid || "unknown",
    uid: resolvedUid || "unknown",
    email: payerEmail || "unknown",
    plan: finalPlan.toLowerCase(),
    planCode: planKey,
    billingCycle: billingCycle,
    status: status,
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

  let displayMessage = `Pagamento gravado com status '${status}' (plano não ativado).`;
  if (status === 'approved') {
    if (resolvedUid) {
      displayMessage = `Pagamento verificado com sucesso! Plano ${finalPlan} ativado para o e-mail: ${payerEmail}.`;
    } else {
      displayMessage = `Pagamento aprovado, porém nenhum usuário associado (e-mail: ${payerEmail}) foi encontrado.`;
    }
  } else if (status === 'refunded') {
    displayMessage = "O pagamento foi reembolsado e está cancelado.";
  }

  return {
    success: status === 'approved' && resolvedUid !== null,
    paymentId: String(paymentId),
    status: status,
    planActivated: planActivated,
    message: displayMessage
  };
}

export default async function handler(req: any, res: any) {
  const action = req.body?.action || req.query?.action;

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
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        return res.status(200).json({
          success: false,
          paymentId: targetId,
          status: 'unknown',
          planActivated: false,
          message: "Sem MERCADOPAGO_ACCESS_TOKEN no servidor"
        });
      }

      // Step A: Attempt processing as direct paymentId
      const paymentResult = await processSinglePayment(targetId, "", true);
      
      if (paymentResult.status !== 'not_found' && paymentResult.success !== undefined) {
        // Log SECURE JSON trace
        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          manualVerificationRequested: true,
          paymentId: targetId,
          paymentFound: true,
          paymentStatus: paymentResult.status,
          firebaseAdminInitialized: true,
          resolvedUid: null,
          resolvedPlanCode: null,
          firestoreUpdated: paymentResult.planActivated,
          alreadyProcessed: !!paymentResult.alreadyProcessed,
          errorMessage: null
        }));

        return res.status(200).json(paymentResult);
      }

      // Step B: If payment ID returned 404, check as merchant_order
      const orderUrl = `https://api.mercadopago.com/merchant_orders/${targetId}`;
      const orderResponse = await fetch(orderUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (orderResponse.ok) {
        const merchantOrder = await orderResponse.json();
        const paymentsList = merchantOrder.payments || [];

        if (paymentsList.length === 0) {
          console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
            manualVerificationRequested: true,
            paymentId: targetId,
            paymentFound: false,
            paymentStatus: 'not_found',
            firebaseAdminInitialized: true,
            resolvedUid: null,
            resolvedPlanCode: null,
            firestoreUpdated: false,
            alreadyProcessed: false,
            errorMessage: "Ordem encontrada mas sem pagamentos"
          }));

          return res.status(200).json({
            success: false,
            paymentId: targetId,
            status: 'pending',
            planActivated: false,
            message: "Essa ordem de compra foi localizada no Mercado Pago, mas ainda não possui nenhum pagamento aprovado vinculado a ela."
          });
        }

        let atLeastOneActivated = false;
        let lastStatus = 'unknown';

        for (const p of paymentsList) {
          const pResult = await processSinglePayment(String(p.id), targetId, true);
          if (pResult.planActivated) {
            atLeastOneActivated = true;
          }
          lastStatus = pResult.status;
        }

        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          manualVerificationRequested: true,
          paymentId: targetId,
          paymentFound: true,
          paymentStatus: lastStatus,
          firebaseAdminInitialized: true,
          resolvedUid: null,
          resolvedPlanCode: null,
          firestoreUpdated: atLeastOneActivated,
          alreadyProcessed: false,
          errorMessage: null
        }));

        return res.status(200).json({
          success: true,
          paymentId: targetId,
          status: lastStatus,
          planActivated: atLeastOneActivated,
          message: `Código de Ordem de Compra identificado com sucesso! Sincronizado ${paymentsList.length} pagamento(s).`
        });
      }

      // Step C: If both are 404
      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        manualVerificationRequested: true,
        paymentId: targetId,
        paymentFound: false,
        paymentStatus: 'not_found',
        firebaseAdminInitialized: true,
        resolvedUid: null,
        resolvedPlanCode: null,
        firestoreUpdated: false,
        alreadyProcessed: false,
        errorMessage: "Id nao encontrado em payments nem merchant_orders"
      }));

      return res.status(200).json({
        success: false,
        paymentId: targetId,
        status: 'not_found',
        planActivated: false,
        message: "Identificador não encontrado como paymentId nem merchantOrderId."
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
  const eventType = req.body?.type || req.body?.topic || req.query?.topic || req.query?.type || 'payment';
  const resourceId = req.body?.data?.id || req.body?.id || req.query?.['data.id'] || req.query?.data?.id || req.query?.id || '';

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
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
    return res.status(200).json({ received: true, ignored: true, reason: `ignored_event_type_${eventType}` });

  } catch (err: any) {
    console.error("[MercadoPago Webhook Fatal Error]: ", err);
    return res.status(500).json({ received: true, error: true, message: err.message || String(err) });
  }
}
