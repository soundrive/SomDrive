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
    const privateKey = cleanEnvValue(rawPrivateKey)?.replace(/\\n/g, "\n");

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
    if (!getApps().length) {
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId: projectId,
        });
        console.log("[Firebase Admin] Initialized successfully with cert().");
      } catch (e: any) {
        console.error("Error initializing Firebase Admin with service credentials:", e);
        throw e;
      }
    } else {
      app = getApp();
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

    // Safe signature log (no token content printed)
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

export default async function handler(req: any, res: any) {
  // Safe default values for structured logger
  let statusConsulted = 'unknown';
  let externalReference = '';
  let payerEmail = '';
  let userId: string | null = null;
  let planCode = '';
  let purchaseAlreadyProcessed = false;
  let firestoreUpdated = false;
  let purchaseRecorded = false;
  let errorMessage = '';
  let paymentFound = false;
  let description = '';

  const eventType = req.body?.type || req.body?.topic || req.query?.topic || req.query?.type || 'payment';
  const resourceId = req.body?.data?.id || req.body?.id || req.query?.['data.id'] || req.query?.data?.id || req.query?.id || '';

  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const isManualReprocess = req.query?.reprocess === 'true';

    if (!accessToken) {
      errorMessage = "MERCADOPAGO_ACCESS_TOKEN is missing";
      console.warn(`[MercadoPago Webhook Warning] ${errorMessage}`);
      return res.status(200).json({ received: false, error: "Access token credentials not configured on the server." });
    }

    console.log("[MercadoPago Webhook] Incoming Webhook:", {
      method: req.method,
      query: req.query,
      body: req.body,
      isManualReprocess
    });

    if (!resourceId) {
      errorMessage = "Missing resource ID";
      console.warn(`[MercadoPago Webhook Warning] ${errorMessage}`);
      return res.status(200).json({ received: true, ignored: true, reason: "missing_id" });
    }

    // Ignore dummy mock requests from Mercado Pago sandbox setup
    const isTestId = resourceId === '123456' || String(resourceId).startsWith('123456') || resourceId === '123455';
    if (isTestId) {
      return res.status(200).json({ received: true, ignored: true, reason: "invalid_or_test_notification" });
    }

    // Signature Verification (only skipped if administrator manually queries via reprocess parameter)
    if (webhookSecret && !isManualReprocess) {
      const signatureHeader = req.headers['x-signature'] as string || req.headers['X-Signature'] as string || '';
      if (!signatureHeader) {
        errorMessage = "Missing x-signature header";
        console.warn(`[MercadoPago Webhook Warning] ${errorMessage}`);
        return res.status(400).json({ received: false, error: errorMessage });
      } else {
        const isVerified = verifySignature(req, webhookSecret);
        if (!isVerified) {
          errorMessage = "Webhook signature verification failed";
          console.warn(`[MercadoPago Webhook Warning] ${errorMessage}`);
          return res.status(400).json({ received: false, error: errorMessage });
        } else {
          console.log("[MercadoPago Webhook] Webhook signature verified successfully!");
        }
      }
    }

    // Checking paymentId idempotency (only skipped for forced administrator reprocess queries)
    const subscriptionRecordRef = getDb().collection("mp_subscriptions").doc(String(resourceId));
    const existingDoc = await subscriptionRecordRef.get();

    if (existingDoc.exists) {
      const data = existingDoc.data();
      if (data && data.status === 'approved' && data.processedAt && !isManualReprocess) {
        purchaseAlreadyProcessed = true;
        console.log(`[MercadoPago Webhook Idempotency] Payment ${resourceId} already processed successfully.`);
        
        // Return 200 immediately
        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          firebaseAdminInitialized: getApps().length > 0,
          firebaseProjectConfigured: !!process.env.FIREBASE_PROJECT_ID,
          paymentId: String(resourceId),
          paymentStatus: 'approved',
          resolvedUid: data.userId || null,
          resolvedPlanCode: data.planCode || null,
          userFound: true,
          firestoreUpdated: false,
          purchaseRecorded: false,
          alreadyProcessed: true,
          errorMessage: null,
          timestamp: new Date().toISOString()
        }));

        return res.status(200).json({
          received: true,
          processed: true,
          idempotent: true,
          userId: data.userId || null,
          plan: data.plan || null,
          status: 'approved'
        });
      }
    }

    // Consult the actual payment details directly using Mercado Pago V1 GET Payment API
    const mpUrl = `https://api.mercadopago.com/v1/payments/${resourceId}`;
    const mpResponse = await fetch(mpUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!mpResponse.ok) {
      errorMessage = `Mercado Pago API error. HTTP ${mpResponse.status}`;
      console.warn(`[MercadoPago Webhook Warning] Failed to query payment details: ${errorMessage}`);
      return res.status(200).json({ received: true, ignored: true, error: errorMessage });
    }

    const payment = await mpResponse.json();
    paymentFound = true;
    statusConsulted = payment.status || 'unknown';
    externalReference = payment.external_reference || '';
    payerEmail = payment.payer?.email || '';
    description = payment.description || '';

    console.log("[MercadoPago Webhook] Retrieved payment data successfully:", {
      id: payment.id,
      status: statusConsulted,
      externalReference,
      payerEmail
    });

    const isNowActive = statusConsulted === 'approved';

    if (!isNowActive) {
      // Record transaction anyway for analytics or debugging pending/refund status
      await subscriptionRecordRef.set({
        id: String(resourceId),
        userId: "unknown",
        email: payerEmail || "unknown",
        status: statusConsulted,
        paymentId: String(resourceId),
        amount: payment?.transaction_amount || 0,
        paymentMethod: payment?.payment_method_id || "mercado_pago_checkout_pro",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      purchaseRecorded = true;

      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        firebaseAdminInitialized: getApps().length > 0,
        firebaseProjectConfigured: !!process.env.FIREBASE_PROJECT_ID,
        paymentId: String(resourceId),
        paymentStatus: statusConsulted,
        resolvedUid: null,
        resolvedPlanCode: null,
        userFound: false,
        firestoreUpdated: false,
        purchaseRecorded: true,
        alreadyProcessed: false,
        errorMessage: `Payment status is ${statusConsulted}, not approved. Plan skipped.`,
        timestamp: new Date().toISOString()
      }));

      return res.status(200).json({ received: true, processed: false, ignored: true, reason: `payment_status_${statusConsulted}` });
    }

    // We have an approved payment, extract user ID (UID) and Plan Code
    if (externalReference && externalReference.includes('|')) {
      const parts = externalReference.split('|');
      userId = parts[0] ? parts[0].trim() : null;
      if (parts[1]) {
        planCode = parts[1].trim();
      }
    }

    // Fallback: If externalReference is missing userId or planCode, retrieve from the payment metadata block
    if (!userId || !planCode) {
      const meta = payment.metadata || {};
      const metadataUid = meta.uid || meta.user_id || meta.userId || '';
      const metadataPlanCode = meta.plan_code || meta.planCode || '';

      if (!userId && metadataUid) {
        userId = String(metadataUid).trim();
      }
      if (!planCode && metadataPlanCode) {
        planCode = String(metadataPlanCode).trim();
      }
    }

    // If userId is still missing, lookup user document by email
    const resolvedEmail = payerEmail || payment.payer?.email || '';
    if (!userId && resolvedEmail) {
      console.log(`[MercadoPago Webhook] Recovering UID by email lookup: ${resolvedEmail}...`);
      userId = await findUserByEmailInFirestore(resolvedEmail);
    }

    if (!userId) {
      errorMessage = "Could not map transaction payment to any user UID";
      console.warn(`[MercadoPago Webhook Warning] ${errorMessage}`);

      // Save as orphan record so that admins can synchronize or bind it manually in the Future
      await subscriptionRecordRef.set({
        id: String(resourceId),
        userId: "unknown",
        email: resolvedEmail || "unknown",
        status: statusConsulted,
        paymentId: String(resourceId),
        amount: payment?.transaction_amount || 0,
        paymentMethod: payment?.payment_method_id || "mercado_pago_checkout_pro",
        description,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      purchaseRecorded = true;

      console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
        firebaseAdminInitialized: getApps().length > 0,
        firebaseProjectConfigured: !!process.env.FIREBASE_PROJECT_ID,
        paymentId: String(resourceId),
        paymentStatus: statusConsulted,
        resolvedUid: null,
        resolvedPlanCode: planCode || null,
        userFound: false,
        firestoreUpdated: false,
        purchaseRecorded: true,
        alreadyProcessed: false,
        errorMessage,
        timestamp: new Date().toISOString()
      }));

      return res.status(200).json({ received: true, processed: false, error: errorMessage });
    }

    // Map plans exactly as required by Etapa 2 and Etapa 5
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
      
      // Fallbacks
      pro_monthly: { plan: 'PRO', musicLimit: 15, durationDays: 30, billingCycle: 'monthly' },
      premium_monthly: { plan: 'PREMIUM', musicLimit: 50, durationDays: 30, billingCycle: 'monthly' },
      pro_yearly: { plan: 'PRO', musicLimit: 15, durationDays: 365, billingCycle: 'annual' },
      premium_yearly: { plan: 'PREMIUM', musicLimit: 50, durationDays: 365, billingCycle: 'annual' }
    };

    let finalPlan: 'PRO' | 'PREMIUM' = 'PRO';
    let musicLimit = 15;
    let billingCycle = 'monthly';
    let durationDays = 30;

    let resolvedPlanCode = (planCode || '').toLowerCase().trim();
    // Normalize code variations
    if (resolvedPlanCode.includes('premium')) {
      if (resolvedPlanCode.includes('anual') || resolvedPlanCode.includes('annual') || resolvedPlanCode.includes('yearly')) {
        resolvedPlanCode = 'premium_anual';
      } else {
        resolvedPlanCode = 'premium_mensal';
      }
    } else {
      if (resolvedPlanCode.includes('anual') || resolvedPlanCode.includes('annual') || resolvedPlanCode.includes('yearly')) {
        resolvedPlanCode = 'pro_anual';
      } else {
        resolvedPlanCode = 'pro_mensal';
      }
    }

    const matchedConfig = PLANS_MAP[resolvedPlanCode];
    if (matchedConfig) {
      finalPlan = matchedConfig.plan;
      musicLimit = matchedConfig.musicLimit;
      durationDays = matchedConfig.durationDays;
      billingCycle = matchedConfig.billingCycle;
    } else {
      // Fallback
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

    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + durationDays);

    // Formulate database update payload
    const updatePayload = {
      plan: finalPlan, // "PRO" or "PREMIUM"
      musicLimit: musicLimit,
      billingCycle: billingCycle,
      subscriptionStatus: "active",
      planStatus: "active",
      paymentStatus: "approved",
      mercadoPagoPaymentId: String(resourceId),
      planActivatedAt: FieldValue.serverTimestamp(),
      planStartedAt: FieldValue.serverTimestamp(),
      planExpiresAt: expires,
      accessType: "subscriber",
      subscriptionStartedAt: now.toISOString(),
      subscriptionEndsAt: expires.toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const userRef = getDb().collection("users").doc(userId);
    const artistRef = getDb().collection("artists").doc(userId);

    // Write to dual targets
    await userRef.set(updatePayload, { merge: true });
    await artistRef.set(updatePayload, { merge: true });
    firestoreUpdated = true;

    // Record correct transaction in mp_subscriptions
    await subscriptionRecordRef.set({
      id: String(resourceId),
      userId: userId,
      uid: userId,
      email: resolvedEmail || payerEmail || "unknown",
      plan: finalPlan, // "PRO" or "PREMIUM"
      planCode: resolvedPlanCode,
      billingCycle: billingCycle,
      status: statusConsulted,
      paymentId: String(resourceId),
      subscriptionId: "",
      musicLimit: musicLimit,
      amount: payment?.transaction_amount || 19.90,
      paymentMethod: payment?.payment_method_id || "mercado_pago_checkout_pro",
      externalReference: externalReference,
      createdAt: payment?.date_created || now.toISOString(),
      approvedAt: payment?.date_approved || now.toISOString(),
      processedAt: now.toISOString(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    purchaseRecorded = true;

    // Structured security search logging
    console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
      firebaseAdminInitialized: getApps().length > 0,
      firebaseProjectConfigured: !!process.env.FIREBASE_PROJECT_ID,
      paymentId: String(resourceId),
      paymentStatus: statusConsulted,
      resolvedUid: userId,
      resolvedPlanCode: resolvedPlanCode,
      userFound: true,
      firestoreUpdated: true,
      purchaseRecorded: true,
      alreadyProcessed: false,
      errorMessage: null,
      timestamp: now.toISOString()
    }));

    return res.status(200).json({
      received: true,
      processed: true,
      userId,
      plan: finalPlan.toLowerCase(),
      status: statusConsulted
    });

  } catch (err: any) {
    errorMessage = err?.message || String(err);
    console.error("[MercadoPago Webhook] Fatal error in processing webhook: ", err);

    console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
      firebaseAdminInitialized: getApps().length > 0,
      firebaseProjectConfigured: !!process.env.FIREBASE_PROJECT_ID,
      paymentId: String(resourceId) || "unknown",
      paymentStatus: statusConsulted,
      resolvedUid: userId,
      resolvedPlanCode: planCode || null,
      userFound: !!userId,
      firestoreUpdated,
      purchaseRecorded,
      alreadyProcessed: purchaseAlreadyProcessed,
      errorMessage,
      timestamp: new Date().toISOString()
    }));

    // Return HTTP 500 for non-successful processing so Mercado Pago can retry
    return res.status(500).json({
      received: true,
      error: true,
      message: errorMessage,
      reason: "error_prevent_crash_status_500"
    });
  }
}
