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
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative">
      
      {/* Background subtle mesh overlay */}
      <div className="absolute right-[-10%] top-[-10%] w-[300px] h-[300px] bg-orange-950/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="border-b border-slate-900 px-4 py-3.5 bg-slate-950/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <button 
          id="pub-back-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg hover:bg-slate-900 hover:text-white text-slate-400 transition text-xs font-bold uppercase cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <span className="text-[10px] font-mono tracking-widest text-orange-400 font-bold uppercase flex items-center gap-1">
          <Star className="w-3 h-3 fill-orange-400 text-orange-400 animate-pulse" /> Catálogo Verificado
        </span>
      </div>

      {/* Hero Cover Profile section */}
      <div id="artist-profile-header-card" className="max-w-3xl mx-auto px-4 pt-6">
        
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center gap-6 relative">
          
          {/* Avatar circle */}
          <div className="relative flex-shrink-0">
            {artist.avatarUrl && !artist.avatarUrl.includes("unsplash.com") ? (
              <img 
                id="artist-pub-avatar"
                src={artist.avatarUrl} 
                alt={artist.name}
                className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-full border-2 border-slate-800 shadow-md"
              />
            ) : (
              <div 
                id="artist-pub-avatar-music"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-orange-400 shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-2 rounded-full border border-slate-900/60"></div>
                <div className="w-8 h-8 rounded-full bg-orange-650 flex items-center justify-center text-slate-950 shadow-inner">
                  <MusicIcon className="w-4 h-4 text-slate-950" />
                </div>
              </div>
            )}
          </div>

          {/* Core Info - Cleanly centered */}
          <div className="flex flex-col items-center space-y-2 w-full">
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-2.5 py-0.5 bg-orange-950/50 border border-orange-900/10 text-orange-400 text-[10px] font-mono tracking-widest uppercase rounded font-bold">
                {artist.genre || 'Compositor'}
              </span>
              {artist.city && (
                <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {artist.city}
                </div>
              )}
            </div>

            <h1 id="artist-pub-name" className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase leading-tight text-white">
              {artist.name}
            </h1>

            {artist.bio ? (
              <p id="artist-pub-bio" className="text-slate-400 text-sm italic max-w-lg leading-relaxed text-center font-normal px-2">
                "{artist.bio}"
              </p>
            ) : null}

            {/* Public action row: Beautiful, large buttons centered for mobile */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-2.5 pt-4 w-full">
              <button 
                id="pub-talk-whatsapp-btn"
                onClick={handleSpeakWithArtist}
                className="w-full sm:w-auto h-11 px-5 py-2.5 bg-emerald-605 bg-emerald-650 hover:bg-emerald-500 hover:scale-102 text-white rounded-xl text-xs font-heading font-black tracking-wider uppercase shadow-lg shadow-emerald-500/5 flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4 shrink-0" /> Whatsapp do Artista
              </button>

              <button 
                id="pub-whatsapp-share-btn"
                onClick={handleShareWhatsApp}
                className="w-full sm:w-auto h-11 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-750 hover:text-white text-slate-300 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition select-none active:scale-95 hover:scale-102"
                title="Compartilhar no WhatsApp"
              >
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0" /> Compartilhar no Whatsapp
              </button>

              <button 
                id="pub-copy-dissemination-btn"
                onClick={handleCopyLinkDissemination}
                className="w-full sm:w-auto h-11 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-xl text-xs font-heading font-black tracking-wider uppercase shadow-lg shadow-orange-500/5 flex items-center justify-center gap-1.5 cursor-pointer lg:hover:scale-102 select-none transition-all active:scale-95"
                title="Copiar mensagem para divulgação"
              >
                <Copy className="w-4 h-4 shrink-0 text-slate-950" /> {copiedLinkAlert ? "Divulgação Copiada! ✓" : "Copiar Divulgação"}
              </button>

              {artist.instagram && (
                <button 
                  id="pub-insta-link-btn"
                  onClick={handleInstagramShare}
                  className="w-full sm:w-auto h-11 px-5 py-2.5 border border-slate-850 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-mono"
                  title="Acessar Instagram"
                >
                  <Instagram className="w-4 h-4 text-orange-400 shrink-0" />{' '}
                  <span>
                    {artist.instagram.trim().startsWith('@') 
                      ? artist.instagram.trim() 
                      : `@${artist.instagram.trim()}`}
                  </span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* TRACKS LIST SECTION */}
      <section className="max-w-3xl mx-auto px-4 pt-6 space-y-5">

        {/* Private Catalog invitation warning notice */}
        <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm text-center">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Catálogo musical privado — acesso por convite.</span>
        </div>
        
        {/* Headline section */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div>
            <h3 className="font-heading font-black text-lg tracking-tight uppercase text-slate-200">
              Composições disponíveis
            </h3>
            <p className="text-slate-500 text-[11px] sm:text-xs">Clique no Play ou selecione para escutar no painel do carro.</p>
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
              className="flex items-center gap-1 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 rounded-xl text-[10px] sm:text-xs font-bold uppercase transition scale-95 hover:scale-100 cursor-pointer select-none"
            >
              <Car className="w-3.5 h-3.5 text-orange-500 shrink-0 animate-pulse" /> Ouvir no Carro
            </button>
          )}
        </div>

        {whatsappShareAlert && (
          <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-350 text-xs font-mono rounded-lg text-center font-semibold">
            Redirecionando para o WhatsApp...
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-900 rounded-2xl text-slate-500 text-sm">
            Nenhuma composição disponível no momento.
          </div>
        ) : (
          <div id="pub-tracks-list" className="space-y-2.5">
            {tracks.map((track, idx) => {
              const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
              const isActiveAndPlaying = isCurrentlyPlaying && isPlaying;
              const plays = track.playsCount || track.plays || 0;

              return (
                <div 
                  key={track.trackId}
                  onClick={() => onSelectTrack(track, tracks)}
                  className={`p-4 bg-slate-900/40 hover:bg-slate-900 border rounded-xl flex items-center justify-between gap-3.5 cursor-pointer transition-all ${
                    isCurrentlyPlaying ? 'ring-1.5 ring-orange-500 border-transparent bg-slate-900/80 shadow-md shadow-orange-500/5' : 'border-slate-900/50'
                  }`}
                >
                  {/* Track Info Side */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Index count or dynamic active visual bar counter */}
                    <div className="flex-shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="p-2 bg-orange-950/80 border border-orange-550/20 rounded-lg text-orange-400">
                          {isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                              <span className="w-0.75 bg-orange-400 animate-bar-1 h-3 rounded-full"></span>
                              <span className="w-0.75 bg-orange-400 animate-bar-2 h-3.5 rounded-full"></span>
                              <span className="w-0.75 bg-orange-400 animate-bar-3 h-1.5 rounded-full"></span>
                            </div>
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                          )}
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center font-mono font-bold text-xs text-slate-500 bg-slate-950/80 border border-slate-900 rounded-lg select-none">
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>

                    {/* Meta descriptions */}
                    <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading font-bold text-base sm:text-lg text-slate-100 tracking-tight leading-snug break-words">
                          {track.title}
                        </h4>
                        
                        <div className="text-slate-400 text-xs mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {track.singer && (
                            <span>
                              Cantor/Guia: <strong className="text-slate-300 font-medium">{track.singer}</strong>
                            </span>
                          )}
                          {track.composer && (
                            <span className="text-slate-400 font-normal">
                              {track.singer ? '|' : ''} Autor: <strong className="text-slate-300 font-medium">{track.composer}</strong>
                            </span>
                          )}
                        </div>

                        {/* Discreet Plays Count indicator */}
                        <div className="mt-1 flex items-center gap-1 text-slate-500 text-[10px] font-mono select-none">
                          <Play className="w-3 h-3 text-slate-600 fill-slate-600 shrink-0" />
                          <span>{plays} execuções</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 bg-slate-800/80 text-[9px] font-mono text-slate-400 rounded uppercase font-bold tracking-wider">
                          {track.genre || artist.genre}
                        </span>
                        {track.lyrics && (
                          <span className="px-1.5 py-0.5 bg-orange-950/40 border border-orange-500/10 text-orange-300 text-[9px] font-mono rounded font-black uppercase tracking-widest">
                            LETRA
                          </span>
                        )}
                        {(currentPlan === 'pro' || currentPlan === 'premium') && (
                          <span className="px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-500/10 text-emerald-400 text-[9px] font-mono rounded font-black uppercase tracking-wider">
                            LIBERADA
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Actions / Buttons area on right hand side */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
                    
                    {/* Pro & Premium Only: Quero Gravar Button - Discreet but beautiful */}
                    {(currentPlan === 'pro' || currentPlan === 'premium') && (
                      <button 
                        id={`contact-track-btn-${track.trackId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactForTrack(track);
                        }}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-white hover:bg-emerald-650 transition rounded-xl text-[11px] font-bold"
                        title="Desejo gravar / licenciar"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Quero Gravar
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
                      className="w-10 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-450 text-slate-950 hover:scale-105 active:scale-95 rounded-full cursor-pointer transition shadow-md shadow-orange-500/2"
                    >
                      {isActiveAndPlaying ? (
                        <Pause className="w-4 h-4 fill-slate-950 text-slate-950" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-950 text-slate-950 ml-0.5" />
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Discrete bottom Ad banner for free users, placed gracefully at the absolute bottom footer and very clean */}
      {currentPlan === 'free' && (
        <div id="free-plan-ads-banner" className="max-w-md mx-auto px-4 mt-16 bg-slate-900/10 border border-slate-900/60 rounded-xl p-3 text-center opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs">
            <span className="px-1.5 py-0.5 bg-slate-950 text-slate-500 text-[8px] font-mono rounded font-semibold uppercase tracking-wider select-none">
              Parceiro Soundrive
            </span>
            <p className="font-sans text-[10px] text-slate-550 leading-relaxed">
              Equipamentos de áudio profissionais e Guitarras Tagima na Strings — Cupom <strong>SOUND30</strong>.
            </p>
          </div>
        </div>
      )}

      {/* FOOTER PUSH BRANDING */}
      <div className="mt-16 max-w-3xl mx-auto px-4 text-center text-slate-650 text-xs font-mono uppercase">
        <p className="text-slate-600">Montado usando a plataforma Soundrive © {new Date().getFullYear()}</p>
        <p className="text-[10px] text-slate-700 mt-1 lowercase font-sans">Gere sua página exclusiva, teste no painel Bluetooth e feche contratos.</p>
      </div>

    </div>
  );
}
