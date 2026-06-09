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
    const { uid, email, plan, planCode } = req.body || {};
    const chosenPlan = planCode || plan;

    if (!uid || !email || !chosenPlan) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios ausentes. É necessário preencher uid, email e o plano (pro_monthly, pro_annual, premium_monthly, premium_annual)." 
      });
    }

    // 2. Map plan attributes: price and description
    let price = 19.90;
    let reason = "Soundrive Pro Mensal";
    let frequency = 1;

    switch (chosenPlan) {
      case 'pro_monthly':
        price = 19.90;
        reason = "Soundrive Pro Mensal";
        frequency = 1;
        break;
      case 'pro_annual':
        price = 199.00;
        reason = "Soundrive Pro Anual";
        frequency = 12;
        break;
      case 'premium_monthly':
        price = 39.90;
        reason = "Soundrive Premium Mensal";
        frequency = 1;
        break;
      case 'premium_annual':
        price = 399.00;
        reason = "Soundrive Premium Anual";
        frequency = 12;
        break;
      default:
        return res.status(400).json({ 
          error: `Plano '${chosenPlan}' inválido. Escolha entre: pro_monthly, pro_annual, premium_monthly, premium_annual.` 
        });
    }

    // 3. Setup redirection URLs and external_reference pattern matching
    // External reference: uid|planCode (as requested by user)
    const externalReference = `${uid}|${chosenPlan}`;

    const host = req.headers.host || '';
    let baseUrl = process.env.APP_BASE_URL || 'https://soundrive.com.br';
    
    // Auto fallback for preview or vercel domains
    if (host.includes('vercel.app') || host.includes('run.app') || host.includes('localhost') || host.includes('3000')) {
      if (host.includes('vercel.app')) {
        baseUrl = 'https://soundrive.vercel.app';
      } else {
        const protocol = host.includes('localhost') || host.includes('3000') ? 'http' : 'https';
        baseUrl = `${protocol}://${host}`;
      }
    }

    const backUrl = `${baseUrl}/pagamento/retorno`;

    console.log("[MercadoPago Create Subscription] Preparing preapproval with parameters:", {
      uid,
      email,
      chosenPlan,
      price,
      reason,
      frequency,
      externalReference,
      backUrl
    });

    // 4. Request creation to Mercado Pago API
    const mpUrl = "https://api.mercadopago.com/v1/preapproval";
    const body = {
      payer_email: email.trim().toLowerCase(),
      back_url: backUrl,
      reason: reason,
      external_reference: externalReference,
      auto_recurring: {
        frequency: frequency,
        frequency_type: "months",
        transaction_amount: price,
        currency_id: "BRL"
      },
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
      console.error(`[MercadoPago Create Subscription] Mercado Pago API error. Status: ${mpResponse.status}`, errorText);
      return res.status(502).json({ 
        error: "O Mercado Pago recusou a criação da assinatura.", 
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
