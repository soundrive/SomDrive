import dotenv from 'dotenv';
import createCheckoutPaymentHandler from './create-checkout-payment';

dotenv.config();

// Backward compatibility wrapper pointing create-subscription to create-checkout-payment
export default async function handler(req: any, res: any) {
  console.log("[MercadoPago Create Subscription Fallback] Request received at create-subscription. Redirecting flow internally to create-checkout-payment...");
  return createCheckoutPaymentHandler(req, res);
}
