import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export default async function handler(req: any, res: any) {
  // 1. Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[MercadoPago Create Pix] MERCADOPAGO_ACCESS_TOKEN environment variable is not defined.");
    return res.status(500).json({ error: "Mercado Pago credentials not configured on the server." });
  }

  try {
    const { uid, email, planCode } = req.body || {};

    if (!uid || !email || !planCode) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios ausentes. É necessário preencher uid, email e o planCode para o Pix." 
      });
    }

    // 2. Define PIX plan configuration mapping
    const PLANS_MAP: Record<string, {
      name: string;
      transaction_amount: number;
      plan: 'pro' | 'premium';
      billingCycle: 'monthly' | 'annual';
      musicLimit: number;
      durationDays: number;
    }> = {
      pro_pix_mensal: {
        name: "Pro Mensal",
        transaction_amount: 19.90,
        plan: "pro",
        billingCycle: "monthly",
        musicLimit: 15,
        durationDays: 30
      },
      premium_pix_mensal: {
        name: "Premium Mensal",
        transaction_amount: 39.90,
        plan: "premium",
        billingCycle: "monthly",
        musicLimit: 50,
        durationDays: 30
      },
      pro_pix_anual: {
        name: "Pro Anual",
        transaction_amount: 199.00,
        plan: "pro",
        billingCycle: "annual",
        musicLimit: 15,
        durationDays: 365
      },
      premium_pix_anual: {
        name: "Premium Anual",
        transaction_amount: 399.00,
        plan: "premium",
        billingCycle: "annual",
        musicLimit: 50,
        durationDays: 365
      }
    };

    const planConfig = PLANS_MAP[planCode];
    if (!planConfig) {
      return res.status(400).json({ 
        error: `Plano Pix '${planCode}' inválido. Escolha entre: pro_pix_mensal, premium_pix_mensal, pro_pix_anual, premium_pix_anual.` 
      });
    }

    const appBaseUrl = (process.env.APP_BASE_URL || "https://www.somdrive.com.br").replace(/\/$/, "");
    const notificationUrl = `${appBaseUrl}/api/mercadopago-webhook`;
    const externalReference = `${uid}|${planCode}|pix`;
    const idempotencyKey = crypto.randomUUID();

    const body = {
      transaction_amount: planConfig.transaction_amount,
      description: `SomDrive - ${planConfig.name}`,
      payment_method_id: "pix",
      payer: {
        email: email.trim().toLowerCase()
      },
      external_reference: externalReference,
      notification_url: notificationUrl
    };

    console.log("[MercadoPago Create Pix] Creating Pix payment on MP API", {
      amount: body.transaction_amount,
      description: body.description,
      external_reference: body.external_reference,
      notification_url: body.notification_url,
      idempotencyKey
    });

    const mpUrl = "https://api.mercadopago.com/v1/payments";
    const mpResponse = await fetch(mpUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(body)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      let errorParsed: any = {};
      try {
        errorParsed = JSON.parse(errorText);
      } catch (e) {
        errorParsed = { error: "Unparseable error block", message: errorText };
      }

      console.error("[MercadoPago Create Pix] Mercado Pago API error details:", {
        message: errorParsed.message || "N/A",
        error: errorParsed.error || "N/A",
        status: mpResponse.status,
        fullError: errorParsed
      });

      return res.status(mpResponse.status || 400).json({ 
        error: "O Mercado Pago recusou a criação do pagamento Pix. Status: " + mpResponse.status,
        message: errorParsed.message || "Erro retornado pela API do Mercado Pago",
        details: errorParsed
      });
    }

    const paymentData = await mpResponse.json();

    const transactionData = paymentData.point_of_interaction?.transaction_data || {};
    const qrCode = transactionData.qr_code || "";
    const qrCodeBase64 = transactionData.qr_code_base64 || "";

    console.log("[MercadoPago Create Pix] Successfully created Pix payment:", {
      id: paymentData.id,
      status: paymentData.status,
      qrCodeLength: qrCode.length,
      hasQrCodeBase64: !!qrCodeBase64
    });

    return res.json({
      success: true,
      paymentId: paymentData.id,
      status: paymentData.status,
      qrCode: qrCode,
      qrCodeBase64: qrCodeBase64,
      amount: planConfig.transaction_amount,
      planName: planConfig.name,
      planCode: planCode
    });

  } catch (err: any) {
    console.error("[MercadoPago Create Pix] Fatal server error details:", err);
    return res.status(500).json({ 
      error: "Erro inesperado no servidor ao gerar pagamento Pix via Mercado Pago: " + (err?.message || String(err)) 
    });
  }
}
