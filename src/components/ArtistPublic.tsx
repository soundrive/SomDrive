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
        <Disc className="w-12 h-12 text-orange-500 animate-spin-slow mb-4" />
        <h3 className="text-xl font-heading font-bold text-center animate-pulse">Buscando pen drive musical...</h3>
        <p className="text-xs text-slate-500 mt-2 font-mono">Carregando catálogo e faixas do artista...</p>
      </div>
    );
  }

  if (errorMsg || !artist) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-950/40 border border-red-400/20 text-red-400 rounded-full flex items-center justify-center mb-6">
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
    setTimeout(() => setWhatsappShareAlert(false), 2000);
  };

  const handleCopyLinkDissemination = () => {
    const pageUrl = `${window.location.origin}/artista/${artist.userId}`;
    const beautifulMessage = `🎧 Olá! Escute meu catálogo musical no Soundrive.\nAqui estão minhas composições disponíveis para audição:\n${pageUrl}`;
    navigator.clipboard.writeText(beautifulMessage);
    setCopiedLinkAlert(true);
    setTimeout(() => setCopiedLinkAlert(false), 2000);
  };

  const handleInstagramShare = () => {
    const instagramUrl = `https://instagram.com/${artist.instagram?.replace(/@/g, '') || 'instalink'}`;
    window.open(instagramUrl, '_blank');
    setInstaShareAlert(true);
    setTimeout(() => setInstaShareAlert(false), 2000);
  };

  const handleSpeakWithArtist = () => {
    // Increment WhatsApp tracking
    dbService.incrementAnalyticsView(artist.userId, false, false);
    
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = encodeURIComponent(`Olá ${artist.name}, encontrei suas composições no catálogo Soundrive e gostaria de conversar sobre contratações ou licenciamento de faixas autoriais!`);
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
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden">
      
      {/* Background radial overlays */}
      <div className="absolute right-[-20%] top-[-10%] w-[450px] h-[450px] bg-orange-900/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute left-[-20%] bottom-[-5%] w-[400px] h-[400px] bg-yellow-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header utility bar */}
      <div className="border-b border-slate-900 px-6 py-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <button 
          id="pub-back-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white text-slate-400 transition text-xs font-bold uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>

        <span className="text-[10px] font-mono tracking-widest text-[#d4af37] font-bold uppercase flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-[#d4af37]" /> Catálogo Autoral Verificado
        </span>
      </div>

      {/* Hero Cover Profile */}
      <div id="artist-profile-header-card" className="max-w-4xl mx-auto px-6 pt-10">
        
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-2xl relative">
          
          {/* Avatar frame */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-500 opacity-20 blur-md"></div>
            {artist.avatarUrl && !artist.avatarUrl.includes("unsplash.com") ? (
              <img 
                id="artist-pub-avatar"
                src={artist.avatarUrl} 
                alt={artist.name}
                className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-full border-4 border-slate-950 shadow-inner"
              />
            ) : (
              <div 
                id="artist-pub-avatar-music"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-slate-950 bg-gradient-to-tr from-slate-950 to-slate-900 flex items-center justify-center text-orange-400 shadow-2xl relative overflow-hidden"
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-2.5 rounded-full border border-slate-800/40"></div>
                <div className="absolute inset-5 rounded-full border border-slate-800/20 animate-pulse"></div>
                {/* Center Note icon */}
                <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 flex items-center justify-center text-slate-950 shadow-inner">
                  <MusicIcon className="w-5 h-5 text-slate-950 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="text-center md:text-left space-y-3 flex-1 min-w-0">
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 bg-orange-950 text-orange-400 text-[10px] font-mono tracking-widest uppercase rounded font-bold">
                {artist.genre || 'Compositor'}
              </span>
              {artist.city && (
                <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {artist.city}
                </div>
              )}
            </div>

            <h1 id="artist-pub-name" className="text-3xl md:text-4xl font-heading font-black tracking-tight uppercase leading-none">
              {artist.name}
            </h1>

            {artist.bio ? (
              <p id="artist-pub-bio" className="text-slate-400 text-sm italic max-w-xl leading-relaxed">
                "{artist.bio}"
              </p>
            ) : (
              <p className="text-slate-500 text-xs font-mono">Nenhuma biografia adicionada.</p>
            )}

            {/* Public contacts shortcut row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1.5 shrink-0">
              <button 
                id="pub-talk-whatsapp-btn"
                onClick={handleSpeakWithArtist}
                className="px-4 py-2 bg-gradient-to-r from-emerald-650 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white rounded-xl text-xs font-heading font-black tracking-wider uppercase shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer select-none transition-transform active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> Whatsapp do Artista
              </button>

              <button 
                id="pub-whatsapp-share-btn"
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-xl text-slate-300 hover:text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition select-none active:scale-95"
                title="Compartilhar no WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-400" /> Compartilhar no Whatsapp
              </button>

              <button 
                id="pub-copy-dissemination-btn"
                onClick={handleCopyLinkDissemination}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-heading font-black tracking-wider uppercase shadow-lg shadow-orange-500/10 flex items-center gap-1.5 cursor-pointer select-none transition-transform active:scale-95"
                title="Copiar mensagem de divulgação"
              >
                <Copy className="w-4 h-4" /> {copiedLinkAlert ? "Copiado! ✓" : "Copiar Divulgação"}
              </button>

              {artist.instagram && (
                <button 
                  id="pub-insta-link-btn"
                  onClick={handleInstagramShare}
                  className="p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                  title="Acessar Instagram"
                >
                  <Instagram className="w-4 h-4 text-orange-400" /> <span className="hidden sm:inline">@{artist.instagram}</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* TRACKS LIST SECTION */}
      <section className="max-w-4xl mx-auto px-6 pt-10 space-y-6">

        {/* Private Catalog Invitation Guard Notice */}
        <div className="p-4 bg-orange-950/20 border border-orange-500/10 rounded-2xl flex items-center gap-3 text-orange-400 text-xs sm:text-sm font-heading font-black uppercase tracking-wide">
          <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
          <span>Aviso: Catálogo privado enviado por convite.</span>
        </div>
        
        {/* Headline list control */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div>
            <h3 className="font-heading font-black text-xl tracking-tight uppercase text-slate-200">
              Faixas Autorais
            </h3>
            <p className="text-slate-500 text-xs">Selecione para ouvir. Ideal para testar em conexões Bluetooth.</p>
          </div>

          {tracks.length > 0 && (
            <button 
              id="car-mode-toggle-anchor"
              onClick={() => {
                // If nothing is playing, select the first track
                if (!activeTrack) {
                  onSelectTrack(tracks[0], tracks);
                }
                setCarMode(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-905 border border-orange-500/30 text-orange-300 hover:text-slate-950 hover:bg-orange-500 rounded-xl text-xs font-heading font-black tracking-wider uppercase transition cursor-pointer select-none group font-bold hover:border-transparent"
            >
              <Car className="w-4 h-4 text-orange-450 group-hover:animate-bounce" /> Ouvir no Carro
            </button>
          )}
        </div>

        {whatsappShareAlert && (
          <div className="p-3 bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-mono rounded-lg text-center font-bold">
            Redirecionando para o compartilhamento do WhatsApp...
          </div>
        )}

        {/* Mock Advertisement banner shown only to Free users */}
        {currentPlan === 'free' && (
          <div id="free-plan-ads-banner" className="p-4 bg-slate-900 border border-rose-500/10 hover:border-rose-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all group">
            <div className="flex items-center gap-3">
              <div className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/30 text-rose-400 text-[9px] font-mono rounded font-black uppercase tracking-widest shrink-0 animate-pulse">
                Anúncio por Ads
              </div>
              <div>
                <h5 className="text-white text-xs font-bold uppercase tracking-tight">Guitarras Tagima & Caixas Ativas na StringsMusic</h5>
                <p className="text-slate-550 text-[10px] uppercase font-mono">Frete Grátis e até 10x sem juros! Use cupom SOUND30.</p>
              </div>
            </div>
            <a 
              href="https://google.com" 
              target="_blank" 
              onClick={(e) => e.preventDefault()}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 transition text-[9px] text-white font-mono uppercase font-black rounded-lg text-center cursor-pointer select-none"
            >
              Visitar Loja
            </a>
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-sm">
            Nenhuma música cadastrada por este compositor no momento.
          </div>
        ) : (
          <div id="pub-tracks-list" className="space-y-3.5">
            {tracks.map((track, idx) => {
              const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
              const isActiveAndPlaying = isCurrentlyPlaying && isPlaying;

              return (
                <div 
                  key={track.trackId}
                  onClick={() => onSelectTrack(track, tracks)}
                  className={`p-4 bg-slate-900 hover:bg-slate-850/80 border rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    isCurrentlyPlaying ? 'ring-2 ring-orange-500 border-transparent bg-slate-850' : 'border-slate-850/60'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    
                    {/* Index or active playing disk */}
                    <div className="flex-shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="p-2.5 bg-orange-950 rounded-lg text-orange-400">
                          {isPlaying ? (
                            <div className="flex items-end gap-0.5 h-4 w-4">
                              <span className="w-0.75 bg-orange-400 animate-bar-1 h-3 rounded-full"></span>
                              <span className="w-0.75 bg-orange-400 animate-bar-2 h-4 rounded-full"></span>
                              <span className="w-0.75 bg-orange-400 animate-bar-3 h-2 rounded-full"></span>
                            </div>
                          ) : (
                            <Play className="w-4 h-4 fill-orange-400 text-orange-400" />
                          )}
                        </div>
                      ) : (
                        <div className="w-9 h-9 flex items-center justify-center font-mono font-bold text-xs text-slate-500 bg-slate-950 border border-slate-850 rounded-lg">
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Small premium Note icon representation */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${isCurrentlyPlaying ? 'from-orange-600 to-yellow-500 text-slate-950 shadow-lg shadow-orange-500/20' : 'from-slate-950 to-slate-900 border border-slate-850 text-orange-400'} flex items-center justify-center flex-shrink-0 relative transition-all hidden sm:flex`}>
                      <MusicIcon className={`w-5 h-5 ${isActiveAndPlaying ? 'animate-bounce' : ''}`} />
                    </div>

                    {/* Metadata titles */}
                    <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-black text-sm sm:text-base uppercase text-slate-100 tracking-tight leading-snug break-words">
                          {track.title}
                        </h4>
                        <p className="text-slate-400 text-xs font-semibold mt-0.5">
                          Cantor: {track.singer || artist.name} {track.composer && <span className="text-slate-600 font-normal">| Autor: {track.composer}</span>}
                        </p>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 bg-slate-800 text-[9px] font-mono text-slate-300 rounded uppercase font-bold tracking-wider">
                          {track.genre || artist.genre}
                        </span>
                        {track.lyrics && (
                          <span className="px-1.5 py-0.5 bg-orange-950/70 border border-orange-500/20 text-orange-300 text-[9px] font-mono rounded font-black uppercase tracking-widest">
                            LETRA
                          </span>
                        )}
                        {(currentPlan === 'pro' || currentPlan === 'premium') && (
                          <span className="px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/15 text-emerald-400 text-[9px] font-mono rounded font-black uppercase tracking-wider">
                            LIBERADA
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Actions Right Hand */}
                  <div className="flex items-center gap-2 flex-shrink-0 select-none">
                    
                    {/* Premium Only: Licensing/Sale Button */}
                    {currentPlan === 'premium' && (
                      <button 
                        id={`premium-sell-btn-${track.trackId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
                          const text = encodeURIComponent(`Olá ${artist.name}, tenho grande interesse em comprar os direitos exclusivos da música autoral "${track.title}"! Gostaria de negociar o contrato.`);
                          window.open(`https://wa.me/${whatsappNum}?text=${text}`, '_blank');
                        }}
                        className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 text-xs font-bold uppercase rounded-lg transition"
                        title="Adquirir Licença Exclusiva"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-slate-950" /> Comprar Licença
                      </button>
                    )}

                    {/* Pro & Premium Only: Quero Gravar Button */}
                    {(currentPlan === 'pro' || currentPlan === 'premium') && (
                      <button 
                        id={`contact-track-btn-${track.trackId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactForTrack(track);
                        }}
                        className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/25 text-emerald-300 text-xs font-heading font-black rounded-lg transition-all hover:scale-103 cursor-pointer select-none"
                        title="Quero Gravar essa música"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Quero Gravar
                      </button>
                    )}

                    <button 
                      id={`play-row-${track.trackId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentlyPlaying) {
                          onPlayPause();
                        } else {
                          onSelectTrack(track, tracks);
                        }
                      }}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-850 cursor-pointer"
                    >
                      {isActiveAndPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-white text-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* FOOTER PUSH BRANDING */}
      <div className="mt-20 max-w-4xl mx-auto px-6 text-center text-slate-600 text-xs font-mono uppercase">
        <p>Montado usando a plataforma Soundrive © {new Date().getFullYear()}</p>
        <p className="text-[10px] text-slate-700 mt-1">Gere sua página exclusiva, teste no painel Bluetooth e feche contratos.</p>
      </div>

    </div>
  );
}
