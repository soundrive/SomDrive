export interface PlanDetail {
  name: string;
  limitTracks: number;
  priceMonthly: number;
  priceYearly: number;
  linkMonthly: string;
  linkYearly: string;
}

export const PLANS_CONFIG: Record<'essencial' | 'pro' | 'premium', PlanDetail> = {
  essencial: {
    name: 'SomDrive Essencial',
    limitTracks: 10,
    priceMonthly: 9.99,
    priceYearly: 99.90,
    linkMonthly: 'https://mpago.la/16nq8XA',
    linkYearly: 'https://mpago.la/1kxhyWJ',
  },
  pro: {
    name: 'SomDrive Pro',
    limitTracks: 15,
    priceMonthly: 14.99,
    priceYearly: 149.90,
    linkMonthly: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=122938c4f106404d843032de86628512',
    linkYearly: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=ea683f4d101746bb86c3933530814aa8',
  },
  premium: {
    name: 'SomDrive Premium',
    limitTracks: 50,
    priceMonthly: 29.99,
    priceYearly: 299.90,
    linkMonthly: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=dbb8c10eacbb4c87ad6f5ee5ad15cd4a',
    linkYearly: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=986deaf44cf144d9af93c718b4870ca5',
  }
};
