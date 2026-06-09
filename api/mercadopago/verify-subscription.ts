import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

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
    let userId: string | null = null;
    let explicitPlan: string | null = null;
    let explicitCycle: string | null = null;

    if (externalReference) {
      if (externalReference.includes('|')) {
        const parts = externalReference.split('|');
        if (parts.length >= 1) userId = parts[0];
        if (parts.length >= 2) {
          const planCode = parts[1];
          if (planCode.includes('pro')) {
            explicitPlan = 'pro';
          } else if (planCode.includes('premium')) {
            explicitPlan = 'premium';
          }
          if (planCode.includes('annual') || planCode.includes('year')) {
            explicitCycle = 'annual';
          } else {
            explicitCycle = 'monthly';
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
      const subRecordRef = db.collection("mp_subscriptions").doc(id);
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

    const isNowActive = statusConsulted === 'authorized' || statusConsulted === 'approved' || statusConsulted === 'active';
    const updatedPlan = isNowActive ? finalPlan : 'free';
    const updatedLimit = isNowActive ? musicLimit : 5;
    const paymentStatusField = isNowActive ? 'active' : 'inactive';

    const activatedAt = new Date();
    const expiresAt = new Date();
    if (billingCycle === 'annual') {
      expiresAt.setFullYear(activatedAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(activatedAt.getDate() + 31);
    }

    const activatedStr = activatedAt.toISOString();
    const expiresStr = expiresAt.toISOString();

    const updatePayload: any = {
      plan: updatedPlan,
      billingCycle: isNowActive ? billingCycle : 'monthly',
      musicLimit: updatedLimit,
      subscriptionStatus: isNowActive ? 'ativo' : 'cancelado',
      paymentStatus: paymentStatusField,
      accessType: isNowActive ? 'subscriber' : 'free',
      planActivatedAt: isNowActive ? activatedStr : null,
      planExpiresAt: isNowActive ? expiresStr : null,
      subscriptionStartedAt: isNowActive ? activatedStr : null,
      subscriptionEndsAt: isNowActive ? expiresStr : null,
      updatedAt: activatedStr
    };

    if (subscriptionId) updatePayload.mercadoPagoSubscriptionId = subscriptionId;
    if (paymentId) updatePayload.mercadoPagoPaymentId = paymentId;

    // 5. Update user details in dual collection synchronizers
    await db.collection("users").doc(userId).set(updatePayload, { merge: true });
    await db.collection("artists").doc(userId).set(updatePayload, { merge: true });

    // 6. Update local mp_subscriptions registry log
    await db.collection("mp_subscriptions").doc(id).set({
      userId,
      email: payerEmail || "unknown",
      plan: updatedPlan,
      billingCycle,
      status: statusConsulted,
      paymentId: paymentId || id,
      subscriptionId: subscriptionId || id,
      musicLimit: updatedLimit,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

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
