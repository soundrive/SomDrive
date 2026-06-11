import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  X, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  Info, 
  Star, 
  TrendingUp, 
  Music, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { Artist } from '../types';
import { dbService } from '../lib/db';

interface PlansScreenProps {
  currentUser: Artist;
  onClose: () => void;
  onRefreshProfile?: () => void;
}

export default function PlansScreen({ currentUser, onClose, onRefreshProfile }: PlansScreenProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [profile, setProfile] = useState<Artist>(currentUser);
  
  // Checkout flow states
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'premium' | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment' | 'processing' | 'success'>('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [simulatedStatus, setSimulatedStatus] = useState<'ativo' | 'pendente' | 'cancelado'>('ativo');
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'premium' | null>(null);

  // Pix payment state management
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [pixStatus, setPixStatus] = useState<string | null>(null);
  const [isPixLoading, setIsPixLoading] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);

  // Polling for Pix payment status
  React.useEffect(() => {
    if (!pixPaymentData || !pixPaymentData.paymentId || pixStatus !== 'pending') {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/mercadopago/verify-pix-payment?paymentId=${pixPaymentData.paymentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPixStatus(data.status);
            if (data.status === 'approved') {
              // Update local state profile so user sees immediate upgrade
              const updatedProfile = {
                ...profile,
                plan: pixPaymentData.planCode.includes('premium') ? 'premium' : 'pro' as 'free' | 'pro' | 'premium',
                subscriptionStatus: 'active',
                paymentMethod: 'pix'
              };
              setProfile(updatedProfile);
              if (onRefreshProfile) {
                onRefreshProfile();
              }
              clearInterval(intervalId);
            } else if (data.status === 'rejected' || data.status === 'cancelled' || data.status === 'expired') {
              clearInterval(intervalId);
            }
          }
        }
      } catch (err) {
        console.error("Error in Pix polling check:", err);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [pixPaymentData, pixStatus, profile, onRefreshProfile]);

  // Mercado Pago Checkout integration settings loaded from database
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loadingLinks, setLoadingLinks] = useState(true);

  React.useEffect(() => {
    const fetchLinks = async () => {
      try {
        const settings = await dbService.getPaymentSettings();
        setPaymentSettings(settings);
      } catch (e) {
        console.error("Error loading payment links:", e);
      } finally {
        setLoadingLinks(false);
      }
    };
    fetchLinks();
  }, []);

  // Plan Details Card Structuring
  const planDetails = {
    free: {
      name: 'SomDrive Free',
      description: 'Para começar e testar seu catálogo privado.',
      price: 0,
      limitTracks: 3,
      limitSize: 20,
      badge: 'Grátis',
      features: [
        { name: '★ Até 3 músicas cadastradas', included: true, highlight: true },
        { name: 'Catálogo privado por link', included: true },
        { name: 'Upload de músicas em MP3', included: true },
        { name: 'Limite de 20 MB por música', included: true },
        { name: 'Player para celular', included: true },
        { name: 'Modo carro', included: true },
        { name: 'Ficha técnica da música', included: true },
        { name: 'Letra da composição', included: true },
        { name: 'Botão WhatsApp do compositor', included: true },
        { name: 'Compartilhamento do catálogo', included: true },
      ]
    },
    pro: {
      name: 'SomDrive Pro',
      description: 'Para compositores que querem enviar mais repertório.',
      price: billingCycle === 'monthly' ? 19.90 : 199.00,
      limitTracks: 15,
      limitSize: 20,
      badge: 'Mais Escolhido',
      features: [
        { name: 'Até 15 músicas cadastradas', included: true, highlight: true },
        { name: 'Catálogo privado por link', included: true },
        { name: 'Upload de músicas em MP3', included: true },
        { name: 'Limite de 20 MB por música', included: true },
        { name: 'Player para celular', included: true },
        { name: 'Modo carro', included: true },
        { name: 'Ficha técnica da música', included: true },
        { name: 'Letra da composição', included: true },
        { name: 'Botão WhatsApp do compositor', included: true },
        { name: 'Compartilhamento do catálogo', included: true },
      ]
    },
    premium: {
      name: 'SomDrive Premium',
      description: 'Para quem trabalha com maior volume de composições.',
      price: billingCycle === 'monthly' ? 39.90 : 399.00,
      limitTracks: 50,
      limitSize: 20,
      badge: 'Premium',
      features: [
        { name: 'Até 50 músicas cadastradas', included: true, highlight: true },
        { name: 'Catálogo privado por link', included: true },
        { name: 'Upload de músicas em MP3', included: true },
        { name: 'Limite de 20 MB por música', included: true },
        { name: 'Player para celular', included: true },
        { name: 'Modo carro', included: true },
        { name: 'Ficha técnica da música', included: true },
        { name: 'Letra da composição', included: true },
        { name: 'Botão WhatsApp do compositor', included: true },
        { name: 'Compartilhamento do catálogo', included: true },
      ]
    }
  };

  const handleOpenCheckout = (planKey: 'pro' | 'premium') => {
    setSelectedPlan(planKey);
    setIsCheckoutOpen(true);
    setCheckoutStep('payment');
  };

  const handlePlanCheckout = async (planCode: 'pro_mensal' | 'pro_anual' | 'premium_mensal' | 'premium_anual') => {
    if (!currentUser || !currentUser.userId || !currentUser.email) {
      setCheckoutError("Você precisa estar autenticado com e-mail para assinar um plano. Por favor, faça login ou registre-se.");
      return;
    }

    const planKey = planCode.startsWith('pro') ? 'pro' : 'premium';
    setSelectedPlan(planKey);
    setLoadingPlan(planKey);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.userId,
          email: currentUser.email,
          planCode: planCode
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || "Não foi possível gerar a assinatura com o Mercado Pago.");
      }

      // Secure redirection to standard payments checkout
      window.location.href = data.checkoutUrl;

    } catch (err: any) {
      console.error("Error creating Mercado Pago preapproval:", err);
      setCheckoutError(err.message || "Oops! Ocorreu um erro ao processar a requisição de assinatura junto ao Mercado Pago. Se persistir, contate o suporte.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePixCheckout = async (planCode: 'pro_pix_mensal' | 'premium_pix_mensal' | 'pro_pix_anual' | 'premium_pix_anual') => {
    if (!currentUser || !currentUser.userId || !currentUser.email) {
      setCheckoutError("Você precisa estar autenticado com e-mail para pagar com Pix. Por favor, faça login ou registre-se.");
      return;
    }

    const planKey = planCode.startsWith('pro') ? 'pro' : 'premium';
    setSelectedPlan(planKey);
    setLoadingPlan(planKey);
    setIsPixLoading(true);
    setPixPaymentData(null);
    setPixStatus(null);
    setCheckoutError(null);
    setIsCheckoutOpen(true);
    setCheckoutStep('payment');
    setSelectedPaymentMethod('pix');

    try {
      const response = await fetch('/api/mercadopago/create-pix-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.userId,
          email: currentUser.email,
          planCode: planCode
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Não foi possível gerar o pagamento Pix com o Mercado Pago.");
      }

      setPixPaymentData({
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        paymentId: data.paymentId,
        amount: data.amount,
        planName: data.planName,
        planCode: planCode
      });
      setPixStatus(data.status); // e.g., 'pending'

    } catch (err: any) {
      console.error("Error creating Mercado Pago Pix payment:", err);
      setCheckoutError(err.message || "Oops! Ocorreu um erro ao processar o seu Pix junto ao Mercado Pago. Se persistir, contate o suporte.");
      setIsCheckoutOpen(false);
    } finally {
      setIsPixLoading(false);
      setLoadingPlan(null);
    }
  };

  const handleDowngradeToFree = () => {
    if (confirm("Deseja realmente voltar para o Plano Grátis? Seus limites de catálogo de 3 músicas serão aplicados novamente.")) {
      const updated = dbService.updateArtistProfile(profile.userId, { 
        plan: 'free',
        subscriptionDate: undefined,
        subscriptionStatus: undefined
      });
      setProfile(updated);
      if (onRefreshProfile) onRefreshProfile();
      alert("Seu plano foi alterado para Free com sucesso.");
    }
  };

  const handleProcessPaymentSimulated = () => {
    if (!selectedPlan) return;
    setCheckoutStep('processing');
    
    // Simulate API ping to Mercado Pago servers
    setTimeout(() => {
      const subscriptionDate = new Date().toLocaleDateString('pt-BR');
      const updated = dbService.updateArtistProfile(profile.userId, {
        plan: selectedPlan as 'free' | 'pro' | 'premium',
        subscriptionDate: subscriptionDate,
        subscriptionStatus: simulatedStatus
      });
      setProfile(updated);
      setCheckoutStep('success');
      if (onRefreshProfile) onRefreshProfile();
    }, 2000);
  };

  return (
    <div id="plans-modal-view" className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-md z-50 overflow-y-auto px-4 py-8 md:py-12 select-none">
      
      {/* Container holding the responsive content */}
      <div className="max-w-6xl mx-auto space-y-10 relative">
        
        {/* Ambient lava glowing nodes */}
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-yellow-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Plan Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10 w-full">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-orange-950 to-yellow-950 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Planos de Assinatura SomDrive
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight leading-tight">
            Planos e Limites
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
            Crie seu catálogo musical privado, envie suas composições por link e permita que cantores, produtores e contratantes ouçam suas músicas com facilidade.
          </p>
          <p className="text-slate-400 text-xs md:text-sm leading-indigo">
            Todos os planos incluem os mesmos recursos principais. A diferença está na quantidade de músicas que você pode cadastrar.
          </p>

          {/* Current plan status readout banner */}
          <div className="mt-2 bg-slate-900/60 border border-slate-850 p-2.5 rounded-2xl inline-flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-400">Plano Atual:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-orange-950 border border-orange-500/25 text-orange-400 font-mono font-bold uppercase text-[10px]">
              {profile.plan === 'free' && 'SomDrive Free'}
              {profile.plan === 'pro' && 'SomDrive Pro ⭐'}
              {profile.plan === 'premium' && 'SomDrive Premium 🚀'}
            </span>
            {profile.subscriptionDate && (
              <span className="text-slate-500 font-mono text-[10px]">
                Assinado em: {profile.subscriptionDate} ({profile.subscriptionStatus || 'ativo'})
              </span>
            )}
          </div>
        </div>

        {/* Close Button Trigger */}
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 p-2 md:p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-full transition cursor-pointer z-20"
          title="Fechar planos"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Monthly vs Yearly Switcher Toggle */}
        <div className="flex justify-center items-center z-10 relative">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-900 flex items-center relative">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 select-none cursor-pointer ${
                billingCycle === 'monthly' 
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 select-none cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly' 
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturamento Anual
              <span className="bg-slate-900 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-md border border-yellow-500/20 lowercase tracking-normal font-semibold">
                economize ~20%
              </span>
            </button>
          </div>
        </div>

        {/* 2. Plan Grid Structure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch relative z-10">
          
          {/* Soundrive Free Card */}
          <div className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between hover:scale-101 hover:border-slate-800 transition duration-300 ${profile.plan === 'free' ? 'border-orange-500/40 shadow-xl shadow-orange-950/5' : 'border-slate-850'}`}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">{planDetails.free.badge}</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{planDetails.free.name}</h4>
                </div>
                <h5 className="text-3xl font-heading font-black text-slate-100">Grátis</h5>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{planDetails.free.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {planDetails.free.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-500/10 border border-orange-500/35 px-3 py-1.5 rounded-lg text-orange-400 font-black tracking-wide text-xs">
                        ★ {feat.name}
                      </div>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <span className="text-slate-200 font-medium">{feat.name}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              {profile.plan === 'free' ? (
                <div className="w-full text-center py-2.5 border border-orange-500/20 text-orange-400 text-xs uppercase font-heading font-black tracking-widest rounded-xl bg-orange-950/20 font-bold">
                  Plano Ativo
                </div>
              ) : (
                <button 
                  onClick={handleDowngradeToFree}
                  className="w-full text-center py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer font-bold"
                >
                  Cadastrar grátis
                </button>
              )}
            </div>
          </div>

          {/* Soundrive Pro Card (Highlighted style!) */}
          <div className="relative bg-gradient-to-b from-[#14100c] to-[#0c0d12] border-2 border-orange-500/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.02] transition duration-300 shadow-2xl shadow-orange-950/30">
            {/* Top recommendation bubble */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-yellow-500 px-3.5 py-1 text-slate-950 text-[10px] uppercase font-heading font-black tracking-widest rounded-full shadow-lg font-bold flex items-center gap-1 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-slate-950" /> {planDetails.pro.badge}
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-orange-950 text-orange-400 rounded text-[9px] font-mono uppercase tracking-widest font-extrabold border border-orange-500/20">Avançado</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{planDetails.pro.name}</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-xs font-mono text-slate-400">R$</span>
                    <h5 className="text-3xl font-heading font-black text-white">{planDetails.pro.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{billingCycle === 'monthly' ? '/ mês' : '/ ano'}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{planDetails.pro.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {planDetails.pro.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-400">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-550/15 border border-orange-500 px-3 py-1.5 rounded-lg text-orange-400 font-black tracking-wide text-xs shadow-md">
                        ★ {feat.name}
                      </div>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 font-medium">{feat.name}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-4">
              {profile.plan === 'pro' && (
                <div className="w-full text-center py-2 border border-orange-500/30 text-orange-400 text-xs uppercase font-mono tracking-widest bg-orange-950/40 rounded-xl font-extrabold mb-1.5 flex items-center justify-center gap-1">
                  Seu Plano Atual ⭐
                </div>
              )}
              
              <div className="space-y-2">
                <span className="text-[9px] font-mono uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-850/60 font-bold block w-max">Cartão de Crédito (Recorrente)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handlePlanCheckout('pro_mensal')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 text-slate-950 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold disabled:opacity-50"
                  >
                    {loadingPlan === 'pro' ? 'Carregando...' : 'Mensal (19,90)'}
                  </button>
                  <button 
                    onClick={() => handlePlanCheckout('pro_anual')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-orange-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold disabled:opacity-50"
                  >
                    {loadingPlan === 'pro' ? 'Carregando...' : 'Anual (199,00)'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-850/50">
                <span className="text-[9px] font-mono uppercase bg-slate-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-950/60 font-bold block w-max">Pagar com Pix (Avulso)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handlePixCheckout('pro_pix_mensal')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-900 hover:bg-slate-855 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-extrabold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Pix Mensal
                  </button>
                  <button 
                    onClick={() => handlePixCheckout('pro_pix_anual')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-900 hover:bg-slate-855 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-extrabold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Pix Anual
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Soundrive Premium Card */}
          <div className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between hover:scale-101 hover:border-slate-800 transition duration-300 ${profile.plan === 'premium' ? 'border-orange-500/40 shadow-xl shadow-orange-950/5' : 'border-slate-850'}`}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">{planDetails.premium.badge}</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{planDetails.premium.name}</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-xs font-mono text-slate-400">R$</span>
                    <h5 className="text-3xl font-heading font-black text-white">{planDetails.premium.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{billingCycle === 'monthly' ? '/ mês' : '/ ano'}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{planDetails.premium.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {planDetails.premium.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-500/10 border border-orange-500/35 px-3 py-1.5 rounded-lg text-orange-400 font-black tracking-wide text-xs">
                        ★ {feat.name}
                      </div>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-orange-550 shrink-0 mt-0.5" />
                        <span className="text-slate-200 font-medium">{feat.name}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-4">
              {profile.plan === 'premium' && (
                <div className="w-full text-center py-2 border border-orange-500/30 text-orange-400 text-xs uppercase font-mono tracking-widest bg-orange-950/40 rounded-xl font-extrabold mb-1.5 flex items-center justify-center gap-1">
                  Seu Plano Atual 🚀
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[9px] font-mono uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-850/60 font-bold block w-max">Cartão de Crédito (Recorrente)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handlePlanCheckout('premium_mensal')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 text-slate-950 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold disabled:opacity-50"
                  >
                    {loadingPlan === 'premium' ? 'Carregando...' : 'Mensal (39,90)'}
                  </button>
                  <button 
                    onClick={() => handlePlanCheckout('premium_anual')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-955 hover:bg-slate-900 border border-slate-850 text-orange-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold disabled:opacity-50"
                  >
                    {loadingPlan === 'premium' ? 'Carregando...' : 'Anual (399,00)'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-850/50">
                <span className="text-[9px] font-mono uppercase bg-slate-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-950/60 font-bold block w-max">Pagar com Pix (Avulso)</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handlePixCheckout('premium_pix_mensal')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-900 hover:bg-slate-855 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-extrabold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Pix Mensal
                  </button>
                  <button 
                    onClick={() => handlePixCheckout('premium_pix_anual')}
                    disabled={loadingPlan !== null}
                    className="py-2.5 bg-slate-900 hover:bg-slate-855 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-extrabold flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Pix Anual
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Interactive comparison notes / help */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans max-w-4xl mx-auto text-slate-400 relative z-10">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-orange-500 fill-orange-950/20 shrink-0" />
            <p leading-relaxed="true">
              <strong>Garantia SomDrive Compilada:</strong> Nossas cobranças recorrentes são processadas de forma 100% segura. Cancele ou altere sua assinatura a qualquer momento com apenas 1 clique diretamente neste painel.
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => alert("Central de suporte prioritário: envie um e-mail para suporte@somdrive.com.br")}
            className="px-3.5 py-1.5 bg-slate-950 rounded-lg hover:text-white border border-slate-800 transition uppercase tracking-wider font-mono text-[10px] shrink-0 cursor-pointer text-orange-400 font-bold"
          >
            Falar com Suporte
          </button>
        </div>

      </div>

      {/* ========================================== */}
      {/* CHECKOUT MODAL: MERCADO PAGO INTEGRATION   */}
      {/* ========================================== */}
      {isCheckoutOpen && selectedPlan && (
        <div id="checkout-modal-overlay" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-orange-500/30 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative">
            
            {/* Header section with Close */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-4">
              <h4 className="font-heading font-black text-base uppercase text-white tracking-wide flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-400 animate-pulse" /> Finalizar no Mercado Pago
              </h4>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase"
              >
                Fechar
              </button>
            </div>

            {/* Inner workflow states */}
            {checkoutStep === 'payment' && (
              <div className="space-y-5">
                
                {/* Summarized selected offering info */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase bg-orange-950 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 font-bold">Plano Escolhido</span>
                    <h5 className="font-heading font-black text-sm uppercase text-white">
                      {selectedPlan === 'pro' ? 'SomDrive Pro' : 'SomDrive Premium'}
                    </h5>
                    <p className="text-[10px] text-slate-500">Cancelamento imediato. Sem taxas ocultas.</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-slate-500 font-mono">R$</span>
                      <span className="text-2xl font-black text-yellow-400 font-mono text-right">
                        {pixPaymentData ? pixPaymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : planDetails[selectedPlan].price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none font-bold block">
                      {pixPaymentData ? (pixPaymentData.planCode.includes('anual') ? '/ ANO' : '/ MÊS') : (billingCycle === 'monthly' ? '/ MÊS' : '/ ANO')}
                    </span>
                  </div>
                </div>

                {selectedPaymentMethod === 'pix' ? (
                  // ==========================================
                  // REVOLUTIONARY PIX FLOW
                  // ==========================================
                  <div className="space-y-5 animate-fadeIn">
                    {isPixLoading ? (
                      <div className="text-center py-10 space-y-4">
                        <div className="w-12 h-12 bg-slate-950 border-4 border-t-emerald-500 border-slate-850 rounded-full animate-spin mx-auto flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Gerando cobrança Pix segura com Mercado Pago...</p>
                      </div>
                    ) : pixPaymentData ? (
                      <div className="space-y-4">
                        {/* QR Code container styled perfectly */}
                        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-4 border-slate-850/20 max-w-[210px] mx-auto shadow-xl">
                          <img 
                            src={`data:image/png;base64,${pixPaymentData.qrCodeBase64}`} 
                            alt="QR Code Pix SomDrive" 
                            className="w-44 h-44 object-contain selection:bg-transparent"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Real-time sync status banner */}
                        <div className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono bg-slate-950 border-slate-900 select-none">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${pixStatus === 'approved' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                            <span className="text-slate-400 uppercase">Sincronia:</span>
                          </div>
                          <span className={`font-black uppercase ${pixStatus === 'approved' ? 'text-emerald-400 font-bold' : 'text-yellow-400 animate-pulse'}`}>
                            {pixStatus === 'approved' ? '✓ Plano Ativo!' : '⏳ Aguardando Pix'}
                          </span>
                        </div>

                        {/* Copy Code field */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Código Copia e Cola Pix</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={pixPaymentData.qrCode} 
                              readOnly 
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="bg-slate-950 border border-slate-900 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-mono w-full focus:outline-none focus:border-slate-800 select-all" 
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(pixPaymentData.qrCode);
                                setCopiedPixCode(true);
                                setTimeout(() => setCopiedPixCode(false), 2000);
                              }}
                              className="px-4.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-heading font-black tracking-wider uppercase rounded-xl transition cursor-pointer select-none font-bold"
                            >
                              {copiedPixCode ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </div>

                        {/* Explainer note */}
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900 text-[10px] text-slate-400 leading-relaxed space-y-1">
                          <p className="flex items-center gap-1.5 text-slate-300 font-semibold uppercase text-[9px] tracking-wider">
                            <Info className="w-3.5 h-3.5 text-emerald-400" /> Ativação Automática de Assinatura
                          </p>
                          <p>
                            Pague através do aplicativo do seu banco por Pix Copia e Cola ou escaneando o QR Code. Confirmado o pagamento, o sistema do SomDrive atualiza o seu limite de músicas instantaneamente.
                          </p>
                        </div>

                        {pixStatus === 'approved' && (
                          <button 
                            onClick={() => {
                              setIsCheckoutOpen(false);
                              onClose();
                            }}
                            className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer shadow-lg font-black"
                          >
                            Ir para o Painel da Conta
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-red-400">Dados do Pix indisponíveis. Por favor, reinicie o processo.</p>
                      </div>
                    )}

                    {/* Go back to card choice tab */}
                    <div className="text-center pt-1 border-t border-slate-900">
                      <button 
                        onClick={() => setSelectedPaymentMethod('card')}
                        className="text-[10px] font-mono text-orange-400 hover:text-orange-300 uppercase tracking-widest font-bold underline cursor-pointer"
                      >
                        « Escolher Cartão de Crédito
                      </button>
                    </div>

                  </div>
                ) : (
                  // ==========================================
                  // ORIGINAL CREDIT CARD SUB-FLOW
                  // ==========================================
                  <>
                    {/* Simulated webhook status admin settings */}
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900 space-y-2.5">
                      <h6 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-black flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-orange-400" /> Simular Resposta de Callback (Webhook / Instant IPN)
                      </h6>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Como desenvolvedor, simule o retorno dos servidores do Mercado Pago para assegurar que o fluxo de bloqueio/liberação funcione.
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase">
                        <button 
                          type="button"
                          onClick={() => setSimulatedStatus('ativo')}
                          className={`py-1.5 rounded-lg border transition ${simulatedStatus === 'ativo' ? 'bg-orange-950 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400'}`}
                        >
                          Ativo (Aprovado)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSimulatedStatus('pendente')}
                          className={`py-1.5 rounded-lg border transition ${simulatedStatus === 'pendente' ? 'bg-yellow-950 border-yellow-500 text-yellow-400' : 'bg-slate-900 border-slate-850 text-slate-500'}`}
                        >
                          Pendente
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSimulatedStatus('cancelado')}
                          className={`py-1.5 rounded-lg border transition ${simulatedStatus === 'cancelado' ? 'bg-red-950 border-red-500 text-red-400' : 'bg-slate-900 border-slate-850 text-slate-500'}`}
                        >
                          Cancelado
                        </button>
                      </div>
                    </div>

                    {/* Submitting methods Selection tabs */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-slate-500 font-bold">Meio de Pagamento Preferido</label>
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                        <button 
                          onClick={() => {
                            setSelectedPaymentMethod('pix');
                            handlePixCheckout(selectedPlan === 'premium' ? 'premium_pix_mensal' : 'pro_pix_mensal');
                          }}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${selectedPaymentMethod === 'pix' ? 'bg-orange-955 border-orange-500 text-white' : 'bg-slate-900 border-slate-855 text-slate-400'}`}
                        >
                          <span className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Pagamento com Pix</span>
                          <span className="text-[8px] bg-orange-600/20 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded leading-none">instantâneo</span>
                        </button>
                        <button 
                          onClick={() => setSelectedPaymentMethod('card')}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${selectedPaymentMethod === 'card' ? 'bg-[#1e1a15] border-orange-500 text-white' : 'bg-slate-900 border-slate-855 text-slate-400'}`}
                        >
                          <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Cartão de Crédito</span>
                          <span className="text-[8px] bg-slate-950 border border-slate-850 text-slate-400 px-1 py-0.5 rounded leading-none">até 12x</span>
                        </button>
                      </div>
                    </div>

                    {/* Mercado Pago Mock Billing action button */}
                    <button 
                      onClick={handleProcessPaymentSimulated}
                      className="w-full py-4.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4.5 h-4.5" /> Assinar {selectedPlan === 'pro' ? 'Pro' : 'Premium'} com Mercado Pago
                    </button>

                    {/* Small security assurance label */}
                    <div className="text-[9px] text-slate-500 font-mono text-center flex items-center justify-center gap-1.5 uppercase tracking-wide">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" /> Mercado Pago Protegido • SSL Criptografado de Ponta a Ponta
                    </div>
                  </>
                )}

              </div>
            )}

            {/* Processing Simulator state */}
            {checkoutStep === 'processing' && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-slate-950 border-4 border-t-orange-500 border-slate-800 rounded-full animate-spin mx-auto flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-orange-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-base uppercase text-white animate-pulse">Estabelecendo Conexão Segura...</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">Processando transação recorrente de R$ {planDetails[selectedPlan].price.toFixed(2)} junto ao Mercado Pago API e registrando webhook de assinatura.</p>
                </div>
              </div>
            )}

            {/* Checkout SUCCESS Screen state */}
            {checkoutStep === 'success' && (
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/20">
                  <CheckCircle2 className="w-9 h-9 fill-emerald-950" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-heading font-black text-xl uppercase text-white">Assinatura Concluída!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Parabéns! O seu plano do SomDrive foi alterado com sucesso para <strong className="text-orange-400 uppercase">{selectedPlan}</strong>. 
                  </p>
                  
                  {/* Webhook Status Display readback */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 inline-block text-left text-[10px] space-y-1 font-mono text-slate-400">
                    <p><strong className="text-slate-500 uppercase">Gateway:</strong> Mercado Pago Recorrente</p>
                    <p><strong className="text-slate-500 uppercase">Status Assinatura:</strong> <span className={simulatedStatus === 'ativo' ? 'text-emerald-400' : simulatedStatus === 'pendente' ? 'text-yellow-400' : 'text-red-400'}>{simulatedStatus.toUpperCase()}</span></p>
                    <p><strong className="text-slate-500 uppercase">Limite de Envio:</strong> {planDetails[selectedPlan].limitTracks} Músicas / {planDetails[selectedPlan].limitSize} MB</p>
                    <p><strong className="text-slate-500 uppercase">Data de Registro:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Ir para o Painel da Conta
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ERROR MODAL FOR UNCONFIGURED PAYMENT */}
      {checkoutError && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-red-500/30 rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-950/50 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="font-heading font-black text-sm uppercase text-white">Aviso do Sistema</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{checkoutError}</p>
            </div>
            <div className="pt-2 flex flex-col space-y-3">
              {currentUser.whatsapp ? (
                <a
                  href={`https://wa.me/${currentUser.whatsapp.replace(/\D/g, '')}?text=Olá! Gostaria de ajuda para assinar o plano ${selectedPlan === 'pro' ? 'Pro' : 'Premium'} no SomDrive.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 font-extrabold uppercase"
                >
                  <span>Falar com Suporte</span>
                </a>
              ) : (
                <a
                  href="mailto:suporte@somdrive.com.br"
                  className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 font-extrabold uppercase"
                >
                  <span>Falar com Suporte</span>
                </a>
              )}
              <button 
                onClick={() => setCheckoutError(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold rounded-2xl text-xs border border-slate-850 transition cursor-pointer font-bold uppercase"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
