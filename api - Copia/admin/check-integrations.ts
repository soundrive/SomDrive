import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: any, res: any) {
  // Return presence of keys safely without exposing the actual values
  return res.json({
    mercadoPagoAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    mercadoPagoPublicKey: !!process.env.MERCADOPAGO_PUBLIC_KEY,
    mercadoPagoWebhookSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
    appBaseUrl: !!process.env.APP_BASE_URL
  });
}
