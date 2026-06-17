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
  HelpCircle
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card'>('card');
  const [simulatedStatus, setSimulatedStatus] = useState<'ativo' | 'pendente' | 'cancelado'>('ativo');
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'premium' | null>(null);

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
      description: 'Comece seu catálogo gratuitamente.',
      price: 0,
      limitTracks: 3,
      limitSize: 20,
      badge: 'Grátis',
      features: [
        { name: '★ Até 3 músicas cadastradas', included: true, highlight: true },
        { name: 'Envio de músicas em MP3', included: true },
        { name: 'Acervo musical', included: true },
        { name: 'Catálogo privado por link', included: true },
        { name: 'Compartilhamento do perfil', included: true },
        { name: 'Player profissional', included: true },
        { name: 'Ficha técnica', included: true },
        { name: 'Letra', included: true },
        { name: 'Contato e WhatsApp', included: true },
        { name: 'Modo celular', included: true },
        { name: 'Modo carro', included: true }
      ]
    },
    pro: {
      name: 'SomDrive Pro',
      description: 'Organize e compartilhe seu repertório do seu jeito.',
      price: billingCycle === 'monthly' ? 19.90 : 199.00,
      limitTracks: 15,
      limitSize: 20,
      badge: 'Mais Escolhido',
      features: [
        { name: '★ Até 15 músicas cadastradas', included: true, highlight: true },
        { name: 'Tudo do plano Free incluído', included: true },
        { name: 'Criação de repertórios', included: true },
        { name: 'Organização em pastas e seleções', included: true },
        { name: 'Compartilhar uma música', included: true },
        { name: 'Compartilhar apenas algumas músicas escolhidas', included: true },
        { name: 'Compartilhar um repertório completo', included: true },
        { name: 'Compartilhar o perfil completo', included: true },
        { name: 'Organizar músicas por estilo, cantor ou projeto', included: true },
        { name: 'Adicionar a mesma música em diferentes repertórios', included: true },
        { name: 'Escolher a ordem das músicas', included: true },
        { name: 'Links privados', included: true },
        { name: 'Analytics básicos', included: true },
        { name: 'Total de reproduções', included: true },
        { name: 'Música mais ouvida', included: true },
        { name: 'Botão de interesse', included: true },
        { name: 'Modo carro', included: true }
      ]
    },
    premium: {
      name: 'SomDrive Premium',
      description: 'Para catálogos e projetos maiores.',
      price: billingCycle === 'monthly' ? 39.90 : 399.00,
      limitTracks: 50,
      limitSize: 20,
      badge: 'Premium',
      features: [
        { name: '★ Até 50 músicas cadastradas', included: true, highlight: true },
        { name: 'Tudo do plano Pro incluído', included: true },
        { name: 'Organização de catálogos maiores', included: true },
        { name: 'Repertórios e seleções', included: true },
        { name: 'Projetos de gravação', included: true },
        { name: 'Organização por cantor, show, estilo, CD, EP ou produção', included: true },
        { name: 'Compartilhamento de projetos', included: true },
        { name: 'Analytics avançados', included: true },
        { name: 'Histórico de acessos', included: true },
        { name: 'Catálogo personalizado', included: true },
        { name: 'Suporte prioritário', included: true }
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
      const response = await fetch('/api/mercadopago/create-checkout-payment', {
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
        throw new Error(data.error || "Não foi possível gerar o link de pagamento do Mercado Pago.");
      }

      // Secure redirection to standard payments checkout
      window.location.href = data.checkoutUrl;

    } catch (err: any) {
      console.error("Error creating Mercado Pago Checkout Preference:", err);
      setCheckoutError(err.message || "Oops! Ocorreu um erro ao processar a requisição de pagamento junto ao Mercado Pago. Se persistir, contate o suporte.");
    } finally {
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
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Planos SomDrive
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
                  Ativado em: {profile.subscriptionDate} ({profile.subscriptionStatus || 'ativo'})
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

            <div className="mt-8 space-y-3">
              {profile.plan === 'pro' && (
                <div className="w-full text-center py-2 border border-orange-500/30 text-orange-400 text-xs uppercase font-mono tracking-widest bg-orange-950/40 rounded-xl font-extrabold mb-1.5 flex items-center justify-center gap-1">
                  Seu Plano Atual ⭐
                </div>
              )}
              
              <button 
                onClick={() => handlePlanCheckout(billingCycle === 'monthly' ? 'pro_mensal' : 'pro_anual')}
                disabled={loadingPlan !== null}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingPlan === 'pro' ? 'Carregando...' : 'Pagar agora'}
              </button>

              <div className="text-[11px] text-slate-400 font-medium text-center space-y-1.5">
                <p>Pagamento único. Você escolhe cartão ou Pix no Mercado Pago. Para renovar, basta pagar novamente.</p>
                <p className="text-amber-455 font-semibold font-mono bg-amber-950/15 p-2 rounded border border-amber-500/15 text-[10px] leading-relaxed">
                  Após realizar o pagamento, aguarde o retorno automático ao SomDrive. Se permanecer na tela do Mercado Pago, use a opção voltar do navegador e toque em ‘Já paguei — verificar agora’.
                </p>
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

            <div className="mt-8 space-y-3">
              {profile.plan === 'premium' && (
                <div className="w-full text-center py-2 border border-orange-500/30 text-orange-400 text-xs uppercase font-mono tracking-widest bg-orange-950/40 rounded-xl font-extrabold mb-1.5 flex items-center justify-center gap-1">
                  Seu Plano Atual 🚀
                </div>
              )}

              <button 
                onClick={() => handlePlanCheckout(billingCycle === 'monthly' ? 'premium_mensal' : 'premium_anual')}
                disabled={loadingPlan !== null}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingPlan === 'premium' ? 'Carregando...' : 'Pagar agora'}
              </button>

              <div className="text-[11px] text-slate-400 font-medium text-center space-y-1.5">
                <p>Pagamento único. Você escolhe cartão ou Pix no Mercado Pago. Para renovar, basta pagar novamente.</p>
                <p className="text-amber-455 font-semibold font-mono bg-amber-950/15 p-2 rounded border border-amber-500/15 text-[10px] leading-relaxed">
                  Após realizar o pagamento, aguarde o retorno automático ao SomDrive. Se permanecer na tela do Mercado Pago, use a opção voltar do navegador e toque em ‘Já paguei — verificar agora’.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ADDITIONAL MARKETING & BENEFITS COPYWRITING SECTIONS */}
        <div className="space-y-12 pt-6 border-t border-slate-900 relative z-10 text-left">
          
          {/* SECTION 1: DUO USE CASES (COMPOSITORES vs ARTISTAS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#0d111a] to-[#080b11] border border-slate-850 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-radial from-orange-500/20 to-orange-500/0 rounded-xl">
                  <Star className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-heading font-black text-lg uppercase tracking-tight text-white">Para Compositores</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Organize suas músicas inéditas em um só lugar seguro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Apresente suas composições de forma extremamente profissional.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Envie seleções de guias personalizadas e específicas para cada cantor.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Compartilhe exclusivamente as músicas adequadas para cada oportunidade.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Facilite o contato instantâneo de quem tiver real interesse em gravar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Acompanhe quais músicas estão sendo mais clicadas e ouvidas.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#0d111a] to-[#080b11] border border-slate-850 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-radial from-yellow-500/20 to-yellow-500/0 rounded-xl">
                  <Smartphone className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="font-heading font-black text-lg uppercase tracking-tight text-white">Para Cantores e Artistas</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Organize de forma clara as músicas que você pretende gravar no próximo projeto.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Monte o repertório perfeito do seu próximo show de turnê.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Separe, de forma organizada, suas guias e demos de estudo de voz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Crie e gerencie projetos integrados de gravação em estúdio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Compartilhe repertórios dinâmicos diretamente com sua banda, músicos e produtores.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>Ouça tudo de forma leve diretamente no seu celular ou no som do seu carro.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* SECTION 2: HOW TO SHARE (UM CATÁLOGO, VÁRIAS FORMAS DE COMPARTILHAR) */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="text-center md:text-left space-y-1">
              <h3 className="font-heading font-black text-xl md:text-2xl uppercase tracking-tight text-white">
                Um Catálogo, Várias Formas de Compartilhar
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm">
                Seu repertório organizado por completo e sempre pronto para distribuir. Veja como você pode divulgar:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <h4 className="text-xs font-heading font-bold text-orange-400 uppercase tracking-wider">Compartilhe uma música</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Envie um link exclusivo para uma única faixa. Quem receber verá somente aquela música, com player, letra completa, ficha técnica e botões diretos de contato.
                </p>
              </div>

              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <h4 className="text-xs font-heading font-bold text-orange-400 uppercase tracking-wider">Compartilhe uma seleção</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Escolha 2, 3, 5 ou quantas músicas desejar dentro do limite do seu plano. A pessoa que clicar no link visualizará unicamente essa seleção especial de faixas.
                </p>
              </div>

              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <h4 className="text-xs font-heading font-bold text-orange-400 uppercase tracking-wider">Compartilhe um repertório</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Crie pastas e repertórios segmentados como: <em className="text-slate-400 text-[10px]">músicas românticas</em>, <em className="text-slate-400 text-[10px]">músicas animadas</em>, <em className="text-slate-400 text-[10px]">repertório para show</em> ou <em className="text-slate-400 text-[10px]">seleção para cantor específico</em>.
                </p>
              </div>

              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <h4 className="text-xs font-heading font-bold text-orange-400 uppercase tracking-wider">Compartilhe seu perfil</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Se preferir, envie seu portfólio e catálogo musical completo e aberto de uma vez só para que produtores, empresários, cantores ou parceiros escolham à vontade.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-950/15 border border-orange-500/20 p-4 rounded-2xl text-xs text-orange-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="font-heading font-extrabold uppercase">Diferencial Exclusivo:</span>
              <p className="font-sans leading-relaxed text-slate-300 text-[11px] max-w-3xl">
                Uma mesma música cadastrada no sistema pode fazer parte de vários repertórios ao mesmo tempo, sem ocupar mais espaço na sua conta e sem contar duplicado no limite de faixas do seu plano selecionado!
              </p>
            </div>
          </div>

          {/* SECTION 3: LIGHT STREAMING & SPECIFICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Audio Specifications Guidelines */}
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-950 border border-orange-500/25 rounded-xl text-orange-400">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">Áudio Leve e de Qualidade</h3>
                    <p className="text-[10px] uppercase font-mono tracking-widest text-orange-400">Streaming otimizado para redes móveis</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Para oferecer uma reprodução instantânea, carregamento rápido e ajudar a reduzir o consumo excessivo de dados de internet móvel de quem está ouvindo no trânsito ou na rua, recomendamos fortemente enviar arquivos:
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/40 p-3.5 rounded-xl border border-slate-900">
                  <li className="flex items-center gap-1.5"><span className="text-orange-500 font-bold">•</span> Formato: <strong>MP3</strong></li>
                  <li className="flex items-center gap-1.5"><span className="text-orange-500 font-bold">•</span> Taxa: <strong>128 kbps</strong></li>
                  <li className="flex items-center gap-1.5"><span className="text-orange-500 font-bold">•</span> Peso: <strong>2 MB a 4 MB</strong></li>
                  <li className="flex items-center gap-1.5"><span className="text-orange-500 font-bold">•</span> Status: <strong>finalizados</strong></li>
                </ul>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Arquivos mais leves carregam muito mais rapidamente e evitam travamentos em conexões 4G fracas. Lembramos que o tamanho recomendado não é uma barreira obrigatória: nosso sistema aceita normalmente arquivos de até 20 MB.
                </p>
              </div>
            </div>

            {/* Why SomDrive Benchmarking */}
            <div className="bg-[#14100c]/80 border-2 border-orange-500/20 p-6 rounded-3xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl text-slate-950 font-black">
                    ⭐
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">Por que usar o SomDrive?</h3>
                    <p className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-black">Seu catálogo na nuvem</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Suas músicas centralizadas em um só lugar</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Links de compartilhamento 100% privados e profissionais</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Envio personalizado e rápido</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Acesso simples pelo celular, computador ou carro</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chega de enviar megabytes pesados no WhatsApp</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Sem necessidade de carregar pen drives</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-4 text-center mt-2.5">
                  <p className="text-sm font-heading font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                    "Seu repertório na mão do cantor certo."
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-none">Streaming leve e otimizado para redes móveis.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Interactive comparison notes / help */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans max-w-4xl mx-auto text-slate-400 relative z-10 w-full">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-orange-500 fill-orange-950/20 shrink-0" />
            <p className="leading-relaxed">
              <strong>Garantia SomDrive:</strong> Seus pagamentos são processados de forma 100% segura via Mercado Pago Checkout Pro. O processamento é instantâneo e seu plano é renovado ou ativado de forma 150% automática em nossa plataforma.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {(currentUser?.role === 'admin' || currentUser?.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com' || currentUser?.email?.toLowerCase().trim() === 'sertanejopremier@gmail.com') && (
              <button 
                type="button" 
                onClick={() => {
                  setSelectedPlan('pro');
                  setIsCheckoutOpen(true);
                  setCheckoutStep('payment');
                }}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-lg transition uppercase tracking-wider font-mono text-[9px] cursor-pointer font-bold"
              >
                Simulador Sandbox (Dev)
              </button>
            )}
            <button 
              type="button" 
              onClick={() => alert("Central de suporte prioritário: envie um e-mail para suporte@somdrive.com.br")}
              className="px-3.5 py-1.5 bg-slate-950 rounded-lg hover:text-white border border-slate-800 transition uppercase tracking-wider font-mono text-[9px] shrink-0 cursor-pointer text-orange-400 font-bold"
            >
              Falar com Suporte
            </button>
          </div>
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
                        {planDetails[selectedPlan].price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none font-bold block">
                      {billingCycle === 'monthly' ? '/ MÊS' : '/ ANO'}
                    </span>
                  </div>
                </div>

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
                      className={`py-1.5 rounded-lg border transition ${simulatedStatus === 'ativo' ? 'bg-orange-955 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400'}`}
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

                {/* Mercado Pago Mock Billing action button */}
                <button 
                  onClick={handleProcessPaymentSimulated}
                  className="w-full py-4.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-wider rounded-xl transition cursor-pointer select-none font-bold shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4.5 h-4.5" /> Pagar {selectedPlan === 'pro' ? 'Pro' : 'Premium'} com Mercado Pago
                </button>

                {/* Small security assurance label */}
                <div className="text-[9px] text-slate-500 font-mono text-center flex items-center justify-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" /> Mercado Pago Protegido • SSL Criptografado de Ponta a Ponta
                </div>

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
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-mono">Processando pagamento único de R$ {planDetails[selectedPlan].price.toFixed(2)} junto ao Mercado Pago API e registrando webhook de confirmação.</p>
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
                  <h4 className="font-heading font-black text-xl uppercase text-white">Pagamento Concluído!</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Parabéns! O seu plano do SomDrive foi alterado com sucesso para <strong className="text-orange-400 uppercase">{selectedPlan}</strong>. 
                  </p>
                  
                  {/* Webhook Status Display readback */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 inline-block text-left text-[10px] space-y-1 font-mono text-slate-400">
                    <p><strong className="text-slate-500 uppercase">Gateway:</strong> Mercado Pago Checkout Pro</p>
                    <p><strong className="text-slate-500 uppercase">Status Pagamento:</strong> <span className={simulatedStatus === 'ativo' ? 'text-emerald-400' : simulatedStatus === 'pendente' ? 'text-yellow-400' : 'text-red-400'}>{simulatedStatus.toUpperCase()}</span></p>
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
