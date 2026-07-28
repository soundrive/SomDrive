import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  Smartphone, 
  Car, 
  TrendingUp, 
  Check, 
  Plus, 
  ShieldCheck, 
  Music, 
  Share2,
  Star,
  Sparkles,
  X,
  CreditCard,
  MessageSquare,
  DollarSign,
  Headphones,
  Volume2,
  MapPin,
  Instagram,
  Users,
  Lock,
  Bell,
  Link,
  Bluetooth,
  Send
} from 'lucide-react';
import { Artist } from '../types';
import { PLANS_CONFIG } from '../lib/plansConfig';

import { BrandLogo } from './BrandLogo';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  currentUser: Artist | null;
  onLogout: () => void;
  logoScale?: number;
  showLogo?: boolean;
  customLogoUrl?: string;
}

const TEST_ARTISTS = [
  {
    id: 'gabriel-silva',
    name: 'Gabriel Silva',
    tagline: 'Compositor Sertanejo',
    city: 'Goiânia • GO',
    badgeText: 'Sertanejo',
    accentColor: 'emerald',
    accentClass: 'from-emerald-500 to-yellow-500',
    accentText: 'text-emerald-400',
    hoverText: 'hover:text-emerald-300',
    dividerColor: 'border-emerald-500/40',
    glowColor: 'from-emerald-500/20 via-yellow-500/5 to-transparent',
    avatarChar: 'GS',
    plays: '14.2k plays',
    whatsapp: '(62) 99876-5432',
    instagram: '@gabrielsilva_compo',
    bannerGradient: 'from-slate-900 to-emerald-950/60',
    tracks: [
      { id: 't1', title: 'Vento da Alvorada', duration: '03:02', composer: 'Gabriel Silva & Lara S.', plays: '4.8k' },
      { id: 't2', title: 'Coração de Estrada', duration: '03:14', composer: 'Gabriel Silva & Gabriel S.', plays: '3.1k' },
      { id: 't3', title: 'Esquema Perfeito', duration: '02:55', composer: 'Gabriel Silva', plays: '2.5k' }
    ]
  },
  {
    id: 'mariana-santos',
    name: 'Mariana Santos',
    tagline: 'Hitmaker Piseiro',
    city: 'Fortaleza • CE',
    badgeText: 'Piseiro',
    accentColor: 'emerald',
    accentClass: 'from-emerald-500 to-teal-500',
    accentText: 'text-emerald-400',
    hoverText: 'hover:text-emerald-300',
    dividerColor: 'border-emerald-500/20',
    glowColor: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    avatarChar: 'MS',
    plays: '28.9k plays',
    whatsapp: '(85) 99123-4567',
    instagram: '@marianasantos_hits',
    bannerGradient: 'from-slate-900 to-emerald-950/60',
    tracks: [
      { id: 't4', title: 'Batida do Piseiro', duration: '02:45', composer: 'Mariana Santos', plays: '8.2k' },
      { id: 't5', title: 'Amor de Paredão', duration: '03:10', composer: 'Mariana Santos', plays: '6.4k' },
      { id: 't6', title: 'Dançando na Poeira', duration: '02:58', composer: 'Mariana Santos', plays: '4.3k' }
    ]
  },
  {
    id: 'thiago-pagodao',
    name: 'Thiago Pagodão',
    tagline: 'Poeta do Samba',
    city: 'Rio de Janeiro • RJ',
    badgeText: 'Samba / Pagode',
    accentColor: 'fuchsia',
    accentClass: 'from-fuchsia-500 to-pink-500',
    accentText: 'text-fuchsia-400',
    hoverText: 'hover:text-fuchsia-300',
    dividerColor: 'border-fuchsia-500/20',
    glowColor: 'from-fuchsia-500/10 via-pink-500/5 to-transparent',
    avatarChar: 'TP',
    plays: '11.4k plays',
    whatsapp: '(21) 98765-4321',
    instagram: '@thiagopagodao',
    bannerGradient: 'from-slate-900 to-fuchsia-950/60',
    tracks: [
      { id: 't7', title: 'Cerveja Gela o Coração', duration: '03:30', composer: 'Thiago Pagodão', plays: '4.1k' },
      { id: 't8', title: 'Gente da Minha Cor', duration: '02:50', composer: 'Thiago Pagodão & Sambistas', plays: '3.2k' },
      { id: 't9', title: 'Deixa a Tristeza Curar', duration: '03:15', composer: 'Thiago Pagodão', plays: '2.0k' }
    ]
  }
];

