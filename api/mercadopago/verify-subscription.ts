import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin securely and lazily
let dbInstance: any = null;

function getDb() {
  if (!dbInstance) {
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
    dbInstance = getFirestore(app, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");
  }
  return dbInstance;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "MERCADOPAGO_ACCESS_TOKEN not configured." });
  }

  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "Missing required parameter 'id' for verification." });
    }

    console.log(`[MercadoPago Verify] Querying status for ID: ${id}...`);

    let statusConsulted = 'unknown';
    let externalReference = '';
    let payerEmail = '';
    let description = '';
    let subscriptionId = '';
    let paymentId = '';
    let apiType = 'unknown';

    // 1. Attempt preapproval subscription query first
    const preapprovalUrl = `https://api.mercadopago.com/v1/preapproval/${id}`;
    let mpResponse = await fetch(preapprovalUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (mpResponse.ok) {
      apiType = 'preapproval';
      const preapproval = await mpResponse.json();
      statusConsulted = preapproval.status || 'unknown';
      externalReference = preapproval.external_reference || '';
      payerEmail = preapproval.payer_email || '';
      subscriptionId = preapproval.id || id;
      description = preapproval.reason || '';
    } else {
      // 2. Fallback to payments query
      const paymentUrl = `https://api.mercadopago.com/v1/payments/${id}`;
      mpResponse = await fetch(paymentUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (mpResponse.ok) {
        apiType = 'payment';
        const payment = await mpResponse.json();
        statusConsulted = payment.status || 'unknown';
        externalReference = payment.external_reference || '';
        payerEmail = payment.payer?.email || '';
        paymentId = String(payment.id || id);
        description = payment.description || '';
      } else {
        return res.status(404).json({ 
          error: "Não foi possível encontrar a transação correspondente no Mercado Pago (Preapproval ou Payment)." 
        });
      }
    }

    console.log(`[MercadoPago Verify] Succeeded querying Mercado Pago (${apiType}):`, {
      id,
      status: statusConsulted,
      email: payerEmail,
      externalReference
    });

    // 3. Extract user ID and plan from externalReference
    const PLANS_MAP: Record<string, {
      plan: 'pro' | 'premium';
      billingCycle: 'monthly' | 'annual';
      musicLimit: number;
      durationDays: number;
    }> = {
      pro_mensal: { plan: 'pro', billingCycle: 'monthly', musicLimit: 15, durationDays: 30 },
      premium_mensal: { plan: 'premium', billingCycle: 'monthly', musicLimit: 50, durationDays: 30 },
      pro_anual: { plan: 'pro', billingCycle: 'annual', musicLimit: 15, durationDays: 365 },
      premium_anual: { plan: 'premium', billingCycle: 'annual', musicLimit: 50, durationDays: 365 }
    };

    let userId: string | null = null;
    let explicitPlan: string | null = null;
    let explicitCycle: string | null = null;
    let planCode = '';

    if (externalReference) {
      if (externalReference.includes('|')) {
        const parts = externalReference.split('|');
        if (parts.length >= 1) userId = parts[0];
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
        if (parts.length >= 1) userId = parts[0];
        if (parts.length >= 2) explicitPlan = parts[1];
        if (parts.length >= 3) explicitCycle = parts[2];
      }
    }

    if (!userId) {
      // If we cannot connect to internal user, update the mp_subscription record only
      const subRecordRef = getDb().collection("mp_subscriptions").doc(id);
      const updateData = {
        status: statusConsulted,
        updatedAt: FieldValue.serverTimestamp()
      };
      await subRecordRef.set(updateData, { merge: true });

      return res.json({
        success: true,
        updatedLoggedTransaction: true,
        status: statusConsulted,
        message: "Status consultado e atualizado na lista de log. Nenhuma conta de usuário estava associada a este pagamento."
      });
    }

    // 4. Align plan variables
    let finalPlan = explicitPlan || 'pro';
    let billingCycle = explicitCycle || 'monthly';
    let musicLimit = finalPlan === 'premium' ? 50 : 15;

    if (!planCode) {
      planCode = `${finalPlan}_${billingCycle === 'annual' ? 'anual' : 'mensal'}`;
    }

    const isNowActive = statusConsulted === 'authorized' || statusConsulted === 'approved' || statusConsulted === 'active';
    const isInactiveOrCancelled = statusConsulted === 'paused' || statusConsulted === 'cancelled' || statusConsulted === 'inactive' || !isNowActive;

    let updatePayload: any = {};

    if (isNowActive) {
      const durationDays = PLANS_MAP[planCode]?.durationDays || 30;
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + durationDays);

      updatePayload = {
        plan: finalPlan,
        billingCycle: billingCycle,
        musicLimit: musicLimit,
        subscriptionStatus: "active",
        paymentMethod: "mercado_pago_checkout_pro",
        planActivatedAt: FieldValue.serverTimestamp(),
        planExpiresAt: expires,
        mercadoPagoPaymentId: paymentId || subscriptionId || id,
        updatedAt: FieldValue.serverTimestamp()
      };
    } else {
      updatePayload = {
        plan: "free",
        billingCycle: null,
        musicLimit: 3,
        subscriptionStatus: statusConsulted,
        updatedAt: FieldValue.serverTimestamp()
      };
    }

    if (paymentId) {
      updatePayload.mercadoPagoPaymentId = paymentId;
    }

    // 5. Update user details in dual collection synchronizers
    await getDb().collection("users").doc(userId).set(updatePayload, { merge: true });
    await getDb().collection("artists").doc(userId).set(updatePayload, { merge: true });

    // 6. Update local mp_subscriptions registry log
    await getDb().collection("mp_subscriptions").doc(id).set({
      userId,
      email: payerEmail || "unknown",
      plan: isNowActive ? finalPlan : "free",
      billingCycle: isNowActive ? billingCycle : null,
      status: statusConsulted,
      paymentId: paymentId || id,
      subscriptionId: subscriptionId || id,
      musicLimit: isNowActive ? musicLimit : 3,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    const updatedPlan = updatePayload.plan;

    return res.json({
      success: true,
      userId,
      plan: updatedPlan,
      status: statusConsulted,
      message: `Disponibilização automatizada concluída para o usuário! Plano atualizado para '${updatedPlan}' com status '${statusConsulted}'.`
    });

  } catch (err: any) {
    console.error("[MercadoPago Verify Error] Fatal failure during live check:", err);
    return res.status(500).json({ 
      error: "Falha interna ao reconsultar Mercado Pago: " + (err?.message || String(err)) 
    });
  }
}
