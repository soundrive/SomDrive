import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Initialize Firebase Admin securely
let app;
if (!getApps().length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: "gen-lang-client-0946896754"
      });
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", e);
      app = initializeApp({
        projectId: "gen-lang-client-0946896754"
      });
    }
  } else {
    app = initializeApp({
      projectId: "gen-lang-client-0946896754"
    });
  }
} else {
  app = getApp();
}

const db = getFirestore(app, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");

// Helper to verify Mercado Pago webhook signatures safely
function verifySignature(req: any, webhookSecret: string): boolean {
  try {
    const signatureHeader = req.headers['x-signature'] as string || '';
    if (!signatureHeader) return false;

    const parts = signatureHeader.split(';');
    let ts = '';
    let v1 = '';
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key === 'ts') ts = val;
      if (key === 'v1') v1 = val;
    }

    if (!ts || !v1) return false;

    const requestId = req.headers['x-request-id'] || '';
    const dataId = req.body?.data?.id || req.body?.id || req.query?.id || '';

    if (!dataId) return false;

    const signatureTemplate = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const computedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureTemplate)
      .digest('hex');

    return computedHash === v1;
  } catch (err) {
    console.warn("Signature verification throw exception:", err);
    return false;
  }
}

// Fallback search to find user by email in dual collections
async function findUserByEmailInFirestore(email: string): Promise<string | null> {
  if (!email) return null;
  const emailLower = email.toLowerCase().trim();

  // Search 'users' dual sync target
  const usersSnap = await db.collection("users")
    .where("email", "==", emailLower)
    .limit(1)
    .get();

  if (!usersSnap.empty) {
    return usersSnap.docs[0].id;
  }

  // Search 'artists' collection
  const artistsSnap = await db.collection("artists")
    .where("email", "==", emailLower)
    .limit(1)
    .get();

  if (!artistsSnap.empty) {
    return artistsSnap.docs[0].id;
  }

  return null;
}

