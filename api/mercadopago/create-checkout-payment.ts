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
    console.error("[MercadoPago Create Checkout Payment] MERCADOPAGO_ACCESS_TOKEN environment variable is not defined.");
    return res.status(500).json({ error: "Mercado Pago credentials not configured on the server." });
  }

  // Diagnostic log (Security-Safe)
  const isTokenConfigured = !!accessToken;
  const tokenLength = accessToken ? accessToken.length : 0;
  const tokenPrefix = accessToken ? accessToken.substring(0, 7) : "";
  const environment = process.env.MERCADOPAGO_ENV === "test" ? "test" : "production";

  console.log("[MercadoPago Diagnostic] Security configuration check:", {
    tokenConfigured: isTokenConfigured,
    tokenPrefix,
    tokenLength,
    environment
  });

  try {
    const { uid, email, planCode } = req.body || {};

    if (!uid || !email || !planCode) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios ausentes. É necessário preencher uid, email e o planCode (pro_mensal, premium_mensal, pro_anual, premium_anual)." 
      });
    }

    // 2. Map plan attributes requested by the user
    const PLANS_MAP: Record<string, {
      title: string;
      unit_price: number;
    }> = {
      pro_mensal: {
        title: "SomDrive - Pro Mensal",
        unit_price: 19.90
      },
      premium_mensal: {
        title: "SomDrive - Premium Mensal",
        unit_price: 39.90
      },
      pro_anual: {
        title: "SomDrive - Pro Anual",
        unit_price: 199.00
      },
      premium_anual: {
        title: "SomDrive - Premium Anual",
        unit_price: 399.00
      }
    };

    const planConfig = PLANS_MAP[planCode];
    if (!planConfig) {
      return res.status(400).json({ 
        error: `Plano '${planCode}' inválido. Escolha entre: pro_mensal, premium_mensal, pro_anual, premium_anual.` 
      });
    }

    const externalReference = `${uid}|${planCode}|checkout_pro`;
    const appBaseUrl = process.env.APP_BASE_URL ? process.env.APP_BASE_URL.replace(/\/$/, "") : "https://www.somdrive.com.br";
    const backUrl = `${appBaseUrl}/pagamento/retorno`;

    // 3. Format body according to exact requirements
    const body = {
      items: [
        {
          title: planConfig.title,
          quantity: 1,
          unit_price: planConfig.unit_price,
          currency_id: "BRL"
        }
      ],
      payer: {
        email: email.trim().toLowerCase()
      },
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }
        ]
      },
      external_reference: externalReference,
      notification_url: "https://www.somdrive.com.br/api/mercadopago-webhook",
      back_urls: {
        success: backUrl,
        failure: backUrl,
        pending: backUrl
      },
      auto_return: "approved"
    };

    console.log("[MercadoPago Create Checkout Preference] Creating preference with body:", JSON.stringify(body, null, 2));

    // 4. Request preference creation from Mercado Pago Preferences API
    const mpUrl = "https://api.mercadopago.com/checkout/preferences";
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
        errorParsed = { error: "Unparseable errors detail block", message: errorText };
      }

      console.error("[MercadoPago Create Checkout Preference] Mercado Pago API error:", errorParsed);

      return res.status(mpResponse.status || 400).json({ 
        error: "O Mercado Pago recusou a criação da preferência de checkout. Status: " + mpResponse.status,
        message: errorParsed.message || "Erro retornado pela API do Mercado Pago",
        details: errorText 
      });
    }

    const preference = await mpResponse.json();
    
    // Choose correct URL based on environment set explicitly
    const isSandboxEnv = process.env.MERCADOPAGO_ENV === "test";
    const checkoutUrl = isSandboxEnv 
      ? (preference.sandbox_init_point || preference.init_point || "") 
      : (preference.init_point || "");

    const returnedUrlType = isSandboxEnv ? "sandbox_init_point" : "init_point";
    
    let checkoutHost = "";
    try {
      if (checkoutUrl) {
        const parsedUrl = new URL(checkoutUrl);
        checkoutHost = parsedUrl.host;
      }
    } catch (urlErr) {
      console.warn("[MercadoPago Diagnostic] Warning while parsing checkoutUrl:", urlErr);
    }

    console.log("[MercadoPago Diagnostic] Checkout preference result:", {
      returnedUrlType,
      checkoutHost,
      checkoutUrlPlaceholder: checkoutUrl ? `${checkoutUrl.substring(0, 30)}...` : ""
    });

    return res.json({
      success: true,
      preferenceId: preference.id,
      checkoutUrl: checkoutUrl
    });

  } catch (err: any) {
    console.error("[MercadoPago Create Checkout Preference] Fatal server error:", err);
    return res.status(500).json({ 
      error: "Erro inesperado no servidor ao processar pagamento do Mercado Pago: " + (err?.message || String(err)) 
    });
  }
}
