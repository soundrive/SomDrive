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

    // 2. Map plan attributes: price, description, and preapproval_plan_id
    const PLANS_MAP: Record<string, {
      preapproval_plan_id: string;
      reason: string;
      plan: 'pro' | 'premium';
      billingCycle: 'monthly' | 'annual';
      musicLimit: number;
    }> = {
      pro_mensal: {
        preapproval_plan_id: "122938c4f106404d843032de86628512",
        reason: "Soundrive Pro",
        plan: "pro",
        billingCycle: "monthly",
        musicLimit: 15
      },
      premium_mensal: {
        preapproval_plan_id: "dbb8c10eacbb4c87ad6f5ee5ad15cd4a",
        reason: "Soundrive Premium",
        plan: "premium",
        billingCycle: "monthly",
        musicLimit: 50
      },
      pro_anual: {
        preapproval_plan_id: "ea683f4d101746bb86c3933530814aa8",
        reason: "Soundrive Pro Anual",
        plan: "pro",
        billingCycle: "annual",
        musicLimit: 15
      },
      premium_anual: {
        preapproval_plan_id: "986deaf44cf144d9af93c718b4870ca5",
        reason: "Soundrive Premium Anual",
        plan: "premium",
        billingCycle: "annual",
        musicLimit: 50
      }
    };

    const planConfig = PLANS_MAP[planCode];
    if (!planConfig) {
      return res.status(400).json({ 
        error: `Plano '${planCode}' inválido. Escolha entre: pro_mensal, premium_mensal, pro_anual, premium_anual.` 
      });
    }

    // 3. Setup redirection URLs and external_reference pattern matching
    const externalReference = `${uid}|${planCode}`;

    const appBaseUrl = process.env.APP_BASE_URL || 'https://www.soundrive.com.br';
    const backUrl = `${appBaseUrl.replace(/\/$/, '')}/pagamento/retorno`;

    // 4. Detailed logging before making the API request (strictly ensuring secure non-disclosure of access tokens)
    console.log("[MercadoPago Create Subscription] Preparing preapproval with parameters:", {
      planCode,
      preapproval_plan_id: planConfig.preapproval_plan_id,
      payer_email: email.trim().toLowerCase(),
      external_reference: externalReference,
      back_url: backUrl,
      APP_BASE_URL: appBaseUrl
    });

    // 5. Request creation to Mercado Pago API using the correct official preapproval endpoint
    const mpUrl = "https://api.mercadopago.com/preapproval";
    const body = {
      preapproval_plan_id: planConfig.preapproval_plan_id,
      payer_email: email.trim().toLowerCase(),
      back_url: backUrl,
      reason: planConfig.reason,
      external_reference: externalReference,
      status: "pending"
    };

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
      console.error(`[MercadoPago Create Subscription] Mercado Pago API error. Status: ${mpResponse.status}`, {
        status: mpResponse.status,
        body: errorText
      });

      // Point 7: If Mercado Pago returned 404 format message correctly for front-end feedback
      if (mpResponse.status === 404 || errorText.toLowerCase().includes("resource not found")) {
        return res.status(404).json({
          error: "Plano Mercado Pago não encontrado. Verifique se o preapproval_plan_id pertence à mesma conta do Access Token.",
          details: errorText
        });
      }

      return res.status(502).json({ 
        error: "O Mercado Pago recusou a criação da assinatura. Status: " + mpResponse.status, 
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
