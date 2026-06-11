import dotenv from 'dotenv';
import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

dotenv.config();

// Firestore reference initializer helper (compatible with server.ts setup)
function getDbRef() {
  const dbId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
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
  return getFirestore(app, dbId);
}

export default async function handler(req: any, res: any) {
  // Only accept GET queries
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const { paymentId } = req.query || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Parâmetro 'paymentId' obrigatório ausente." });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ error: "Mercado Pago credentials not configured on the server." });
  }

  try {
    const mpUrl = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    const mpResponse = await fetch(mpUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!mpResponse.ok) {
      return res.status(mpResponse.status).json({ 
        error: `Erro ao obter status do pagamento no Mercado Pago. Status: ${mpResponse.status}` 
      });
    }

    const payData = await mpResponse.json();
    const status = payData.status; // pending, approved, rejected, cancelled, expired
    const externalReference = payData.external_reference;

    console.log("[MercadoPago Verify Pix] Consulted status:", { paymentId, status, externalReference });

    // If approved, verify and optionally force Firestore update to guarantee instant UI sync
    if (status === 'approved' && externalReference && externalReference.includes('|')) {
      const parts = externalReference.split('|');
      const userId = parts[0];
      const planCode = parts[1];

      const PLANS_MAP: Record<string, {
        plan: 'pro' | 'premium';
        billingCycle: 'monthly' | 'annual';
        musicLimit: number;
        durationDays: number;
      }> = {
        pro_pix_mensal: { plan: 'pro', billingCycle: 'monthly', musicLimit: 15, durationDays: 30 },
        premium_pix_mensal: { plan: 'premium', billingCycle: 'monthly', musicLimit: 50, durationDays: 30 },
        pro_pix_anual: { plan: 'pro', billingCycle: 'annual', musicLimit: 15, durationDays: 365 },
        premium_pix_anual: { plan: 'premium', billingCycle: 'annual', musicLimit: 50, durationDays: 365 }
      };

      const config = PLANS_MAP[planCode];
      if (config) {
        const db = getDbRef();
        const userRef = db.collection("users").doc(userId);
        const artistRef = db.collection("artists").doc(userId);

        // Calculate expiresAt safety
        const durationDays = config.durationDays;
        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + durationDays);

        const updatePayload = {
          plan: config.plan,
          billingCycle: config.billingCycle,
          musicLimit: config.musicLimit,
          subscriptionStatus: "active",
          paymentMethod: "pix",
          planActivatedAt: now,
          planExpiresAt: expires,
          mercadoPagoPaymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp()
        };

        // Instant update Firestore docs
        await userRef.set(updatePayload, { merge: true });
        await artistRef.set(updatePayload, { merge: true });

        // Save entry in mp_subscriptions
        const subRecordRef = db.collection("mp_subscriptions").doc(String(paymentId));
        await subRecordRef.set({
          id: String(paymentId),
          userId: userId,
          email: payData.payer?.email || "unknown",
          plan: config.plan,
          billingCycle: config.billingCycle,
          status: "approved",
          paymentId: String(paymentId),
          subscriptionId: "",
          musicLimit: config.musicLimit,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("[MercadoPago Verify Pix] Synced and unlocked user plan via instant verification", userId);
      }
    }

    return res.json({
      success: true,
      paymentId: paymentId,
      status: status,
      isApproved: status === 'approved'
    });

  } catch (err: any) {
    console.error("[MercadoPago Verify Pix] Fatal verification error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
