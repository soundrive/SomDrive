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

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  currentUser: Artist | null;
  onLogout: () => void;
}

const TEST_ARTISTS = [
  {
    id: 'gabriel-silva',
    name: 'Gabriel Silva',
    tagline: 'Compositor Sertanejo',
    city: 'Goiânia • GO',
    badgeText: 'Sertanejo',
    accentColor: 'orange',
    accentClass: 'from-orange-500 to-yellow-500',
    accentText: 'text-orange-400',
    hoverText: 'hover:text-orange-300',
    dividerColor: 'border-orange-500/20',
    glowColor: 'from-orange-500/20 via-yellow-500/5 to-transparent',
    avatarChar: 'GS',
    plays: '14.2k plays',
    whatsapp: '(62) 99876-5432',
    instagram: '@gabrielsilva_compo',
    bannerGradient: 'from-slate-900 to-orange-950/60',
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

export default function LandingPage({ onNavigate, currentUser, onLogout }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isSimulatedPlaying, setIsSimulatedPlaying] = useState(true);
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white pb-20 relative overflow-hidden">
      
      {/* Ambient Grid overlay & Decorative Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute right-[-10%] top-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent rounded-full filter blur-[120px] pointer-events-none z-0 animate-pulse"></div>
      <div className="absolute left-[-5%] top-[25%] w-[500px] h-[500px] bg-gradient-to-br from-yellow-500/5 via-orange-600/5 to-transparent rounded-full filter blur-[140px] pointer-events-none z-0"></div>

      {/* Navigation Top Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 md:px-12 flex items-center justify-between">
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="p-2 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-orange-500/25 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-heading font-black text-lg md:text-xl tracking-tight text-white uppercase leading-none">
              Soun<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">drive</span>
            </h1>
            <p className="text-[9px] font-mono tracking-widest text-yellow-400 uppercase font-bold mt-0.5">Catálogo Profissional</p>
          </div>
        </div>

        <nav id="top-nav" className="flex items-center gap-4">
          <a href="#planos" className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition">
            Planos
          </a>
          
          {currentUser ? (
            <div className="flex items-center gap-3">
              {(currentUser.role === 'admin' || currentUser.email === 'videopremieroficial@gmail.com' || currentUser.email === 'sertanejopremier@gmail.com') && (
                <button 
                  id="header-admin-btn"
                  onClick={() => onNavigate('admin')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded-lg text-xs font-heading font-bold uppercase tracking-wider cursor-pointer shadow hover:border-slate-700 font-mono"
                >
                  Área Admin 🛡️
                </button>
              )}
              <button 
                id="header-dash-btn"
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-lg text-xs font-heading font-bold uppercase tracking-wider hover:from-orange-500 hover:to-yellow-400 cursor-pointer shadow-md shadow-orange-500/10 select-none text-slate-950"
              >
                Painel do Artista
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
            <div className="flex items-center gap-3">
              <button 
                id="header-login-btn"
                onClick={() => onNavigate('auth', { isRegister: false })}
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-orange-400 transition cursor-pointer"
              >
                Entrar
              </button>
              <button 
                id="header-register-btn"
                onClick={() => onNavigate('auth', { isRegister: true })}
                className="px-4 py-2 bg-orange-600 border border-orange-500 rounded-lg text-xs font-heading font-bold uppercase tracking-wider hover:bg-orange-500 transition cursor-pointer shadow-lg shadow-orange-500/15 text-white"
              >
                Criar Conta
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Hand: High impact text */}
        <div id="hero-left" className="lg:col-span-7 space-y-7 text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-slate-900/90 border border-white/[0.06] rounded-full shadow-lg shadow-orange-500/5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-mono tracking-widest font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-300 uppercase">
              Para Compositores, Artistas e Produtores
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-[70px] font-heading font-black tracking-tight leading-[0.95] uppercase">
            Seu repertório <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 font-black relative">
              na mão do
              <span className="absolute bottom-1 left-0 w-24 h-[3px] bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"></span>
            </span> <br />
            cantor certo.
          </h2>

          <p className="text-slate-400 text-base md:text-lg max-w-xl font-normal leading-relaxed">
            Abandone os arquivos pesados de WhatsApp e pen drives de plástico. Crie seu catálogo profissional online e envie o link exclusivo para produtores ouvirem direto no celular ou pareado via Bluetooth no painel do carro.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 shrink-0">
            <button 
              id="hero-create-btn"
              onClick={() => onNavigate('auth', { isRegister: true })}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-500 rounded-xl font-heading font-extrabold text-sm uppercase lg:text-base tracking-wider hover:from-orange-500 hover:to-yellow-400 cursor-pointer shadow-xl shadow-orange-500/20 text-center flex items-center justify-center gap-2 group transition-transform hover:scale-102 text-slate-950"
            >
              <Smartphone className="w-5 h-5 text-slate-950 group-hover:animate-bounce" /> Criar Meu Soundrive Grátis
            </button>
            
            <a 
              href="#planos"
              className="px-6 py-4 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition rounded-xl text-center font-heading font-bold text-sm uppercase tracking-wider text-slate-300 hover:text-white flex items-center justify-center gap-2"
            >
              Conhecer Planos
            </a>
          </div>

          {/* Custom responsive feature showcases aligned with the screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)]">
                <Lock className="w-5 h-5 fill-orange-400/5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Catálogo Privado</p>
                <p className="text-[10px] text-slate-500 leading-snug">Acesso por convite</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)]">
                <Send className="w-5 h-5 transform -rotate-12" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Envie para selecionados</p>
                <p className="text-[10px] text-slate-500 leading-snug">Você escolhe quem ouve</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-950/40 border border-orange-500/20 rounded-xl text-orange-400 shadow-[inset_0_1px_5px_rgba(249,115,22,0.1)]">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-heading font-black text-white uppercase tracking-wider">Ouça no Carro</p>
                <p className="text-[10px] text-slate-500 leading-snug">Bluetooth e modo carro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: High-Fidelity Tilted Smartphone, Spinning Vinyl, and Pro Studio Mixer Board */}
        <div id="hero-right" className="lg:col-span-5 relative flex flex-col items-center justify-center z-10 w-full min-h-[500px] py-6 select-none">
          <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-tr from-orange-500/10 via-yellow-500/5 to-transparent rounded-full filter blur-[110px] -z-20 pointer-events-none"></div>
          
          {/* High-Fidelity Retro-Modern Vinyl Record */}
          <div className="absolute right-[-140px] top-[-50px] w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full -z-10 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_4px_20px_rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center animate-spin-slow pb-2 pointer-events-none"
               style={{ background: 'repeating-radial-gradient(circle, #0e0f12 0px, #0e0f12 1.5px, #17181d 2px, #20212a 3.5px, #0e0f12 4px)' }}>
            
            {/* Golden Conic Reflection of a real Vinyl */}
            <div className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent_25%,rgba(249,115,22,0.06)_40%,rgba(255,255,255,0.1)_45%,rgba(249,115,22,0.06)_50%,transparent_65%,transparent_115%,rgba(249,115,22,0.06)_130%,rgba(255,255,255,0.1)_135%,rgba(249,115,22,0.06)_140%,transparent_155%)] rounded-full"></div>
            
            {/* Center Sticker */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[6px] md:border-[8px] border-[#0a0b0d] bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-2xl relative">
              {/* Sticker concentric circles */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-dashed border-black/20 flex flex-col items-center justify-center p-1 text-center font-heading">
                <span className="text-[6.5px] md:text-[8px] text-slate-950 font-black tracking-widest uppercase leading-none">SOUNDRIVE</span>
                <span className="text-[4px] md:text-[5px] text-slate-900/60 font-mono tracking-widest mt-0.5 leading-none">ORIGINAL CUT</span>
              </div>
              
              {/* Spindle hole */}
              <div className="absolute inset-x-0 w-5 h-5 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center mx-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                <div className="w-1 h-1 rounded-full bg-slate-800"></div>
              </div>
            </div>
          </div>

          {/* Studio Mixing Console Decorative Board */}
          <div className="absolute -left-28 -bottom-12 w-[380px] h-[190px] bg-[#121319]/90 border border-slate-800 p-5 rounded-3xl -z-10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] hidden md:flex flex-col justify-between overflow-hidden">
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

          {/* Tilted Smartphone Mock-up */}
          <div className="relative w-full max-w-[345px] md:max-w-[370px] aspect-[9/18.5] bg-[#0a0c10] rounded-[48px] p-2.5 border-4 border-slate-800 shadow-[0_35px_80px_rgba(0,0,0,0.95),0_0_1px_1px_rgba(249,115,22,0.15)] flex flex-col justify-between overflow-hidden lg:rotate-x-[12deg] lg:-rotate-y-[15deg] lg:rotate-[3deg] lg:skew-y-[-1deg] lg:scale-105 transition-all duration-700 hover:rotate-x-[6deg] hover:-rotate-y-[8deg] hover:rotate-[1deg] hover:scale-107 group relative">
            
            {/* Edge Glare glossy line */}
            <div className="absolute inset-y-0 left-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/10 to-transparent z-30"></div>
            
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-[#08080a] rounded-full z-40 border border-white/[0.04] flex items-center justify-between px-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-950/80 border border-blue-900/40"></div>
              <div className="w-8 h-1 bg-[#101014] rounded-full"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
            </div>

            {/* Viewport viewport wrapper */}
            <div className="flex-1 bg-[#06070a] rounded-[38px] p-4.5 pt-7 pb-4 overflow-hidden flex flex-col justify-between select-none relative">
              
              {/* Inner ambient mesh circles */}
              <div className="absolute inset-x-0 top-1/4 bottom-1/4 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_60%)] -z-10 pointer-events-none"></div>
              
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.04] mb-3.5 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-1.5 bg-orange-500 animate-pulse rounded-full"></span>
                    <span className="w-0.5 h-3 bg-orange-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-0.5 h-2 bg-orange-500 animate-pulse rounded-full" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs font-heading font-black tracking-widest text-white uppercase mt-0.5">SOUNDRIVE</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-4 h-4 text-slate-400 hover:text-white transition cursor-pointer" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#121319] border border-orange-500/20 flex items-center justify-center text-[10px] font-heading font-black text-orange-400 shadow shadow-orange-500/10">
                    GS
                  </div>
                </div>
              </div>

              {/* Private Catalog Card */}
              <div className="bg-[#121319]/90 border border-white/[0.05] p-3.5 rounded-2xl flex items-center gap-3.5 shadow-md shadow-black/30 mb-3 hover:border-orange-500/10 transition-colors">
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-550/20 text-yellow-550 rounded-xl relative shadow-[inset_0_1px_5px_rgba(234,179,8,0.1)]">
                  <Lock className="w-4 h-4 fill-yellow-500/10" />
                </div>
                <div>
                  <h4 className="text-[11px] font-heading font-black text-white uppercase tracking-wider">Catálogo Privado</h4>
                  <p className="text-[9.5px] font-mono text-slate-500 tracking-wide mt-0.5">Acesso por convite</p>
                </div>
              </div>

              {/* Spectacular Circular Equalizer Spectrogram */}
              <div className="flex-1 flex items-center justify-center relative min-h-[170px] my-3">
                {/* Concentric glowing rings */}
                <div className="absolute rounded-full border border-orange-500/5 w-60 h-60 animate-pulse"></div>
                <div className="absolute rounded-full border border-dashed border-orange-500/15 w-48 h-48 animate-spin-slow"></div>
                <div className="absolute rounded-full border border-orange-500/25 bg-radial-gradient from-orange-950/2 w-36 h-36 flex items-center justify-center shadow-[inset_0_0_30px_rgba(249,115,22,0.15)]">
                  
                  {/* Decorative rotating dotted line circle */}
                  <svg className="w-full h-full absolute animate-spin-slow opacity-25" viewBox="0 0 100 100" style={{ animationDuration: '30s' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2, 6" />
                  </svg>
                  
                  {/* Dynamic central soundwaves */}
                  <div className="flex items-center gap-1 justify-center h-14 w-28 relative z-10">
                    {[12, 28, 48, 60, 42, 24, 38, 55, 30, 16, 22].map((h, i) => {
                      const delay = (i % 4) * 120;
                      return (
                        <div
                          key={i}
                          style={{
                            height: `${h}px`,
                            animationDelay: `${delay}ms`
                          }}
                          className="w-[2.5px] bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-300 rounded-full animate-pulse opacity-95 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Three Grid Feature Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-2 mb-3.5">
                {/* Envio */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-between text-center min-h-[85px] shadow-sm">
                  <div className="p-1.5 bg-orange-950/50 border border-orange-500/20 text-orange-400 rounded-lg">
                    <Send className="w-3.5 h-3.5 transform -rotate-45" />
                  </div>
                  <span className="text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1.5">Envio por</span>
                  <span className="text-[8px] font-mono font-bold text-orange-400 uppercase tracking-tight mt-1 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Convite
                  </span>
                </div>

                {/* Bluetooth */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-between text-center min-h-[85px] shadow-sm">
                  <div className="p-1.5 bg-blue-950/50 border border-blue-500/20 text-blue-400 rounded-lg">
                    <Bluetooth className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1.5">Bluetooth</span>
                  <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-tight mt-1 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Conectado
                  </span>
                </div>

                {/* Modo Carro */}
                <div className="bg-[#121319]/80 border border-white/[0.04] p-2.5 rounded-xl flex flex-col items-center justify-between text-center min-h-[85px] shadow-sm">
                  <div className="p-1.5 bg-yellow-950/50 border border-yellow-550/20 text-yellow-500 rounded-lg">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-heading font-black text-slate-300 uppercase leading-none mt-1.5">Modo Carro</span>
                  <span className="text-[8px] font-mono font-bold text-yellow-400 uppercase tracking-tight mt-1 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Ativo
                  </span>
                </div>
              </div>

              {/* Wide Enviar por Link Button */}
              <button 
                onClick={() => onNavigate('auth', { isRegister: true })}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 rounded-xl font-heading font-black tracking-widest text-[10.5px] uppercase cursor-pointer flex items-center justify-center gap-2 group transition-all duration-300 shadow-md shadow-orange-500/10 hover:shadow-orange-550/20 transform hover:-translate-y-0.5 select-none"
              >
                <Link className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" /> Enviar por Link
              </button>

              {/* Footer text */}
              <div className="flex items-center justify-center gap-1 mt-3.5 text-slate-500 text-[8.5px] font-mono uppercase tracking-widest">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Compartilhe com selecionados</span>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* Premium Advantages Bento-like Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-black">Por que Criar Seu Soundrive?</h3>
          <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            A forma inteligente de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400">compartilhar suas produções</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Focado especificamente nas necessidades do produtor e do compositor de música autoral brasileira.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Easy bluetooth for cars */}
          <div className="p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-left space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-orange-950/50 rounded-2xl flex items-center justify-center border border-orange-500/30 text-orange-400">
                <Car className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-lg font-heading font-bold uppercase tracking-tight text-white">
                Ouvir no Carro e no Celular
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Quem recebe o link pode ouvir com facilidade no celular ou via Bluetooth no carro, com player limpo, modo carro e botão direto para falar com você no WhatsApp.
              </p>
            </div>
          </div>

          {/* Card 2: Technical Sheet */}
          <div className="p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-left space-y-4 shadow-xl hover:border-yellow-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-yellow-950/50 rounded-2xl flex items-center justify-center border border-yellow-500/30 text-yellow-400">
                <Check className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-lg font-heading font-bold uppercase tracking-tight text-white">
                Ficha Técnica Completa
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cada música fica organizada com título, compositor, intérprete guia, estilo, letra, descrição e informações importantes para avaliação profissional.
              </p>
            </div>
          </div>

          {/* Card 3: Private Catalog */}
          <div className="p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-left space-y-4 shadow-xl hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-orange-950/50 rounded-2xl flex items-center justify-center border border-orange-500/30 text-amber-400">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-lg font-heading font-bold uppercase tracking-tight text-white">
                Catálogo Privado por Link
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Suas músicas não ficam abertas ao público. Você gera um link privado e envia apenas para cantores, artistas, produtores ou contratantes selecionados.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Planos / Pricing Grid */}
      <section id="planos" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-orange-400 uppercase font-bold">Impulsione Sua Carreira</h3>
          <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase leading-none">
            Escolha o Plano Ideal para Você
          </h2>
          <p className="text-slate-400 text-sm">
            Disponibilize seu repertório com som cristalino, métricas em tempo real e designs de alta conversão. Sem burocracia ou intermediários.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Soundrive Free Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/80 transition duration-300 relative">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold font-bold">Grátis</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">Soundrive Free</h4>
                </div>
                <h5 className="text-3xl font-heading font-black text-slate-100">Grátis</h5>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">Ideal para começar e testar seu catálogo privado.</p>

              {/* Feature bullet list */}
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 5 músicas</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 20 MB por arquivo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Catálogo privado por link</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Player de áudio básico</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Ficha técnica da música</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Botão WhatsApp integrado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Modo carro básico</span>
                </li>
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

          {/* Soundrive Pro Card (Highlighted!) */}
          <div className="relative bg-gradient-to-b from-[#14100c] to-[#0c0d12] border-2 border-orange-500 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.02] transition duration-300 shadow-2xl shadow-orange-950/30">
            {/* Top recommendation bubble */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-600 to-yellow-500 px-3.5 py-1 text-slate-950 text-[10px] uppercase font-heading font-black tracking-widest rounded-full shadow-lg font-bold flex items-center gap-1 whitespace-nowrap z-20">
              <Star className="w-3.5 h-3.5 fill-slate-950" /> Mais Escolhido
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-orange-955 text-orange-400 rounded text-[9px] font-mono uppercase tracking-widest font-extrabold border border-orange-500/20">Recomendado</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">Soundrive Pro</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-xs font-mono text-slate-400">R$</span>
                    <h5 className="text-3xl font-heading font-black text-white">
                      {billingCycle === 'monthly' ? '19,90' : '199,90'}
                    </h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{billingCycle === 'monthly' ? '/ mês' : '/ ano'}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">Ideal para compositores que querem apresentar repertório com mais profissionalismo.</p>

              {/* Feature bullet list */}
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 15 músicas</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 30 MB por arquivo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Tudo do plano Free</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Links privados para compartilhar</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Analytics básico de acessos e plays</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Música mais ouvida</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Botão “Tenho interesse nessa música”</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Status da música: inédita, demo, disponível, reservada ou vendida</span>
                </li>
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
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-slate-700/80 transition duration-300 relative">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-400 uppercase tracking-widest font-extrabold font-bold">Elite</span>
                  <h4 className="text-xl font-heading font-black text-white uppercase">Soundrive Premium</h4>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-xs font-mono text-slate-400">R$</span>
                    <h5 className="text-3xl font-heading font-black text-white">
                      {billingCycle === 'monthly' ? '39,90' : '399,90'}
                    </h5>
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">{billingCycle === 'monthly' ? '/ mês' : '/ ano'}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">Ideal para produtores, selos, escritórios e compositores com mais repertório.</p>

              {/* Feature bullet list */}
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 50 músicas</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Até 30 MB por arquivo</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Tudo do plano Pro</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Catálogo premium personalizado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Analytics avançado</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Organização por repertório, álbum ou projeto</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Links personalizados</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Suporte prioritário</span>
                </li>
                <li className="flex items-start gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-slate-200">Mais controle para envio de músicas</span>
                </li>
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

      {/* Trust Seal Footer */}
      <footer className="mt-28 py-10 border-t border-slate-900 text-center max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-mono uppercase mb-3">
          <ShieldCheck className="w-4 h-4 text-orange-500" /> Servidor Cloud Run Seguro • Firebase Realtime DB • SSL Ativo
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Soundrive. Desenvolvido para a indústria musical do Brasil.
        </p>
      </footer>

    </div>
  );
}