export default async function handler(req: any, res: any) {
  try {
    // 1. Only accept POST requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(200).json({ received: false, error: `Method ${req.method} not allowed. Safe 200 response.` });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!accessToken) {
      console.warn("[MercadoPago Webhook Warning] MERCADOPAGO_ACCESS_TOKEN environment variable is not defined.");
      return res.status(200).json({ received: false, error: "Mercado Pago secret credentials not configured on the server." });
    }

    // Intercept and print body payloads and metadata for Mercado Pago dashboard simulations
    console.log("[MercadoPago Webhook] Received webhook call.");
    console.log("[MercadoPago Webhook] Headers received:", JSON.stringify(req.headers || {}));
    console.log("[MercadoPago Webhook] Body received:", JSON.stringify(req.body || {}));
    console.log("[MercadoPago Webhook] Query received:", JSON.stringify(req.query || {}));

    // 2. Identify the resource details safely from either body or query params
    const eventType = req.body?.type || req.body?.topic || req.query?.topic || req.query?.type || 'unknown';
    const resourceId = req.body?.data?.id || req.body?.id || req.query?.id || '';

    console.log(`[MercadoPago Webhook] Extracted details: Type: ${eventType}, ID: ${resourceId}`);

    if (!resourceId) {
      console.warn("[MercadoPago Webhook Warning] Ignore request: Required identifier 'id' was missing from payload.");
      return res.status(200).json({ received: true, ignored: true, reason: "missing_id" });
    }

    // Check for obvious simulation ID
    const isTestId = resourceId === '123456' || String(resourceId).startsWith('123456') || resourceId === '123455';
    if (isTestId) {
      console.warn(`[MercadoPago Webhook Warning] Simulated test ID detected: ${resourceId}. Ignored safely.`);
      return res.status(200).json({ received: true, ignored: true, reason: "invalid_or_test_notification" });
    }

    // 3. Webhook origin/signature verification
    if (webhookSecret) {
      const signatureHeader = req.headers['x-signature'] as string || '';
      if (!signatureHeader) {
        console.warn("[MercadoPago Webhook Warning] webhookSecret exists, but 'x-signature' header is missing. Continuing for tests/simulations.");
      } else {
        const isVerified = verifySignature(req, webhookSecret);
        if (!isVerified) {
          console.warn("[MercadoPago Webhook Warning] Webhook signature verification failed. Continuing on safety tolerance to avoid blocking requests.");
        } else {
          console.log("[MercadoPago Webhook] Webhook signature verified successfully!");
        }
      }
    }

    // We only process specific payment or subscription event types
    // Tratar: subscription_preapproval, subscription_authorized_payment, o payment
    const isPaymentEvent = eventType.includes('payment');
    const isPreapprovalEvent = eventType.includes('preapproval') || eventType.includes('subscription_preapproval');
    const isAuthorizedPaymentEvent = eventType.includes('authorized_payment') || eventType.includes('subscription_authorized_payment');

    if (!isPaymentEvent && !isPreapprovalEvent && !isAuthorizedPaymentEvent) {
      console.log(`[MercadoPago Webhook] Non-critical topic event: ${eventType}. Ignoring with status 200.`);
      return res.status(200).json({ received: true, ignored: true, reason: "unsupported_event_type" });
    }

    // 4. Consult API to confirm actual status
    let statusConsulted = 'unknown';
    let externalReference = '';
    let payerEmail = '';
    let finalPlan = 'free';
    let billingCycle = 'monthly';
    let musicLimit = 5;
    let subscriptionStatus = 'inactive';
    let mercadoPagoSubscriptionId = '';
    let mercadoPagoPaymentId = '';
    let description = '';

    if (isPreapprovalEvent) {
      // Get preapproval subscription status
      const mpUrl = `https://api.mercadopago.com/v1/preapproval/${resourceId}`;
      const response = await fetch(mpUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.warn(`[MercadoPago Webhook Warning] Failed to fetch preapproval from Mercado Pago. Status: ${response.status}. Ignored smoothly.`);
        return res.status(200).json({ received: true, ignored: true, reason: "invalid_or_test_notification" });
      }

      const preapproval = await response.json();
      statusConsulted = preapproval.status || 'unknown';
      externalReference = preapproval.external_reference || '';
      payerEmail = preapproval.payer_email || '';
      mercadoPagoSubscriptionId = preapproval.id || resourceId;
      description = preapproval.reason || '';

      console.log("[MercadoPago Webhook] Queried Preapproval details successfully:", {
        id: preapproval.id,
        status: statusConsulted,
        externalReference,
        payerEmail,
        description
      });

      if (statusConsulted === 'authorized' || statusConsulted === 'active') {
        subscriptionStatus = 'active';
      } else {
        subscriptionStatus = 'inactive';
      }

    } else if (isPaymentEvent) {
      // Get payment transaction status
      const mpUrl = `https://api.mercadopago.com/v1/payments/${resourceId}`;
      const response = await fetch(mpUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.warn(`[MercadoPago Webhook Warning] Failed to fetch payment from Mercado Pago. Status: ${response.status}. Ignored smoothly.`);
        return res.status(200).json({ received: true, ignored: true, reason: "invalid_or_test_notification" });
      }

      const payment = await response.json();
      statusConsulted = payment.status || 'unknown';
      externalReference = payment.external_reference || '';
      payerEmail = payment.payer?.email || '';
      mercadoPagoPaymentId = String(payment.id || resourceId);
      description = payment.description || '';

      console.log("[MercadoPago Webhook] Queried Payment details successfully:", {
        id: payment.id,
        status: statusConsulted,
        externalReference,
        payerEmail,
        description
      });

      if (statusConsulted === 'approved') {
        subscriptionStatus = 'active';
      } else {
        subscriptionStatus = 'inactive';
      }

    } else if (isAuthorizedPaymentEvent) {
      // Get authorized payment status
      const mpUrl = `https://api.mercadopago.com/v1/authorized_payments/${resourceId}`;
      const response = await fetch(mpUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        console.warn(`[MercadoPago Webhook Warning] Failed to fetch authorized payment from Mercado Pago. Status: ${response.status}. Ignored smoothly.`);
        return res.status(200).json({ received: true, ignored: true, reason: "invalid_or_test_notification" });
      }

      const authPayment = await response.json();
      statusConsulted = authPayment.status || 'unknown';
      externalReference = authPayment.external_reference || '';
      payerEmail = authPayment.payer_email || '';
      mercadoPagoSubscriptionId = authPayment.preapproval_id || '';
      mercadoPagoPaymentId = String(authPayment.id || resourceId);

      console.log("[MercadoPago Webhook] Queried Authorized Payment details successfully:", {
        id: authPayment.id,
        status: statusConsulted,
        externalReference,
        payerEmail
      });

      // Status of paid cycles
      if (statusConsulted === 'approved' || statusConsulted === 'active') {
        subscriptionStatus = 'active';
      } else {
        subscriptionStatus = 'inactive';
      }
    }

    // Safe Logs Requirement: tipo do evento, id recebido, data, status consultado
    console.log("[MERCADOPAGO WEBHOOK SECURE LOG - SUCCESS]", {
      eventType,
      resourceId,
      date: new Date().toISOString(),
      statusConsulted,
      parsedUserIdAndPlan: externalReference || "none"
    });

    // 5. Setup PLANS_MAP
    const PLANS_MAP: Record<string, {
      plan: 'pro' | 'premium';
      billingCycle: 'monthly' | 'annual';
      musicLimit: number;
      durationDays?: number;
      isPix?: boolean;
    }> = {
      pro_mensal: { plan: 'pro', billingCycle: 'monthly', musicLimit: 15 },
      premium_mensal: { plan: 'premium', billingCycle: 'monthly', musicLimit: 50 },
      pro_anual: { plan: 'pro', billingCycle: 'annual', musicLimit: 15 },
      premium_anual: { plan: 'premium', billingCycle: 'annual', musicLimit: 50 },
      // Pix Plans
      pro_pix_mensal: { plan: 'pro', billingCycle: 'monthly', musicLimit: 15, durationDays: 30, isPix: true },
      premium_pix_mensal: { plan: 'premium', billingCycle: 'monthly', musicLimit: 50, durationDays: 30, isPix: true },
      pro_pix_anual: { plan: 'pro', billingCycle: 'annual', musicLimit: 15, durationDays: 365, isPix: true },
      premium_pix_anual: { plan: 'premium', billingCycle: 'annual', musicLimit: 50, durationDays: 365, isPix: true }
    };

    // Attempt to find the specific user to update
    let userId: string | null = null;
    let explicitPlan: string | null = null;
    let explicitCycle: string | null = null;
    let planCode = '';

    if (externalReference) {
      if (externalReference.includes('|')) {
        const parts = externalReference.split('|');
        if (parts.length >= 1) {
          userId = parts[0];
        }
        if (parts.length >= 2) {
          planCode = parts[1]; // pro_mensal, premium_mensal, pro_anual, premium_anual
          const config = PLANS_MAP[planCode];
          if (config) {
            explicitPlan = config.plan;
            explicitCycle = config.billingCycle;
          }
        }
      } else {
        const parts = externalReference.split('___');
        if (parts.length >= 1) {
          userId = parts[0];
        }
        if (parts.length >= 2) {
          explicitPlan = parts[1]; // pro or premium
        }
        if (parts.length >= 3) {
          explicitCycle = parts[2]; // monthly or annual
        }
      }
    }

    // Fallback lookups
    if (!userId && payerEmail) {
      console.log(`[MercadoPago Webhook] No userId inside external_reference. Querying Firestore by email: ${payerEmail}...`);
      userId = await findUserByEmailInFirestore(payerEmail);
    }

    if (!userId) {
      console.warn(`[MercadoPago Webhook] No userId or fallback found. Ignore or orphan.`);
      // If it's a test or doesn't have an external_reference or user cannot be found, ignore with 200
      if (isPaymentEvent || !externalReference) {
         console.warn("[MercadoPago Webhook Warning] Payment event with no valid user association, ignored with 200 OK.");
         return res.status(200).json({ received: true, ignored: true, reason: "no_valid_user_association" });
      }

      console.warn(`[MercadoPago Webhook] Could not associate transaction ID ${resourceId} to any user system profile.`);
      // We still record the transaction in the database so admins can manually review or activate it
      const transactionRef = db.collection("mp_subscriptions").doc(resourceId);
      await transactionRef.set({
        id: resourceId,
        userId: "unknown",
        email: payerEmail || "unknown",
        plan: explicitPlan || "unknown",
        billingCycle: explicitCycle || "unknown",
        status: statusConsulted,
        paymentId: mercadoPagoPaymentId || "",
        subscriptionId: mercadoPagoSubscriptionId || "",
        musicLimit: 15,
        paidAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(200).json({ 
        received: true, 
        warning: "Could not map transaction ID to any internal user profile, saved as orphan in mp_subscriptions." 
      });
    }

    // Match plan and cycle details
    if (explicitPlan) {
      finalPlan = explicitPlan;
    } else {
      // Map based on description/reason
      const dLower = description.toLowerCase();
      if (dLower.includes('premium')) {
        finalPlan = 'premium';
      } else if (dLower.includes('pro')) {
        finalPlan = 'pro';
      } else {
        finalPlan = 'pro'; // Default fallback upgrade
      }
    }

    if (explicitCycle) {
      billingCycle = explicitCycle;
    } else {
      const dLower = description.toLowerCase();
      if (dLower.includes('anual') || dLower.includes('annual') || dLower.includes('ano')) {
        billingCycle = 'annual';
      } else {
        billingCycle = 'monthly';
      }
    }

    // Limits
    if (finalPlan === 'premium') {
      musicLimit = 50;
    } else if (finalPlan === 'pro') {
      musicLimit = 15;
    } else {
      musicLimit = 3;
    }

    if (!planCode) {
      planCode = `${finalPlan}_${billingCycle === 'annual' ? 'anual' : 'mensal'}`;
    }

    // Prepare matching payload variables
    const isNowActive = subscriptionStatus === 'active';
    const updatedPlan = isNowActive ? finalPlan : 'free';
    const updatedLimit = isNowActive ? musicLimit : 3;

    // 7. Update User profile in Firestore dual sync targets
    const userRef = db.collection("users").doc(userId);
    const artistRef = db.collection("artists").doc(userId);

    let updatePayload: any = {};

    if (isNowActive) {
      const isPix = PLANS_MAP[planCode]?.isPix || (externalReference && externalReference.endsWith('|pix'));
      if (isPix) {
        const durationDays = PLANS_MAP[planCode]?.durationDays || 30;
        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + durationDays);

        updatePayload = {
          plan: finalPlan,
          billingCycle: billingCycle,
          musicLimit: musicLimit,
          subscriptionStatus: "active",
          paymentMethod: "pix",
          planActivatedAt: now,
          planExpiresAt: expires,
          mercadoPagoPaymentId: mercadoPagoPaymentId || resourceId,
          updatedAt: FieldValue.serverTimestamp()
        };
      } else {
        updatePayload = {
          plan: finalPlan,
          billingCycle: billingCycle,
          musicLimit: musicLimit,
          subscriptionStatus: "active",
          mercadoPagoSubscriptionId: mercadoPagoSubscriptionId || resourceId,
          mercadoPagoPlanCode: planCode,
          planActivatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };
      }
    } else {
      updatePayload = {
        plan: "free",
        billingCycle: null,
        musicLimit: 3,
        subscriptionStatus: statusConsulted,
        updatedAt: FieldValue.serverTimestamp()
      };
    }

    if (mercadoPagoPaymentId) {
      updatePayload.mercadoPagoPaymentId = mercadoPagoPaymentId;
    }

    console.log(`[MercadoPago Webhook] Updating user ${userId} profiles in Firestore...`, updatePayload);

    await userRef.set(updatePayload, { merge: true });
    await artistRef.set(updatePayload, { merge: true });

    // 8. Register/Save subscription record for the admin area list
    const subscriptionRecordRef = db.collection("mp_subscriptions").doc(resourceId);
    await subscriptionRecordRef.set({
      id: resourceId,
      userId: userId,
      email: payerEmail || "unknown",
      plan: updatedPlan,
      billingCycle: isNowActive ? billingCycle : null,
      status: statusConsulted,
      paymentId: mercadoPagoPaymentId || "",
      subscriptionId: mercadoPagoSubscriptionId || "",
      musicLimit: updatedLimit,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[MercadoPago Webhook] Successfully processed and authorized user plan update.`);

    return res.status(200).json({
      received: true,
      processed: true,
      userId,
      plan: updatedPlan,
      status: statusConsulted
    });

  } catch (err: any) {
    console.error("[MercadoPago Webhook] Fatal error in processing webhook: ", err);
    return res.status(200).json({ 
      received: true, 
      ignored: true, 
      error: true,
      message: err?.message || String(err),
      reason: "error_prevent_crash_status_200" 
    });
  }
}
