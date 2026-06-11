import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: any, res: any) {
  // 1. Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[MercadoPago Create Subscription] MERCADOPAGO_ACCESS_TOKEN environment variable is not defined.");
    return res.status(500).json({ error: "Mercado Pago credentials not configured on the server." });
  }

  try {
    const { uid, email, planCode } = req.body || {};

    if (!uid || !email || !planCode) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios ausentes. É necessário preencher uid, email e o planCode (pro_mensal, premium_mensal, pro_anual, premium_anual)." 
      });
    }

    // 2. Map plan attributes as requested by user - WITHOUT preapproval_plan_id
    const PLANS_MAP: Record<string, {
      reason: string;
      frequency: number;
      frequency_type: "months";
      transaction_amount: number;
      musicLimit: number;
      plan: 'pro' | 'premium';
      billingCycle: 'monthly' | 'annual';
    }> = {
      pro_mensal: {
        reason: "Soundrive Pro Mensal",
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 19.90,
        musicLimit: 15,
        plan: "pro",
        billingCycle: "monthly"
      },
      premium_mensal: {
        reason: "Soundrive Premium Mensal",
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 39.90,
        musicLimit: 50,
        plan: "premium",
        billingCycle: "monthly"
      },
      pro_anual: {
        reason: "Soundrive Pro Anual",
        frequency: 12,
        frequency_type: "months",
        transaction_amount: 199.00,
        musicLimit: 15,
        plan: "pro",
        billingCycle: "annual"
      },
      premium_anual: {
        reason: "Soundrive Premium Anual",
        frequency: 12,
        frequency_type: "months",
        transaction_amount: 399.00,
        musicLimit: 50,
        plan: "premium",
        billingCycle: "annual"
      }
    };

    const planConfig = PLANS_MAP[planCode];
    if (!planConfig) {
      return res.status(400).json({ 
        error: `Plano '${planCode}' inválido. Escolha entre: pro_mensal, premium_mensal, pro_anual, premium_anual.` 
      });
    }

    // 3. Setup external_reference pattern matching
    const externalReference = `${uid}|${planCode}`;
    const appBaseUrl = process.env.APP_BASE_URL ? process.env.APP_BASE_URL.replace(/\/$/, "") : "https://www.somdrive.com.br";
    const backUrl = `${appBaseUrl}/pagamento/retorno`;

    // 4. Setup clean, compliant auto_recurring body configuration on Mercado Pago Preapproval API
    const body = {
      reason: planConfig.reason,
      external_reference: externalReference,
      payer_email: email.trim().toLowerCase(),
      auto_recurring: {
        frequency: planConfig.frequency,
        frequency_type: planConfig.frequency_type,
        transaction_amount: planConfig.transaction_amount,
        currency_id: "BRL"
      },
      back_url: backUrl,
      status: "pending"
    };

    // 5. Explicitly log exactly the structure requested:
    console.log("[MercadoPago] Criando assinatura SEM preapproval_plan_id usando auto_recurring", {
      reason: body.reason,
      external_reference: body.external_reference,
      payer_email: body.payer_email,
      auto_recurring: body.auto_recurring,
      back_url: body.back_url,
      status: body.status
    });

    // 6. Request creation to Mercado Pago API using the official preapproval endpoint
    const mpUrl = "https://api.mercadopago.com/preapproval";
    const mpResponse = await fetch(mpUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
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

      // Log complete structure details including message, error, status, and cause
      console.error("[MercadoPago Create Subscription] Mercado Pago API error details:", {
        message: errorParsed.message || "N/A",
        error: errorParsed.error || "N/A",
        status: mpResponse.status,
        cause: errorParsed.cause || errorParsed.message || "N/A",
        fullError: errorParsed
      });

      return res.status(mpResponse.status || 400).json({ 
        error: "O Mercado Pago recusou a criação da assinatura. Status: " + mpResponse.status,
        message: errorParsed.message || "Erro retornado pela API do Mercado Pago",
        status: mpResponse.status,
        cause: errorParsed.cause || null,
        details: errorText 
      });
    }

    const preapproval = await mpResponse.json();

    // Mercado Pago returns init_point for checkout redirection
    const checkoutUrl = preapproval.init_point || preapproval.sandbox_init_point || '';

    console.log("[MercadoPago Create Subscription] Successfully created preapproval subscription:", {
      id: preapproval.id,
      status: preapproval.status,
      checkoutUrl
    });

    return res.json({
      success: true,
      subscriptionId: preapproval.id,
      checkoutUrl: checkoutUrl
    });

  } catch (err: any) {
    console.error("[MercadoPago Create Subscription] Fatal server error details:", err);
    return res.status(500).json({ 
      error: "Erro inesperado no servidor ao processar pagamento do Mercado Pago: " + (err?.message || String(err)) 
    });
  }
}
