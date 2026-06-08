import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Smartphone, 
  Car, 
  MessageSquare, 
  Share2, 
  Info, 
  Disc, 
  MapPin, 
  Instagram, 
  Mail, 
  Check, 
  ChevronRight, 
  DollarSign, 
  ArrowLeft,
  Coins,
  ShieldCheck,
  Star,
  Music as MusicIcon,
  Copy
} from 'lucide-react';
import { Artist, Music as Track, Analytics } from '../types';
import { dbService } from '../lib/db';

interface ArtistPublicProps {
  artistId: string;
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  onSelectTrack: (track: Track, list: Track[]) => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  setCarMode: (active: boolean) => void;
  autoCarMode: boolean;
}

export default function ArtistPublic({
  artistId,
  onNavigate,
  onSelectTrack,
  activeTrack,
  isPlaying,
  onPlayPause,
  setCarMode,
  autoCarMode
}: ArtistPublicProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [whatsappShareAlert, setWhatsappShareAlert] = useState(false);
  const [copiedLinkAlert, setCopiedLinkAlert] = useState(false);
  const [instaShareAlert, setInstaShareAlert] = useState(false);
  const [expandedLyricsTrackId, setExpandedLyricsTrackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'composicoes' | 'sobre'>('composicoes');

  // Dynamic Browser Tab Meta Title
  useEffect(() => {
    if (artist) {
      document.title = `Catálogo musical de ${artist.name} | Soundrive`;
    } else {
      document.title = `Soundrive - Catálogo Musical`;
    }
    return () => {
      document.title = `Soundrive - Catálogo Musical`;
    };
  }, [artist]);

  // Load artist and tracks
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      console.log("Iniciando carregamento do artista público:", artistId);

      try {
        // 1. Tentar primeiro do cache local rápido
        const cachedArtist = dbService.getArtist(artistId) || dbService.getArtist("gabriel-silva");
        if (cachedArtist) {
          setArtist(cachedArtist);
          const cachedTracks = dbService.getArtistMusics(cachedArtist.userId).filter(t => t.status !== 'inactive');
          setTracks(cachedTracks);
        }

        // 2. Sempre fazer a busca e sincronização com o Firestore para carregar dados reais e frescos
        try {
          console.log("Sincronizando dados públicos do Firestore do artista:", artistId);
          await dbService.syncArtistData(artistId);
          
          let syncedArtist = dbService.getArtist(artistId);
          if (!syncedArtist) {
            // Tentar buscar novamente Gabriel Silva se o ID solicitado falhou
            console.log("Artista não encontrado, tentando Gabriel Silva de fallback no Firestore...");
            await dbService.syncArtistData("gabriel-silva");
            syncedArtist = dbService.getArtist("gabriel-silva");
          }

          if (syncedArtist) {
            setArtist(syncedArtist);
            const syncedTracks = dbService.getArtistMusics(syncedArtist.userId).filter(t => t.status !== 'inactive');
            setTracks(syncedTracks);
          } else if (!cachedArtist) {
            setErrorMsg("Catálogo não encontrado ou ainda sem músicas disponíveis.");
          }
        } catch (syncErr) {
          console.error("Erro ao sincronizar do Firestore: ", syncErr);
          // Se não havia nada em cache e o sync do Firebase falhou, mostramos erro
          if (!cachedArtist) {
            setErrorMsg("Catálogo não encontrado ou ainda sem músicas disponíveis.");
          }
        }

        // 3. Incrementar visualizações em segundo plano se o artista foi obtido
        const activeArtist = dbService.getArtist(artistId) || dbService.getArtist("gabriel-silva");
        if (activeArtist) {
          dbService.incrementAnalyticsView(activeArtist.userId, true, false);
        }
      } catch (err) {
        console.error("Erro geral no carregamento público:", err);
        setErrorMsg("Erro ao carregar o catálogo. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [artistId]);

  // Handle auto launch car mode if passed as param
  useEffect(() => {
    if (autoCarMode && tracks.length > 0) {
      onSelectTrack(tracks[0], tracks);
      setCarMode(true);
    }
  }, [autoCarMode, tracks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Disc className="w-12 h-12 text-[#d4af37] animate-spin-slow mb-4" />
        <h3 className="text-xl font-heading font-bold text-center animate-pulse">Buscando pen drive musical...</h3>
        <p className="text-xs text-slate-500 mt-2 font-mono">Carregando catálogo e faixas do artista...</p>
      </div>
    );
  }

  if (errorMsg || !artist) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-955/40 border border-red-400/20 text-red-400 rounded-full flex items-center justify-center mb-6">
          <MusicIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-heading font-bold mb-3">{errorMsg || "Catálogo não encontrado ou ainda sem músicas disponíveis."}</h3>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8">
          O link de divulgação pode estar incorreto, o link expirou ou o artista ainda não publicou nenhuma música no seu catálogo.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold uppercase hover:bg-slate-850 text-white transition tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>
      </div>
    );
  }

  const currentPlan = artist.plan || 'free';

  const handleShareWhatsApp = () => {
    // Increment WhatsApp clicks inside Analytics table
    dbService.incrementAnalyticsView(artist.userId, false, false);
    
    const pageUrl = `${window.location.origin}/artista/${artist.userId}`;
    const beautifulMessage = `🎧 Olá! Escute meu catálogo musical no Soundrive.\nAqui estão minhas composições disponíveis para audição:\n${pageUrl}`;
    const text = encodeURIComponent(beautifulMessage);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    
    setWhatsappShareAlert(true);
    setTimeout(() => setWhatsappShareAlert(false), 2050);
  };

  const handleCopyLinkDissemination = () => {
    const pageUrl = `${window.location.origin}/artista/${artist.userId}`;
    const beautifulMessage = `🎧 Olá! Escute meu catálogo musical no Soundrive.\nAqui estão minhas composições disponíveis para audição:\n${pageUrl}`;
    navigator.clipboard.writeText(beautifulMessage);
    setCopiedLinkAlert(true);
    setTimeout(() => setCopiedLinkAlert(false), 2050);
  };

  const handleInstagramShare = () => {
    const instagramUrl = `https://instagram.com/${artist.instagram?.replace(/@/g, '') || 'instalink'}`;
    window.open(instagramUrl, '_blank');
    setInstaShareAlert(true);
    setTimeout(() => setInstaShareAlert(false), 2050);
  };

  const handleSpeakWithArtist = () => {
    // Increment WhatsApp tracking
    dbService.incrementAnalyticsView(artist.userId, false, false);
    
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = encodeURIComponent(`Olá ${artist.name}, encontrei suas composições no catálogo Soundrive e gostaria de conversar sobre contratações ou licenciamento de faixas autorais!`);
    window.open(`https://wa.me/${whatsappNum}?text=${greetingText}`, '_blank');
  };

  const handleContactForTrack = (track: Track) => {
    // Increment WhatsApp tracking inside Analytics table
    dbService.incrementAnalyticsView(artist.userId, false, true);
    
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = encodeURIComponent(`Olá ${artist.name}, encontrei sua composição "${track.title}" no catálogo Soundrive e tenho interesse em gravá-la / contratá-la!`);
    window.open(`https://wa.me/${whatsappNum}?text=${greetingText}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-105 font-sans pb-32 relative overflow-hidden flex w-full">
      
      {/* LEFT SIDEBAR (Desktop only) */}
      <aside className="w-64 bg-[#050609] border-r border-zinc-900 h-screen sticky top-0 px-6 py-8 flex flex-col justify-between shrink-0 hidden md:flex z-30 select-none">
        <div className="space-y-10">
          {/* Logo Brand with waveform animated visual */}
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-[3px] h-5 mb-1 select-none">
              <span className="w-1 bg-[#d4af37] h-3.5 rounded-full animate-bar-1"></span>
              <span className="w-1 bg-[#d4af37] h-5 rounded-full animate-bar-2"></span>
              <span className="w-1 bg-[#d4af37] h-6 rounded-full animate-bar-3"></span>
              <span className="w-1 bg-[#d4af37] h-4.5 rounded-full animate-bar-4"></span>
              <span className="w-1 bg-[#d4af37] h-2.5 rounded-full animate-bar-1"></span>
            </div>
            <span className="font-heading font-black tracking-tight text-xl text-white select-none">Soundrive</span>
          </div>

          {/* Nav Items stack with exact vertical visual indicators */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-left"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-500" />
              Início
            </button>

            <button 
              className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl text-[#d4af37] bg-zinc-900/50 transition-all text-xs font-mono font-bold uppercase tracking-wider relative cursor-default text-left"
            >
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#d4af37] rounded-r"></span>
              <Disc className="w-4 h-4 text-amber-500 animate-spin-slow" />
              Catálogo
            </button>

            <button 
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-4 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer text-left"
            >
              <Star className="w-4 h-4 text-zinc-500" />
              Compositores
            </button>
          </nav>
        </div>

        {/* Brand trademark footer line */}
        <div className="space-y-1 text-left">
          <p className="text-[10px] text-zinc-650 font-mono">Soundrive © {new Date().getFullYear()}</p>
          <p className="text-[9px] text-zinc-500 leading-normal font-sans">Conteúdo reservado e protegido por direitos autorais.</p>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT PANEL */}
      <main className="flex-1 min-w-0 min-h-screen bg-[#07090e] relative overflow-y-auto px-4 sm:px-8 py-5 select-none z-15 flex flex-col">
        
        {/* Decorative background radial glows */}
        <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/5 via-orange-600/3 to-transparent rounded-full filter blur-[140px] pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff01_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>

        {/* STICKY TOP NAVIGATION GLASS BAR */}
        <div className="w-full border-b border-zinc-900/40 pb-4 mb-6 flex items-center justify-between relative z-30 pt-1">
          <button 
            id="pub-back-btn"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-805 rounded-xl hover:text-white text-zinc-400 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer md:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" /> Início
          </button>

          <span className="text-[9px] min-[360px]:text-[10px] font-mono tracking-widest text-[#d4af37] font-bold uppercase flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-550/10 border border-amber-550/20 rounded-full select-none ml-auto md:ml-0">
            <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]/10 animate-pulse" />
            Catálogo Verificado
          </span>

          {/* Desktop Right Bell and Avatar Icons */}
          <div className="hidden md:flex items-center gap-4 ml-6 select-none">
            <button className="p-2 text-zinc-450 hover:text-zinc-200 transition relative">
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono tracking-widest text-[#d4af37] font-black">
              US
            </div>
          </div>
        </div>

        {/* HERO HEADER COVER BLOCK (Grid structured exactly as shown in reference) */}
        <div id="artist-profile-header-card" className="w-full mb-8 relative z-10 select-none">
          <div className="bg-gradient-to-tr from-zinc-950/60 via-[#07090e]/80 to-zinc-950/20 border border-zinc-900 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-2xl relative overflow-hidden">
            
            {/* Ambient gold glow backplate */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-550/20 via-[#d4af37]/35 to-transparent"></div>
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Col 1: Disk record styled Sphere / Avatar container */}
            <div className="col-span-1 md:col-span-4 flex justify-center items-center">
              <div className="relative w-44 h-44 sm:w-[195px] sm:h-[195px] rounded-full border-2 border-zinc-800 bg-[#050609] shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {/* Concentric record circles for visual depth */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border border-zinc-900/40"></div>
                <div className="absolute inset-6 sm:inset-8 rounded-full border border-zinc-900/20 font-medium"></div>
                <div className="absolute inset-11 sm:inset-14 rounded-full border border-zinc-900/10"></div>
                
                {/* Embedded Glowing sound rings */}
                <div className="absolute inset-18 rounded-full border border-amber-500/10 animate-pulse"></div>

                {/* Main Avatar/Disc centered circle */}
                {artist.avatarUrl && !artist.avatarUrl.includes("unsplash.com") ? (
                  <img 
                    id="artist-pub-avatar"
                    src={artist.avatarUrl} 
                    alt={artist.name}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-full border border-zinc-850 p-1 bg-[#090b10] shadow-2xl z-10 hover:scale-103 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-[#d4af37] shadow-xl z-10 select-none">
                    <div className="absolute inset-1 rounded-full border border-zinc-855"></div>
                    
                    {/* Centered Golden sound waveform animation */}
                    <div className="flex items-end gap-[3.5px] h-7 justify-center relative translate-y-0.5 select-none">
                      <span className="w-0.75 bg-[#d4af37] h-3.5 rounded-full animate-bar-1"></span>
                      <span className="w-0.75 bg-[#d4af37] h-5- rounded-full animate-bar-2"></span>
                      <span className="w-0.75 bg-gradient-to-t from-[#d4af37] to-amber-400 h-6.5 rounded-full animate-bar-3"></span>
                      <span className="w-0.75 bg-[#d4af37] h-4.5 rounded-full animate-bar-2"></span>
                      <span className="w-0.75 bg-[#d4af37] h-2 rounded-full animate-bar-1"></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Col 2: Core artist metadata & CTA deck */}
            <div className="col-span-1 md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left gap-3.5 w-full">
              
              {/* Verified tagline */}
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-amber-400 font-bold uppercase select-none">
                <svg className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.9c0 .736.31 1.45.856 1.94l.024.022c.983.89 1.83 1.636 2.544 2.373a11.164 11.164 0 011.832 2.457c.547.962.91 1.908 1.155 2.801a.75.75 0 001.458 0c.245-.893.608-1.839 1.155-2.8a11.164 11.164 0 011.832-2.457c.715-.737 1.56-1.483 2.544-2.373a.5.5 0 00.024-.022c.547-.49.856-1.204.856-1.94V3a1 1 0 00-1-1H3.166a1 1 0 00-1 1v1.9z" clipRule="evenodd" />
                </svg>
                <span>Catálogo Verificado</span>
              </div>

              {/* Title with verified gold badge */}
              <h1 id="artist-pub-name" className="text-2.5xl sm:text-4xl lg:text-4.5xl font-heading font-black tracking-tight uppercase leading-none text-white flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
                {artist.name}
                <span className="text-amber-500 inline-flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 sm:w-6.5 sm:h-6.5 text-[#d4af37] fill-[#d4af37]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              </h1>

              {/* Badges line info location */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start select-none">
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono uppercase tracking-wider rounded font-medium">
                  {artist.genre || 'Compositor'}
                </span>
                {artist.city && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono uppercase tracking-wider rounded font-medium">
                    <MapPin className="w-3 h-3 text-zinc-550 shrink-0" /> {artist.city} - {artist.state || 'GO'}
                  </div>
                )}
              </div>

              {/* Premium Golden gradient WhatsApp Talk capsule */}
              <button 
                id="pub-talk-whatsapp-btn"
                onClick={handleSpeakWithArtist}
                className="w-full sm:w-auto px-5 py-3.5 mt-1 bg-gradient-to-r from-amber-550 to-amber-450 hover:brightness-105 active:scale-97 text-zinc-950 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none transition-all duration-250 shadow-md shadow-amber-500/15 font-heading font-extrabold"
              >
                <MessageSquare className="w-4 h-4 text-zinc-950 shrink-0 stroke-[2.2]" /> Falar com o compositor
              </button>

              {/* Actions row deck */}
              <div className="flex items-center gap-1.5 flex-wrap w-full mt-1 justify-center md:justify-start select-none">
                {/* Compartilhar */}
                <button 
                  id="pub-whatsapp-share-btn"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 rounded-lg text-[10px] font-mono tracking-wider uppercase font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 select-none"
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Compartilhar</span>
                </button>

                {/* Divulgação */}
                <button 
                  id="pub-copy-dissemination-btn"
                  onClick={handleCopyLinkDissemination}
                  className="px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 rounded-lg text-[10px] font-mono tracking-wider uppercase font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 select-none"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  {copiedLinkAlert ? <span className="text-amber-455 font-bold">Copiado!</span> : <span>Divulgação</span>}
                </button>

                {/* Link */}
                <button 
                  id="pub-insta-link-btn"
                  onClick={handleInstagramShare}
                  className="px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-305 rounded-lg text-[10px] font-mono tracking-wider uppercase font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 select-none"
                >
                  <Instagram className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Link</span>
                </button>
              </div>

            </div>

            {/* Col 3: Stat high gloss card pane */}
            <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
              <div className="bg-[#050609]/75 border border-zinc-900 text-left p-4.5 rounded-2xl flex flex-col justify-between gap-5 shadow-xl min-h-[148px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-center text-[#d4af37]">
                    <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                  </div>
                  <div className="space-y-0.5 leading-none">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block">Músicas disponíveis</span>
                    <span className="text-2.5xl font-heading font-black text-[#d4af37] tracking-tight block mt-0.5">{tracks.length}</span>
                  </div>
                </div>
                
                <div className="border-t border-zinc-900/60 pt-3 flex items-start gap-2 select-none">
                  <svg className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="space-y-0.5 leading-tight animate-pulse">
                    <p className="text-[9px] uppercase font-mono tracking-widest text-[#d4af37] font-bold">Catálogo verificado</p>
                    <p className="text-[9px] text-zinc-500 font-sans leading-normal">Músicas 100% originais e prontas para gravação.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* NAVIGATION TABS (Composições vs Sobre o compositor) */}
        <div className="w-full mb-6 relative z-10 select-none">
          <div className="flex items-center gap-6 border-b border-zinc-900/60 pb-[1px] text-left">
            <button 
              onClick={() => setActiveTab('composicoes')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative ${
                activeTab === 'composicoes' 
                  ? 'border-[#d4af37] text-[#d4af37] font-extrabold' 
                  : 'border-transparent text-zinc-[450] hover:text-zinc-200 cursor-pointer'
              }`}
            >
              Composições
            </button>
            <button 
              onClick={() => setActiveTab('sobre')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative ${
                activeTab === 'sobre' 
                  ? 'border-[#d4af37] text-[#d4af37] font-extrabold' 
                  : 'border-transparent text-zinc-[450] hover:text-zinc-200 cursor-pointer'
              }`}
            >
              Sobre o compositor
            </button>
          </div>
        </div>

        {/* DETAILS SECTION SHEETS based on active tab state */}
        <section className="w-full space-y-6 relative z-10 flex-1 flex flex-col justify-start">

          {activeTab === 'sobre' ? (
            /* Tab Content: Sobre o compositor (Bio & Meta info) */
            <div className="bg-[#050609]/40 border border-zinc-900 rounded-2xl p-6 text-left space-y-6 animate-fade-in">
              <div className="space-y-2.5">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Histórico do compositor</h4>
                <div className="text-zinc-350 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-zinc-955 p-4 rounded-xl border border-zinc-900/50 font-medium">
                  {artist.bio ? artist.bio : `O compositor ${artist.name} possui um catálogo verificado no Soundrive com excelente acervo autoral, pronto para audição e captação comercial.`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Gênero Autoral Principal</span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200 uppercase tracking-wide">{artist.genre || 'Sertanejo Universitário'}</span>
                </div>
                <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block">Cidade / Estado</span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200 uppercase tracking-wide">{artist.city || 'Goiânia'} - {artist.state || 'GO'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Tab Content: Composições (The list table block exact same high fidelity layout of Image 1) */
            <div className="space-y-5 animate-fade-in flex flex-col w-full text-left">
              
              {/* Confidenciality alert header bar */}
              <div className="py-3 px-4 bg-zinc-900/10 border border-zinc-900 rounded-xl flex items-center justify-center gap-2.5 text-zinc-400 text-xs text-center select-none">
                <svg className="w-4.5 h-4.5 text-[#d4af37] shrink-0 fill-[#d4af37]/5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.224 4.074 9.5 9.166 10.701a1 1 0 00.334-1.932C7.07 14.773 4 11.238 4 7c0-.528.03-1.049.09-1.56A13.914 13.914 0 0011 3.104a13.914 13.914 0 006.91 2.336c.06.51.09 1.032.09 1.56 0 4.238-3.07 7.773-7.5 8.769a1 1 0 10.334 1.932C15.926 16.5 20 12.224 20 7c0-.681-.056-1.351-.166-2A11.954 11.954 0 0110 1.944z" clipRule="evenodd"/>
                </svg>
                <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-zinc-400">Repositório musical privado — acesso exclusivo de contratantes</span>
              </div>
              
              {/* Table List Layout Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900/60 pb-3 select-none">
                <div className="text-left">
                  <h3 className="font-heading font-black text-xl tracking-wide uppercase text-zinc-150">
                    Composições disponíveis
                  </h3>
                  <p className="text-zinc-500 text-[10px] sm:text-xs">Para ouvir, clique no botão play ou selecione a música diretamente.</p>
                </div>

                {tracks.length > 0 && (
                  <button 
                    id="car-mode-toggle-anchor"
                    onClick={() => {
                      if (!activeTrack) {
                        onSelectTrack(tracks[0], tracks);
                      }
                      setCarMode(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-zinc-900/90 hover:bg-zinc-805 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer select-none"
                  >
                    <Car className="w-3.5 h-3.5 text-amber-550 shrink-0 animate-pulse" /> Bluetooth de carro
                  </button>
                )}
              </div>

              {whatsappShareAlert && (
                <div className="p-2.5 bg-emerald-950/20 border border-emerald-950/30 text-emerald-400 text-[10px] font-mono rounded-xl text-center font-bold animate-pulse">
                  Redirecionando de forma segura para o WhatsApp...
                </div>
              )}

              {tracks.length === 0 ? (
                <div className="text-center py-16 bg-[#050609]/40 border border-dashed border-zinc-900 rounded-3xl text-zinc-500 text-xs font-mono select-none">
                  Nenhuma guia ou composição foi disponibilizada pelo artista ainda.
                </div>
              ) : (
                /* List table structure of tracks precisely matching Image 1 styling */
                <div id="pub-tracks-list" className="border border-zinc-900 rounded-2xl bg-[#050609]/20 overflow-hidden text-left flex flex-col">
                  
                  {/* Table Column headers (Desktop only) */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-[#050609]/80 border-b border-zinc-905 text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-black select-none font-bold">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">MÚSICA</div>
                    <div className="col-span-3">GÊNERO</div>
                    <div className="col-span-2 text-right">DURAÇÃO</div>
                  </div>

                  {/* Rows iteration */}
                  {tracks.map((track, idx) => {
                    const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
                    const isActiveAndPlaying = isCurrentlyPlaying && isPlaying;
                    const plays = track.playsCount || track.plays || 0;
                    const lyricsOpen = expandedLyricsTrackId === track.trackId;
                    
                    // High-quality mock duration fallback to replicate screenshots
                    const mockDurations = ['03:10', '03:18', '03:05', '03:22', '02:54', '03:41', '03:15', '02:49'];
                    const durationText = mockDurations[idx % mockDurations.length];

                    return (
                      <div key={track.trackId} className="flex flex-col w-full">
                        <div 
                          onClick={() => onSelectTrack(track, tracks)}
                          className={`grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 sm:px-6 sm:py-4 items-center justify-between border-b last:border-b-0 border-zinc-900/40 cursor-pointer hover:bg-zinc-900/30 transition-all select-none ${
                            isCurrentlyPlaying ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          {/* Col L1: Numerical index indicator OR custom Play Sphere */}
                          <div className="col-span-2 sm:col-span-1 flex items-center gap-3.5 select-none">
                            <span className="text-zinc-500 font-mono text-xs sm:text-sm hidden sm:inline select-none">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCurrentlyPlaying) {
                                  onPlayPause();
                                } else {
                                  onSelectTrack(track, tracks);
                                }
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isCurrentlyPlaying 
                                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md' 
                                  : 'bg-zinc-900 border border-zinc-800 text-amber-500 hover:bg-zinc-800 hover:scale-105'
                              }`}
                            >
                              {isActiveAndPlaying ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Col L2: Name, Guia info metadata and plays/lyrics links */}
                          <div className="col-span-7 sm:col-span-6 pr-2">
                            <div className="space-y-0.5 leading-tight">
                              <h4 className={`text-xs sm:text-sm font-bold tracking-tight uppercase truncate ${
                                isCurrentlyPlaying ? 'text-[#d4af37]' : 'text-zinc-100 font-bold'
                              }`}>
                                {track.title}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-zinc-550 truncate lowercase font-sans leading-none">
                                guia: <strong className="text-zinc-400 font-semibold uppercase font-mono text-[9px]">{track.singer || artist.name}</strong> 
                                {track.composer && <> • autor: <strong className="text-zinc-400 font-semibold uppercase font-mono text-[9px]">{track.composer}</strong></>}
                              </p>
                              
                              {/* Lyrics drawer trigger badge */}
                              <div className="flex items-center gap-2 pt-0.5 select-none">
                                {track.lyrics && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLyricsTrackId(lyricsOpen ? null : track.trackId);
                                    }}
                                    className={`text-[9.5px] font-mono tracking-widest uppercase font-black px-1.5 py-0.25 rounded cursor-pointer select-none transition-all ${
                                      lyricsOpen ? 'bg-amber-550 text-zinc-950 font-extrabold shadow' : 'bg-amber-550/10 border border-amber-550/20 text-amber-400'
                                    }`}
                                  >
                                    Ver Letra
                                  </button>
                                )}
                                <span className="text-[9.5px] font-mono text-zinc-650 sm:hidden">
                                  {plays} plays
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Col L3: Genre tag (Desktop only) */}
                          <div className="col-span-3 hidden sm:block select-none">
                            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-850 text-zinc-[450] text-[10px] font-mono rounded font-semibold uppercase tracking-wider select-none">
                              {track.genre || artist.genre}
                            </span>
                          </div>

                          {/* Col L4: Duration & dynamic talk popup */}
                          <div className="col-span-3 sm:col-span-2 text-right flex items-center justify-end gap-4 font-mono select-none">
                            <span className="text-zinc-[#450] text-xs hidden sm:inline font-bold">
                              {durationText}
                            </span>
                            
                            {/* Message button for direct communication */}
                            <button 
                              id={`contact-track-btn-${track.trackId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContactForTrack(track);
                              }}
                              className="p-1.5 text-zinc-550 hover:bg-zinc-900 border border-transparent hover:border-zinc-850 rounded-lg group transition cursor-pointer select-none"
                              title="Falar sobre esta composição"
                            >
                              <MessageSquare className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 stroke-[2.2]" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Expandable lyrics space panel */}
                        {track.lyrics && lyricsOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="p-4.5 bg-zinc-950 border-b border-t border-zinc-900 max-h-56 overflow-y-auto text-xs text-zinc-3 w-full leading-relaxed font-sans whitespace-pre-line text-left animate-fade-in relative shadow-inner select-text"
                          >
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-2.5 select-none text-left">
                              <span className="text-[9px] font-mono tracking-widest text-[#d4af37] font-black uppercase">Letra Completa</span>
                              <button 
                                onClick={() => setExpandedLyricsTrackId(null)}
                                className="text-[9px] text-zinc-500 hover:text-white transition uppercase font-mono tracking-widest font-black cursor-pointer"
                              >
                                [ Fechar ]
                              </button>
                            </div>
                            <p className="whitespace-pre-line font-medium leading-relaxed font-sans text-zinc-200 text-xs">{track.lyrics}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </section>

        {/* Dynamic Partner Ad Banner for Free users at the very end */}
        {currentPlan === 'free' && (
          <div id="free-plan-ads-banner" className="max-w-md mx-auto px-4 mt-12 bg-zinc-900/10 border border-zinc-900/60 rounded-xl p-3.5 text-center opacity-70 hover:opacity-100 transition-opacity select-none relative z-10 w-full mb-4">
            <div className="flex flex-col items-center gap-1.5 text-zinc-400 text-xs text-center">
              <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-550 text-[8px] font-mono rounded font-semibold uppercase tracking-wider select-none border border-zinc-850/60">
                Parceiro Soundrive
              </span>
              <p className="font-sans text-[10px] text-zinc-55 leading-relaxed">
                Equipamentos de áudio profissionais e Guitarras Tagima na Strings — Cupom <strong>SOUND30</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Brand visual layout page footer */}
        <footer className="mt-16 border-t border-zinc-900/40 pt-4 text-center text-zinc-500 text-[10px] font-mono uppercase tracking-wider relative z-10 w-full select-none">
          <p>Soundrive © {new Date().getFullYear()} — Plataforma de Catálogos Verificados para Compositores</p>
          <p className="text-[9px] text-zinc-650 mt-1 lowercase font-sans font-normal">compartilhe no whatsapp, envie propostas comerciais e garanta segurança jurídica.</p>
        </footer>

      </main>

    </div>
  );
}