export default function LandingPage({ onNavigate, currentUser, onLogout, logoScale, showLogo, customLogoUrl }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isSimulatedPlaying, setIsSimulatedPlaying] = useState(true);

  const landingPlans = {
    free: {
      name: 'SomDrive Free',
      description: 'Comece seu catálogo gratuitamente.',
      highlightText: 'Crie seu primeiro catálogo musical gratuitamente.',
      price: 'Grátis',
      badge: 'Grátis',
      features: [
        { name: '★ Até 3 músicas cadastradas', highlight: true },
        { name: 'Envio de músicas em MP3' },
        { name: 'Acervo musical' },
        { name: 'Catálogo privado por link' },
        { name: 'Compartilhamento do perfil' },
        { name: 'Player profissional' },
        { name: 'Ficha técnica' },
        { name: 'Letra' },
        { name: 'Contato e WhatsApp' },
        { name: 'Modo celular' },
        { name: 'Modo carro' }
      ]
    },
    essencial: {
      name: PLANS_CONFIG.essencial.name,
      description: 'Ideal para compositores com catálogo inicial.',
      highlightText: 'Gerencie e compartilhe até 10 músicas de forma profissional.',
      price: billingCycle === 'monthly' 
        ? `R$ ${PLANS_CONFIG.essencial.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : `R$ ${PLANS_CONFIG.essencial.priceYearly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      period: billingCycle === 'monthly' ? '/ mês' : '/ ano',
      badge: 'Básico',
      features: [
        { name: `★ Até ${PLANS_CONFIG.essencial.limitTracks} músicas cadastradas`, highlight: true },
        { name: 'Tudo do plano Free incluído' },
        { name: 'Criação de repertórios' },
        { name: 'Links privados' },
        { name: 'WhatsApp e Contato' },
        { name: 'Player profissional' },
        { name: 'Ficha técnica e Letra' },
        { name: 'Modo carro' }
      ]
    },
    pro: {
      name: PLANS_CONFIG.pro.name,
      description: 'Organize e compartilhe seu repertório do seu jeito.',
      highlightText: 'Crie repertórios e compartilhe somente as músicas que escolher.',
      price: billingCycle === 'monthly' 
        ? `R$ ${PLANS_CONFIG.pro.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : `R$ ${PLANS_CONFIG.pro.priceYearly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      period: billingCycle === 'monthly' ? '/ mês' : '/ ano',
      badge: 'Mais Escolhido',
      features: [
        { name: `★ Até ${PLANS_CONFIG.pro.limitTracks} músicas cadastradas`, highlight: true },
        { name: 'Tudo do plano Free incluído' },
        { name: 'Criação de repertórios' },
        { name: 'Organização em pastas e seleções' },
        { name: 'Compartilhar uma música' },
        { name: 'Compartilhar apenas algumas músicas escolhidas' },
        { name: 'Compartilhar um repertório completo' },
        { name: 'Compartilhar o perfil completo' },
        { name: 'Organizar músicas por estilo, cantor ou projeto' },
        { name: 'Adicionar a mesma música em diferentes repertórios' },
        { name: 'Escolher a ordem das músicas' },
        { name: 'Links privados' },
        { name: 'Analytics básicos' },
        { name: 'Total de reproduções' },
        { name: 'Música mais ouvida' },
        { name: 'Botão de interesse' },
        { name: 'Modo carro' }
      ]
    },
    premium: {
      name: PLANS_CONFIG.premium.name,
      description: 'Para catálogos e projetos maiores.',
      highlightText: 'Organize até 50 músicas em repertórios, projetos e seleções privadas.',
      price: billingCycle === 'monthly' 
        ? `R$ ${PLANS_CONFIG.premium.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : `R$ ${PLANS_CONFIG.premium.priceYearly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      period: billingCycle === 'monthly' ? '/ mês' : '/ ano',
      badge: 'Premium',
      features: [
        { name: `★ Até ${PLANS_CONFIG.premium.limitTracks} músicas cadastradas`, highlight: true },
        { name: 'Tudo do plano Pro incluído' },
        { name: 'Organização de catálogos maiores' },
        { name: 'Repertórios e seleções' },
        { name: 'Projetos de gravação' },
        { name: 'Organização por cantor, show, estilo, CD, EP ou produção' },
        { name: 'Compartilhamento de projetos' },
        { name: 'Analytics avançados' },
        { name: 'Histórico de acessos' },
        { name: 'Catálogo personalizado' },
        { name: 'Suporte prioritário' }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white pb-20 relative overflow-hidden">
      
      {/* Ambient Grid overlay & Decorative Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute right-[-10%] top-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/10 via-yellow-500/5 to-transparent rounded-full filter blur-[120px] pointer-events-none z-0 animate-pulse"></div>
      <div className="absolute left-[-5%] top-[25%] w-[500px] h-[500px] bg-gradient-to-br from-yellow-500/5 via-emerald-600/5 to-transparent rounded-full filter blur-[140px] pointer-events-none z-0"></div>

      {/* Navigation Top Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div 
            onClick={() => onNavigate('landing')}
            className="cursor-pointer select-none group"
          >
            <BrandLogo size="sm" scale={logoScale || 1.0} showLogo={showLogo} customLogoUrl={customLogoUrl} className="origin-left" />
          </div>

          <nav id="top-nav" className="flex items-center gap-1.5 md:gap-4 shrink-0">
            <a href="#planos" className="hidden md:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition">
              Planos
            </a>
            
            {currentUser ? (
              <div className="flex items-center gap-1.5 md:gap-3">
                {(currentUser.role === 'admin' || currentUser.email === 'videopremieroficial@gmail.com' || currentUser.email === 'sertanejopremier@gmail.com') && (
                  <button 
                    id="header-admin-btn"
                    onClick={() => onNavigate('admin')}
                    className="px-2 py-1.5 md:px-4 md:py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded-lg text-[10px] md:text-xs font-heading font-bold uppercase tracking-wider cursor-pointer shadow hover:border-slate-700 font-mono whitespace-nowrap"
                  >
                    Admin <span className="hidden sm:inline">🛡️</span>
                  </button>
                )}
                <button 
                  id="header-dash-btn"
                  onClick={() => onNavigate('dashboard')}
                  className="px-2.5 py-1.5 md:px-4 md:py-1.5 bg-gradient-to-r from-emerald-600 to-yellow-500 rounded-lg text-[10px] md:text-xs font-heading font-bold uppercase tracking-widest sm:tracking-wider hover:from-emerald-500 hover:to-yellow-400 cursor-pointer shadow-md shadow-emerald-500/10 select-none text-slate-950 transition font-black sm:font-bold whitespace-nowrap"
                >
                  Painel<span className="hidden sm:inline"> do Artista</span>
                </button>
                <button 
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="hidden md:block px-3 py-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition rounded-lg text-xs uppercase tracking-wider cursor-pointer"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-3">
                <button 
                  id="header-login-btn"
                  onClick={() => onNavigate('auth', { isRegister: false })}
                  className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-orange-400 transition cursor-pointer px-2 py-1"
                >
                  Entrar
                </button>
                <button 
                  id="header-register-btn"
                  onClick={() => onNavigate('auth', { isRegister: true })}
                  className="px-2.5 py-1.5 md:px-4 md:py-2 bg-orange-600 border border-orange-500 rounded-lg text-[10px] md:text-xs font-heading font-bold uppercase tracking-wider hover:bg-orange-500 transition cursor-pointer shadow-lg shadow-orange-500/15 text-white whitespace-nowrap"
                >
                  Criar Conta
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-10 sm:pt-16 md:pt-20 lg:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
        
        {/* Left Hand: High impact text */}
        <div id="hero-left" className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-slate-900/90 border border-white/[0.06] rounded-full shadow-lg shadow-orange-500/5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-wider sm:tracking-widest font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-300 uppercase">
              Para Compositores, Artistas e Produtores
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[52px] xl:text-[66px] 2xl:text-[70px] font-heading font-black tracking-tight leading-[1.1] sm:leading-[1.05] lg:leading-[0.98] uppercase">
            Seu repertório <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 font-black relative">
              na mão do
              <span className="absolute bottom-0.5 sm:bottom-1 left-0 w-16 sm:w-24 h-[3px] bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"></span>
            </span> <br />
            cantor certo.
          </h2>

          <div className="space-y-3">
            <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-xl font-normal leading-relaxed">
              Envie suas músicas em MP3, organize por repertórios e compartilhe uma faixa, uma seleção ou todo o seu catálogo através de links privados.
            </p>
            <p className="text-orange-400 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider">
              Você escolhe exatamente quais músicas cada pessoa poderá ouvir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 sm:pt-4 shrink-0">
            <button 
              id="hero-create-btn"
              onClick={() => onNavigate('auth', { isRegister: true })}
              className="px-5 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase lg:text-base tracking-wider hover:from-orange-500 hover:to-yellow-400 cursor-pointer shadow-xl shadow-orange-500/20 text-center flex items-center justify-center gap-2 group transition-transform hover:scale-102 text-slate-950 font-black whitespace-nowrap"
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 group-hover:animate-bounce shrink-0" /> CRIAR MEU SOMDRIVE GRÁTIS
            </button>
            
            <a 
              href="#planos"
              className="px-5 py-3.5 sm:px-6 sm:py-4 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition rounded-xl text-center font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-300 hover:text-white flex items-center justify-center gap-2"
            >
              CONHECER OS PLANOS
            </a>
          </div>

          {/* Custom responsive feature showcases aligned with the screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 sm:pt-8 border-t border-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)] shrink-0">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-400/5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Catálogo Privado</p>
                <p className="text-[10px] text-slate-500 leading-snug">Acesso por convite</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)] shrink-0">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 transform -rotate-12" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Envie para selecionados</p>
                <p className="text-[10px] text-slate-500 leading-snug">Você escolhe quem ouve</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)] shrink-0">
                <Car className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Ouça no Carro</p>
                <p className="text-[10px] text-slate-500 leading-snug">Bluetooth e modo carro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: High-Fidelity Tilted Smartphone, Spinning Vinyl, and Pro Studio Mixer Board */}
        <div id="hero-right" className="lg:col-span-5 relative flex flex-col items-center justify-center z-10 w-full min-h-[460px] sm:min-h-[500px] py-4 sm:py-6 select-none">
          <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-tr from-orange-500/10 via-yellow-500/5 to-transparent rounded-full filter blur-[110px] -z-20 pointer-events-none"></div>
          
          {/* High-Fidelity Retro-Modern Vinyl Record */}
          <div className="absolute right-[-20px] min-[400px]:right-[-60px] sm:right-[-100px] md:right-[-140px] top-[-20px] sm:top-[-50px] w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] md:w-[480px] md:h-[480px] rounded-full -z-10 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_4px_20px_rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center animate-spin-slow pb-2 pointer-events-none"
               style={{ background: 'repeating-radial-gradient(circle, #0e0f12 0px, #0e0f12 1.5px, #17181d 2px, #20212a 3.5px, #0e0f12 4px)' }}>
            
            {/* Golden Conic Reflection of a real Vinyl */}
            <div className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent_25%,rgba(249,115,22,0.06)_40%,rgba(255,255,255,0.1)_45%,rgba(249,115,22,0.06)_50%,transparent_65%,transparent_115%,rgba(249,115,22,0.06)_130%,rgba(255,255,255,0.1)_135%,rgba(249,115,22,0.06)_140%,transparent_155%)] rounded-full"></div>
            
            {/* Center Sticker */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full border-[4px] sm:border-[6px] md:border-[8px] border-[#0a0b0d] bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-2xl relative">
              {/* Sticker concentric circles */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border border-dashed border-black/20 flex flex-col items-center justify-center p-0.5 sm:p-1 text-center font-heading">
                <span className="text-[5px] sm:text-[6.5px] md:text-[8px] text-slate-950 font-black tracking-widest uppercase leading-none">SOMDRIVE</span>
                <span className="text-[3px] sm:text-[4px] md:text-[5px] text-slate-900/60 font-mono tracking-widest mt-0.5 leading-none">ORIGINAL CUT</span>
              </div>
              
              {/* Spindle hole */}
              <div className="absolute inset-x-0 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center mx-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full bg-slate-800"></div>
              </div>
            </div>
          </div>

          {/* Studio Mixing Console Decorative Board - Positioned nicely below the aligned phone */}
          <div className="absolute -left-32 -bottom-20 w-[380px] h-[190px] bg-[#121319]/90 border border-slate-800 p-5 rounded-3xl -z-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] hidden md:flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04] mb-2.5">
              <span className="text-[9px] font-mono tracking-widest text-slate-500 font-extrabold uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Main Mixer Bus
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-80 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-80"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-80"></div>
              </div>
            </div>
            
            {/* Mixer Tracks */}
            <div className="flex justify-between flex-1 gap-2">
              {/* VU meter block on the left */}
              <div className="w-10 bg-slate-950/80 border border-white/[0.03] rounded-lg p-1.5 flex flex-col justify-between items-center text-[7px] font-mono text-slate-500">
                <span className="text-[7.5px] font-bold text-orange-500 -mt-0.5 animate-pulse">L+R</span>
                <div className="flex flex-col gap-0.5 w-full items-center">
                  <div className="w-3.5 h-1 bg-red-500 rounded-sm shadow-[0_0_4px_rgba(239,68,68,0.5)] animate-pulse"></div>
                  <div className="w-3.5 h-1 bg-yellow-500 rounded-sm"></div>
                  <div className="w-3.5 h-1 bg-green-500 rounded-sm"></div>
                  <div className="w-3.5 h-1 bg-green-500 rounded-sm"></div>
                  <div className="w-3.5 h-1 bg-green-500 rounded-sm"></div>
                  <div className="w-3.5 h-1 bg-green-500 rounded-sm"></div>
                  <div className="w-3.5 h-1 bg-green-500 rounded-sm opacity-50"></div>
                </div>
              </div>

              {/* Slider Track 1 */}
              <div className="flex-1 bg-slate-950/40 rounded-xl p-2 flex flex-col items-center justify-between border border-white/[0.02]">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-orange-500 top-0.5 rounded-full"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-yellow-500 top-0.5 rounded-full"></div>
                  </div>
                </div>
                <div className="w-[3px] h-16 bg-slate-950 rounded-full relative flex justify-center">
                  <div className="absolute top-[40%] w-5 h-2.5 bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 rounded-sm cursor-pointer shadow-md flex flex-col items-center justify-center shadow-black/80">
                    <div className="w-[1.5px] h-1.5 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
                <span className="text-[7px] font-mono text-slate-500 uppercase">CH 1</span>
              </div>

              {/* Slider Track 2 */}
              <div className="flex-1 bg-slate-950/40 rounded-xl p-2 flex flex-col items-center justify-between border border-white/[0.02]">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-orange-500 top-0.5 rounded-full"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-yellow-500 top-0.5 rounded-full"></div>
                  </div>
                </div>
                <div className="w-[3px] h-16 bg-slate-950 rounded-full relative flex justify-center">
                  <div className="absolute top-[25%] w-5 h-2.5 bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 rounded-sm cursor-pointer shadow-md flex flex-col items-center justify-center shadow-black/80">
                    <div className="w-[1.5px] h-1.5 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
                <span className="text-[7px] font-mono text-slate-500 uppercase">CH 2</span>
              </div>

              {/* Slider Track 3 */}
              <div className="flex-1 bg-slate-950/40 rounded-xl p-2 flex flex-col items-center justify-between border border-white/[0.02]">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-orange-500 top-0.5 rounded-full"></div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center relative">
                    <div className="absolute w-[1.5px] h-1.5 bg-yellow-500 top-0.5 rounded-full"></div>
                  </div>
                </div>
                <div className="w-[3px] h-16 bg-slate-950 rounded-full relative flex justify-center">
                  <div className="absolute top-[55%] w-5 h-2.5 bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 rounded-sm cursor-pointer shadow-md flex flex-col items-center justify-center shadow-black/80 animate-pulse">
                    <div className="w-[1.5px] h-1.5 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
                <span className="text-[7px] font-mono text-slate-500 uppercase">CH 3</span>
              </div>
            </div>
          </div>

          {/* Aligned Smartphone Mock-up - Positioned higher and perfectly straight/upright */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[350px] lg:max-w-[340px] xl:max-w-[370px] aspect-[9/18.5] bg-[#0a0c10] rounded-[36px] sm:rounded-[48px] p-2 sm:p-2.5 border-2 sm:border-4 border-slate-800 shadow-[0_35px_80px_rgba(0,0,0,0.95),0_0_1px_1px_rgba(249,115,22,0.15)] flex flex-col justify-between overflow-hidden translate-y-0 lg:-translate-y-16 xl:-translate-y-20 lg:scale-105 transition-all duration-700 hover:scale-107 group">
            
            {/* Edge Glare glossy line */}
            <div className="absolute inset-y-0 left-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-30"></div>
            
            {/* Dynamic Island / Notch */}
            <div className="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-5 sm:h-5.5 bg-[#08080a] rounded-full z-40 border border-white/[0.04] flex items-center justify-between px-3 sm:px-3.5">
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-sky-950/80 border border-blue-900/40"></div>
              <div className="w-6 sm:w-8 h-1 bg-[#101014] rounded-full"></div>
              <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-slate-950"></div>
            </div>

            {/* Viewport viewport wrapper */}
            <div className="flex-1 bg-[#06070a] rounded-[28px] sm:rounded-[38px] p-3 sm:p-4.5 pt-5 sm:pt-7 pb-3 sm:pb-4 overflow-hidden flex flex-col justify-between select-none relative">
              
              {/* Inner ambient mesh circles */}
              <div className="absolute inset-x-0 top-1/4 bottom-1/4 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_60%)] -z-10 pointer-events-none"></div>
              
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3.5 border-b border-white/[0.04] mb-2 sm:mb-3.5 mt-0.5 sm:mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-0.5 h-2.5 sm:h-3 shrink-0">
                    <span className="w-0.5 h-1 bg-orange-500 animate-pulse rounded-full"></span>
                    <span className="w-0.5 h-2 bg-orange-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-0.5 h-1.5 bg-orange-500 animate-pulse rounded-full" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-[9.5px] sm:text-xs font-heading font-black tracking-widest text-white uppercase mt-0.5">SOMDRIVE</span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="relative">
                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 hover:text-white transition cursor-pointer" />
                    <span className="absolute top-0 right-0 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                    <span className="absolute top-0 right-0 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full"></span>
                  </div>
                  <div className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-full bg-[#121319] border border-orange-500/20 flex items-center justify-center text-[8.5px] sm:text-[10px] font-heading font-black text-orange-400 shadow shadow-orange-500/10">
                    GS
                  </div>
                </div>
              </div>

              {/* Private Catalog Card */}
              <div className="bg-[#121319]/90 border border-white/[0.05] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 shadow-md shadow-black/30 mb-2 sm:mb-3 hover:border-orange-500/10 transition-colors">
                <div className="p-2 sm:p-2.5 bg-yellow-500/10 border border-yellow-550/20 text-yellow-550 rounded-lg sm:rounded-xl relative shadow-[inset_0_1px_5px_rgba(234,179,8,0.1)] shrink-0">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500/10" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] sm:text-[11px] font-heading font-black text-white uppercase tracking-wider">Catálogo Privado</h4>
                  <p className="text-[8.5px] sm:text-[9.5px]/none font-mono text-slate-500 tracking-wide mt-0.5">Acesso por convite</p>
                </div>
              </div>

              {/* Spectacular Circular Equalizer Spectrogram */}
              <div className="flex-1 flex items-center justify-center relative min-h-[140px] sm:min-h-[170px] my-2 sm:my-3">
                {/* Concentric glowing rings */}
                <div className="absolute rounded-full border border-orange-500/5 w-44 h-44 sm:w-60 sm:h-60 animate-pulse"></div>
                <div className="absolute rounded-full border border-dashed border-orange-500/15 w-36 h-36 sm:w-48 sm:h-48 animate-spin-slow"></div>
                <div className="absolute rounded-full border border-orange-500/25 bg-radial-gradient from-orange-950/2 w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shadow-[inset_0_0_30px_rgba(249,115,22,0.15)]">
                  
                  {/* Decorative rotating dotted line circle */}
                  <svg className="w-full h-full absolute animate-spin-slow opacity-25" viewBox="0 0 100 100" style={{ animationDuration: '30s' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2, 6" />
                  </svg>
                  
                  {/* Dynamic central soundwaves */}
                  <div className="flex items-center gap-1 justify-center h-10 sm:h-14 w-20 sm:w-28 relative z-10">
                    {[10, 24, 40, 50, 36, 20, 32, 46, 26, 14, 18].map((h, i) => {
                      const delay = (i % 4) * 120;
                      return (
                        <div
                          key={i}
                          style={{
                            height: `${h * 0.8}px`,
                            animationDelay: `${delay}ms`
                          }}
                          className="w-[1.5px] sm:w-[2.5px] bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-300 rounded-full animate-pulse opacity-95 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Three Grid Feature Buttons */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-1 sm:mt-2 mb-2 sm:mb-3.5">
                {/* Envio */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex flex-col items-center justify-between text-center min-h-[75px] sm:min-h-[85px] shadow-sm">
                  <div className="p-1 sm:p-1.5 bg-orange-950/50 border border-orange-500/20 text-orange-400 rounded-md sm:rounded-lg">
                    <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 transform -rotate-45" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1 sm:mt-1.5">Envio por</span>
                  <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-orange-400 uppercase tracking-tight mt-0.5 sm:mt-1 flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Convite
                  </span>
                </div>

                {/* Bluetooth */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex flex-col items-center justify-between text-center min-h-[75px] sm:min-h-[85px] shadow-sm">
                  <div className="p-1 sm:p-1.5 bg-blue-950/50 border border-blue-500/20 text-blue-400 rounded-md sm:rounded-lg">
                    <Bluetooth className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1 sm:mt-1.5">Bluetooth</span>
                  <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-tight mt-0.5 sm:mt-1 flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span> On
                  </span>
                </div>

                {/* Modo Carro */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl flex flex-col items-center justify-between text-center min-h-[75px] sm:min-h-[85px] shadow-sm">
                  <div className="p-1 sm:p-1.5 bg-yellow-950/50 border border-yellow-550/20 text-yellow-500 rounded-md sm:rounded-lg">
                    <Car className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1 sm:mt-1.5">Modo Carro</span>
                  <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-yellow-400 uppercase tracking-tight mt-0.5 sm:mt-1 flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span> Ativo
                  </span>
                </div>
              </div>

              {/* Wide Enviar por Link Button */}
              <button 
                onClick={() => onNavigate('auth', { isRegister: true })}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 rounded-xl font-heading font-black tracking-widest text-[9.5px] sm:text-[10.5px] uppercase cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 group transition-all duration-300 shadow-md shadow-orange-500/10 hover:shadow-orange-550/20 transform hover:-translate-y-0.5 select-none"
              >
                <Link className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-950 stroke-[2.5]" /> Enviar por Link
              </button>

              {/* Footer text */}
              <div className="flex items-center justify-center gap-1 mt-2.5 sm:mt-3.5 text-slate-500 text-[8px] sm:text-[8.5px] font-mono uppercase tracking-widest">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-600" />
                <span>Compartilhe com selecionados</span>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* COMPARTILHE DO SEU JEITO */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">Compartilhe do Seu Jeito</h3>
          <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            Várias Formas de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400">distribuir seu acervo</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Seja direcionado ou completo, você tem o controle total de como divulga suas gravações.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-orange-950/50 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-400 mb-4">
                <Music className="w-5 h-5" />
              </div>
              <h4 className="text-base font-heading font-bold uppercase tracking-tight text-white mb-2">UMA MÚSICA</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                “Crie um link exclusivo para uma única composição. Quem receber verá somente a música escolhida.”
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-orange-950/50 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-400 mb-4">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-base font-heading font-bold uppercase tracking-tight text-white mb-2">UMA SELEÇÃO</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                “Escolha 2, 3, 5 ou quantas músicas desejar e compartilhe apenas essa seleção.”
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-orange-950/50 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-400 mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-heading font-bold uppercase tracking-tight text-white mb-2">UM REPERTÓRIO</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                “Organize músicas por estilo, cantor, gravação, show, ensaio ou projeto.”
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-orange-950/50 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-400 mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-heading font-bold uppercase tracking-tight text-white mb-2">PERFIL COMPLETO</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                “Compartilhe seu catálogo completo com repertórios, músicas liberadas, contato e player profissional.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANIZE SUAS MÚSICAS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="bg-gradient-to-br from-[#0d1326] to-[#080d1a] border border-slate-850 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">Organize Seu Acervo</h3>
              <h2 className="text-2xl md:text-4xl font-heading font-black tracking-tight uppercase text-white leading-tight">
                ORGANIZE SEU ACERVO DO SEU JEITO
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                “Todas as músicas enviadas ficam no seu acervo principal. Depois, você pode separá-las em repertórios, pastas, seleções e projetos.”
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                “Uma mesma música pode fazer parte de diferentes repertórios sem precisar ser enviada novamente.”
              </p>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 text-xs text-orange-400 font-medium">
                “O limite do plano considera a quantidade de músicas enviadas, e não a quantidade de repertórios criados.”
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#06080d]/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 pb-2 border-b border-white/[0.04] font-black">Exemplo Visual Prático:</h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex justify-between items-center bg-slate-900/50 px-3.5 py-2 rounded-lg border border-slate-850">
                  <span className="text-slate-300">📁 Românticas</span>
                  <span className="font-mono text-orange-400 font-bold">5 músicas</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/50 px-3.5 py-2 rounded-lg border border-slate-850">
                  <span className="text-slate-300">📁 Animadas</span>
                  <span className="font-mono text-orange-400 font-bold">6 músicas</span>
                </li>
                <li className="flex justify-between items-center bg-slate-900/50 px-3.5 py-2 rounded-lg border border-slate-850">
                  <span className="text-slate-300">📁 Para gravação</span>
                  <span className="font-mono text-orange-400 font-bold">4 músicas</span>
                </li>
                <li className="flex justify-between items-center bg-orange-950/35 px-3.5 py-2 rounded-lg border border-orange-500/20 font-black">
                  <span className="text-white">⭐ Repertório completo</span>
                  <span className="font-mono text-orange-400">15 músicas</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">Workflow Simples</h3>
          <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            COMO FUNCIONA
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sem burocracias, do upload ao play no som do carro em poucos segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 shadow-xl">
            <span className="text-xs font-mono text-orange-400 font-black block">ETAPA 01</span>
            <h4 className="text-base font-heading font-bold uppercase text-white">1. ENVIE SUAS MÚSICAS</h4>
            <p className="text-slate-405 text-xs leading-relaxed">
              “Faça o upload dos seus próprios arquivos MP3.”
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 shadow-xl">
            <span className="text-xs font-mono text-orange-400 font-black block">ETAPA 02</span>
            <h4 className="text-base font-heading font-bold uppercase text-white">2. ORGANIZE</h4>
            <p className="text-slate-405 text-xs leading-relaxed">
              “Deixe a música no acervo geral, adicione a um repertório existente ou crie uma nova pasta.”
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 shadow-xl">
            <span className="text-xs font-mono text-orange-400 font-black block">ETAPA 03</span>
            <h4 className="text-base font-heading font-bold uppercase text-white">3. ESCOLHA O QUE COMPARTILHAR</h4>
            <p className="text-slate-405 text-xs leading-relaxed">
              “Compartilhe uma música, algumas faixas, um repertório ou seu perfil completo.”
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 shadow-xl">
            <span className="text-xs font-mono text-orange-400 font-black block">ETAPA 04</span>
            <h4 className="text-base font-heading font-bold uppercase text-white">4. ENVIE O LINK</h4>
            <p className="text-slate-405 text-xs leading-relaxed">
              “Compartilhe pelo WhatsApp com cantores, produtores, músicos ou integrantes da equipe.”
            </p>
          </div>
        </div>
      </section>

      {/* PARA QUEM É O SOMDRIVE */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Para quem compõe */}
          <div className="p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">PARA COMPOSITORES</h3>
              <h2 className="text-2xl font-heading font-black text-white uppercase">FEITO PARA QUEM COMPÕE</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                “Crie uma seleção profissional e envie apenas as músicas que combinam com cada cantor.”
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> organizar músicas inéditas;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> criar repertórios por estilo;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> separar músicas para diferentes cantores;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> compartilhar somente as composições adequadas para cada oportunidade;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> apresentar letra, ficha técnica e contato;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> ouvir no celular ou no carro;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> evitar o envio de vários arquivos soltos pelo WhatsApp.</li>
              </ul>
            </div>
          </div>

          {/* Para quem vai gravar */}
          <div className="p-8 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">PARA CANTORES E ARTISTAS</h3>
              <h2 className="text-2xl font-heading font-black text-white uppercase">TAMBÉM PARA QUEM VAI GRAVAR</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                “O cantor também pode usar o SomDrive como seu acervo musical privado de trabalho.”
              </p>
              <ul className="space-y-2 text-xs text-slate-400 pt-2">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> organizar guias e demos;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> separar músicas para gravação;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> montar repertório de show;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> criar pastas para ensaio;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> organizar músicas por CD, EP ou projeto;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> compartilhar com músicos e produtores;</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 shrink-0" /> ouvir no celular e no carro.</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* ÁUDIO LEVE */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="p-8 bg-[#10131e] border border-orange-500/20 rounded-3xl space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-950 border border-orange-500/20 text-orange-400 rounded-xl">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-heading font-black text-lg sm:text-xl uppercase tracking-tight text-white/90">
              STREAMING LEVE E OTIMIZADO PARA REDES MÓVEIS
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                “Para carregamento mais rápido no celular e no carro, recomendamos enviar arquivos em MP3 com até 5 MB por música.”
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                “Arquivos menores carregam mais rápido e ajudam a reduzir o consumo de dados móveis durante a reprodução.”
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                “Um MP3 bem convertido pode manter uma boa qualidade para audição mesmo ocupando menos espaço.”
              </p>
            </div>

            <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 pb-2 border-b border-white/[0.04] mb-3 font-bold">Guia Recomendado:</h4>
              <ul className="space-y-2 text-xs font-mono">
                <li className="flex justify-between px-2 py-1 bg-slate-950/60 rounded">
                  <span className="text-slate-400">Formato:</span>
                  <span className="text-orange-400 font-bold">MP3</span>
                </li>
                <li className="flex justify-between px-2 py-1 bg-slate-950/60 rounded">
                  <span className="text-slate-400">Tamanho Recomendado:</span>
                  <span className="text-orange-400 font-bold">entre 2 MB e 4 MB</span>
                </li>
                <li className="flex justify-between px-2 py-1 bg-slate-950/60 rounded">
                  <span className="text-slate-400">Tamanho Máximo Sugerido:</span>
                  <span className="text-orange-400 font-bold">5 MB</span>
                </li>
                <li className="flex justify-between px-2 py-1 bg-slate-950/60 rounded">
                  <span className="text-slate-400">Qualidade Recomendada:</span>
                  <span className="text-orange-400 font-bold">96 kbps ou 128 kbps</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-bold">Planos e Limites</h3>
          <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            Escolha o Plano Ideal
          </h2>
          <p className="text-slate-200 text-base leading-relaxed font-semibold">
            Crie seu catálogo musical privado, envie suas composições por link e permita que cantores, produtores e contratantes ouçam suas músicas com facilidade.
          </p>
          <p className="text-slate-400 text-xs md:text-sm">
            Todos os planos incluem os mesmos recursos principais. A diferença está na quantidade de músicas que você pode cadastrar.
          </p>
        </div>

        {/* Monthly / Yearly Converter Toggle */}
        <div className="flex justify-center items-center mb-12">
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center relative">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 select-none cursor-pointer ${
                billingCycle === 'monthly' 
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-white font-semibold'
              }`}
            >
              Faturamento Mensal
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 select-none cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly' 
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-white font-semibold'
              }`}
            >
              Faturamento Anual
              <span className="bg-slate-950 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded-md border border-yellow-500/20 lowercase tracking-normal font-semibold">
                economize ~20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* Soundrive Free Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/80 transition duration-300 relative h-full">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">{landingPlans.free.badge}</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{landingPlans.free.name}</h4>
                </div>
                <h5 className="text-3xl font-heading font-black text-slate-100">{landingPlans.free.price}</h5>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{landingPlans.free.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {landingPlans.free.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-500/10 border border-orange-500/35 px-3 py-1.5 rounded-lg text-orange-400 font-extrabold tracking-wide text-xs">
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
              <button 
                onClick={() => onNavigate('auth', { isRegister: true })}
                className="w-full text-center py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer select-none font-bold"
              >
                Cadastrar grátis
              </button>
            </div>
          </div>

          {/* Soundrive Essencial Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/80 transition duration-300 relative h-full">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold">{landingPlans.essencial.badge}</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{landingPlans.essencial.name}</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <h5 className="text-3xl font-heading font-black text-white">
                      {landingPlans.essencial.price}
                    </h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{landingPlans.essencial.period}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{landingPlans.essencial.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {landingPlans.essencial.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-500/10 border border-orange-500/35 px-3 py-1.5 rounded-lg text-orange-400 font-extrabold tracking-wide text-xs">
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
              <button 
                onClick={() => onNavigate('auth', { isRegister: true })}
                className="w-full text-center py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer select-none font-bold"
              >
                Quero ser Essencial
              </button>
            </div>
          </div>

          {/* Soundrive Pro Card (Highlighted!) */}
          <div className="relative bg-gradient-to-b from-[#14100c] to-[#0c0d12] border-2 border-orange-500 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.02] transition duration-300 shadow-2xl shadow-orange-950/30 h-full">
            {/* Top recommendation bubble */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-yellow-500 px-3.5 py-1 text-slate-950 text-[10px] uppercase font-heading font-black tracking-widest rounded-full shadow-lg font-bold flex items-center gap-1 whitespace-nowrap z-20">
              <Star className="w-3.5 h-3.5 fill-slate-950" /> {landingPlans.pro.badge}
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-orange-955 text-orange-400 rounded text-[9px] font-mono uppercase tracking-widest font-extrabold border border-orange-500/20">Recomendado</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{landingPlans.pro.name}</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <h5 className="text-3xl font-heading font-black text-white">
                      {landingPlans.pro.price}
                    </h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{landingPlans.pro.period}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{landingPlans.pro.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {landingPlans.pro.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-550/15 border border-orange-500 px-3 py-1.5 rounded-lg text-orange-400 font-extrabold tracking-wide text-xs shadow-md">
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

            <div className="mt-8">
              <button 
                onClick={() => onNavigate('auth', { isRegister: true, startPremium: false })}
                className="w-full text-center py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer select-none font-bold shadow-lg shadow-orange-500/10"
              >
                Quero ser Pro
              </button>
            </div>
          </div>

          {/* Soundrive Premium Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/80 transition duration-300 relative h-full">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold font-bold">{landingPlans.premium.badge}</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">{landingPlans.premium.name}</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <h5 className="text-3xl font-heading font-black text-white">
                      {landingPlans.premium.price}
                    </h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{landingPlans.premium.period}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">{landingPlans.premium.description}</p>

              {/* Feature bullet list */}
              <ul className="space-y-3 text-xs">
                {landingPlans.premium.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    {feat.highlight ? (
                      <div className="w-full bg-orange-500/10 border border-orange-500/35 px-3 py-1.5 rounded-lg text-orange-400 font-extrabold tracking-wide text-xs">
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
              <button 
                onClick={() => onNavigate('auth', { isRegister: true, startPremium: true })}
                className="w-full text-center py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer select-none font-bold"
              >
                Quero ser Premium
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ - Perguntas Frequentes */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-32">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">Dúvidas Comuns</h3>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tire todas as suas dúvidas sobre o funcionamento do SomDrive, compartilhamento e planos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">1. Posso criar mais de um repertório?</h4>
            <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
              "Sim! Você pode criar quantos repertórios, pastas ou seleções desejar. O limite do seu plano considera apenas a quantidade de músicas diferentes que você faz o upload no seu acervo geral."
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">2. Como funciona o compartilhamento?</h4>
            <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
              "Você pode compartilhar seu perfil inteiro com todas as pastas públicas, compartilhar apenas uma pasta/repertório específico, compartilhar uma seleção manual de algumas faixas ou criar um link exclusivo para uma única composição."
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">3. Quem receber o link precisa ter conta ou login no SomDrive?</h4>
            <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
              "Não! Produtores, cantores, músicos e contratantes acessam o player profissional de forma aberta e direta. Eles podem ouvir as músicas, ler a ficha técnica e ver sua letra sem precisar criar nenhuma conta ou instalar qualquer aplicativo."
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">4. O SomDrive é público? Outros compositores podem ver minhas músicas?</h4>
            <p className="text-slate-355 text-xs sm:text-sm leading-relaxed text-left">
              "Não. Suas músicas são privadas por padrão. Elas só podem ser encontradas por quem tiver os links de compartilhamento específicos que você mesmo gerou e divulgou."
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">5. Como funciona a liberação automática do plano?</h4>
            <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
              "Nossos pagamentos são processados via Mercado Pago. Assim que o Pix ou Cartão é aprovado, o próprio Mercado Pago avisa nosso sistema e seu plano é liberado automaticamente na hora."
            </p>
          </div>

          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-2 text-left">
            <h4 className="text-base font-heading font-bold text-white uppercase tracking-tight">6. Como funciona a recomendação de MP3 leve?</h4>
            <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">
              "Para garantir que quem receber seu link no trânsito, no celular ou pareando via Bluetooth no carro consiga ouvir instantaneamente sem travamentos, sugerimos enviar arquivos MP3 de até 5 MB de tamanho. Seus ouvintes agradecerão o carregamento rápido."
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-32 text-center">
        <div className="bg-gradient-to-r from-orange-600/10 via-yellow-500/5 to-orange-600/10 border border-orange-500/20 rounded-3xl p-8 md:p-14 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
          {/* Glowing particle background behind CTA */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h2 className="text-xl sm:text-3xl md:text-4xl font-heading font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight leading-tight relative z-10">
            PRONTO PARA APRESENTAR SEU REPERTÓRIO COMO UM PROFISSIONAL?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto relative z-10 font-sans">
            Crie sua conta agora mesmo e organize seu catálogo musical na nuvem.
          </p>
          <div className="flex justify-center pt-2 relative z-10">
            <button 
              onClick={() => onNavigate('auth', { isRegister: true })}
              className="px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider hover:from-orange-500 hover:to-yellow-400 cursor-pointer shadow-xl shadow-orange-500/20 transition duration-300 select-none text-slate-950 font-black"
            >
              COMEÇAR AGORA DE GRAÇA
            </button>
          </div>
        </div>
      </section>

      {/* Trust Seal Footer */}
      <footer className="mt-28 py-10 border-t border-slate-900 text-center max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono uppercase mb-3">
          <ShieldCheck className="w-4 h-4 text-orange-500" /> Seus áudios em alta qualidade e 100% seguros • SSL Ativo
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} SomDrive. Desenvolvido para a indústria musical do Brasil.
        </p>
      </footer>

    </div>
  );
}
