import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Car, 
  Smartphone, 
  Disc, 
  Info,
  AlignLeft,
  BookOpen,
  Music as MusicIcon
} from 'lucide-react';
import { Music } from '../types';

interface PlayerProps {
  currentTrack: Music | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  trackList: Music[];
  isCarMode: boolean;
  setCarMode: (active: boolean) => void;
}

export default function Player({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  trackList,
  isCarMode,
  setCarMode
}: PlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [carLyricsActive, setCarLyricsActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize audio element state
  useEffect(() => {
    if (!currentTrack) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    // Check if source changed
    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.load();
    }

    // Set callbacks
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => onNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    // Apply active volume state
    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("Playing audio requires user interaction first:", err);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrack, isPlaying, onNext]);

  // Handle play/pause, volume, mute toggling
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, volume, isMuted]);

  if (!currentTrack) return null;

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 1. IMMERSIVE CAR MODE (FULL SCREEN VIEW)
  if (isCarMode) {
    return (
      <div id="car-player-fullscreen" className="fixed inset-0 bg-[#06080d] text-white z-50 flex flex-col justify-between p-6 md:p-10 font-sans overflow-hidden">
        
        {/* Ambient background disc glow */}
        <div className="absolute right-[-15%] top-[10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute left-[-15%] bottom-[10%] w-[450px] h-[450px] bg-yellow-600/10 rounded-full blur-[130px] pointer-events-none"></div>

        {/* Car Mode Header */}
        <div className="flex items-center justify-between border-b border-slate-900/60 pb-3.5 z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
            <span className="text-sm font-mono tracking-widest text-slate-400 font-bold uppercase flex items-center gap-2">
              <Car className="w-5 h-5 text-orange-400" /> Bluetooth Transmissão Carro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCarLyricsActive(!carLyricsActive)}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 transition rounded-full text-xs font-heading font-black uppercase tracking-wider ${
                carLyricsActive 
                  ? 'bg-orange-950 border border-orange-500 text-orange-200' 
                  : 'bg-slate-900/80 border border-slate-880 text-slate-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-4 h-4" /> Letras
            </button>

            <button 
              id="exit-car-mode-btn"
              onClick={() => {
                setCarMode(false);
                setCarLyricsActive(false);
              }}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition cursor-pointer text-xs font-heading font-black uppercase tracking-wider text-slate-300"
            >
              <Smartphone className="w-4 h-4 text-orange-450" /> Celular
            </button>
          </div>
        </div>

        {/* Core Layout Split */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 my-4 select-none max-w-7xl mx-auto w-full z-10 overflow-hidden">
          
          {/* Cover & metadata info */}
          <div className={`flex flex-col items-center justify-center gap-6 transition-all duration-500 ${carLyricsActive ? 'lg:w-[45%] lg:items-start text-center lg:text-left' : 'w-full'}`}>
            <div className="relative flex-shrink-0">
              <div 
                id="car-track-cover-notes"
                className={`rounded-full bg-slate-950 border-4 border-slate-900 shadow-2xl flex flex-col items-center justify-center transition-all duration-[6000ms] ease-in-out relative overflow-hidden ${
                  carLyricsActive ? 'w-48 h-48 md:w-64 md:h-64' : 'w-60 h-60 md:w-80 md:h-80'
                } ${isPlaying ? 'animate-spin-slow scale-103 shadow-orange-500/40' : ''}`}
              >
                {/* Simulated glossy vinyl record grooves */}
                <div className="absolute inset-4 rounded-full border border-slate-800/45"></div>
                <div className="absolute inset-10 rounded-full border border-slate-800/30"></div>
                <div className="absolute inset-16 rounded-full border border-slate-800/20"></div>
                
                {/* Glowing Center Label */}
                <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 border border-slate-950 flex items-center justify-center text-slate-950 shadow-inner">
                  <MusicIcon className="w-6 h-6 text-slate-950 animate-bounce" />
                </div>
              </div>
              {isPlaying && (
                <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-orange-600 to-yellow-500 opacity-20 blur-md -z-10 animate-pulse"></div>
              )}
            </div>
            
            <div className={carLyricsActive ? 'lg:max-w-md' : 'max-w-2xl text-center'}>
              <h1 id="car-track-title" className="text-2xl md:text-3xl lg:text-4xl font-heading font-black tracking-tight leading-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 truncate w-full">
                {currentTrack.title}
              </h1>
              <p id="car-track-artist" className="text-orange-400 text-lg md:text-xl mt-1.5 font-bold tracking-wide">
                {currentTrack.singer || "Artista Independente"}
              </p>
              {currentTrack.composer && (
                <p className="text-slate-500 text-xs md:text-sm mt-1.5 font-mono uppercase tracking-wide">
                  Autor: <span className="text-slate-400 font-bold">{currentTrack.composer}</span>
                </p>
              )}
            </div>
          </div>

          {/* Large split-screen lyrics if toggled */}
          {carLyricsActive && (
            <div className="flex-1 lg:w-[55%] h-[35vh] lg:h-[55vh] w-full bg-slate-950/65 border border-slate-850 p-6 rounded-3xl overflow-y-auto scrollbar-none flex flex-col justify-between relative">
              <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#06080d] to-transparent pointer-events-none z-10"></div>
              
              <div className="space-y-4 text-center py-4">
                {currentTrack.lyrics ? (
                  currentTrack.lyrics.split('\n').map((line, idx) => {
                    const isHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                    if (isHeader) {
                      return (
                        <p key={idx} className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-[#d4af37] font-extrabold pt-3">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-sm md:text-lg font-bold tracking-tight text-slate-300 hover:text-white leading-relaxed">
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <div className="space-y-3 py-10">
                    <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Sem Letra Cadastrada</p>
                    <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto">Compositor ainda não enviou a letra desta música autoral.</p>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#06080d] to-transparent pointer-events-none z-10"></div>
            </div>
          )}

        </div>

        {/* Large Slider / Progress */}
        <div className="w-full max-w-4xl mx-auto px-4 space-y-2 z-10">
          <div className="relative group flex items-center">
            <input 
              id="car-track-seekbar"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition"
            />
          </div>
          <div className="flex justify-between text-base font-mono text-slate-400 font-bold">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* GIGANTIC TOUCH CONTROLS (Ideal for mobile/dashboard in-car use) */}
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-10 md:gap-14 py-4 px-4 z-10 select-none">
          <button 
            id="car-prev-btn"
            onClick={onPrev}
            className="p-4.5 bg-slate-900 outline-none border border-slate-800 text-white rounded-full hover:bg-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center shadow-lg shadow-black/40"
            title="Música anterior"
          >
            <SkipBack className="w-10 h-10 md:w-12 md:h-12 text-slate-200" />
          </button>

          <button 
            id="car-play-pause-btn"
            onClick={onPlayPause}
            className="p-6.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-full hover:brightness-110 shadow-2xl shadow-orange-500/25 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center"
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 md:w-16 md:h-16 fill-slate-950" />
            ) : (
              <Play className="w-12 h-12 md:w-16 md:h-16 fill-slate-950 ml-1.5" />
            )}
          </button>

          <button 
            id="car-next-btn"
            onClick={onNext}
            className="p-4.5 bg-slate-900 outline-none border border-slate-800 text-white rounded-full hover:bg-slate-800 hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center shadow-lg shadow-black/40"
            title="Próxima música"
          >
            <SkipForward className="w-10 h-10 md:w-12 md:h-12 text-slate-200" />
          </button>
        </div>

        {/* Touch Warning Help */}
        <div className="text-center text-slate-500 text-xs font-mono py-1 pb-2 flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-yellow-400" /> Toques gigantes otimizados para central de multimídia ou suporte de painel.
        </div>
      </div>
    );
  }

  // 2. COMPACT FLOATING CAPSULE PLAYER (STANDARD MODE)
  return (
    <>
      <div 
        id="bottom-dock-player" 
        className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 md:bottom-6 max-w-5xl mx-auto z-40 rounded-2xl bg-[#090b11]/90 border border-slate-800/80 backdrop-blur-xl transition-all duration-300 shadow-2xl shadow-orange-950/15"
      >
        {/* Sleek top edge continuous neon seekbar */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-900/60 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-yellow-300 transition-all duration-150"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          ></div>
        </div>

        <div className="p-3.5 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left Block: Track Thumbnail & Text Metadata */}
          <div className="flex items-center gap-3.5 w-full sm:w-[35%] overflow-hidden">
            <div className="relative flex-shrink-0 group select-none">
              <div 
                id="player-mini-cover"
                className={`w-12 h-12 md:w-13 md:h-13 rounded-xl bg-gradient-to-tr ${isPlaying ? 'from-slate-950 to-slate-900 border border-slate-800' : 'from-orange-600 to-yellow-500'} text-slate-950 flex items-center justify-center shadow-lg transition-all duration-500 ${
                  isPlaying ? 'ring-2 ring-orange-500/40' : ''
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-end gap-0.5 h-4.5">
                    <span className="w-0.75 bg-orange-500 animate-bar-1 rounded-full"></span>
                    <span className="w-0.75 bg-orange-400 animate-bar-2 rounded-full"></span>
                    <span className="w-0.75 bg-yellow-400 animate-bar-3 rounded-full"></span>
                    <span className="w-0.75 bg-orange-500 animate-bar-4 rounded-full"></span>
                  </div>
                ) : (
                  <MusicIcon className="w-5 h-5 text-slate-950" />
                )}
              </div>
              <button 
                onClick={() => setShowFicha(!showFicha)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition cursor-pointer"
                title="Informações da canção"
              >
                <Info className="w-4.5 h-4.5 text-orange-400" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 id="player-track-title" className="font-heading font-black text-sm tracking-tight text-white truncate uppercase leading-none">
                  {currentTrack.title}
                </h4>
                <button 
                  onClick={() => setShowFicha(!showFicha)}
                  className="text-slate-400 hover:text-yellow-450 transition cursor-pointer"
                  title="Ficha da música"
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
              <p id="player-track-artist" className="text-[11px] md:text-sm text-slate-400 truncate font-semibold mt-0.5">
                {currentTrack.singer || "Artista Independente"}
              </p>
            </div>
          </div>

          {/* Center Block: Compact Controls & Small Seekbar */}
          <div className="flex flex-col items-center w-full sm:w-[40%] gap-2 shrink-0">
            {/* Player Buttons */}
            <div className="flex items-center gap-4.5 select-none md:gap-5">
              <button 
                id="prev-btn"
                onClick={onPrev}
                className="text-slate-400 hover:text-white transition p-1 hover:scale-110 active:scale-95 cursor-pointer outline-none" 
                title="Música anterior"
              >
                <SkipBack className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </button>

              <button 
                id="play-pause-btn"
                onClick={onPlayPause}
                className="p-2 md:p-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-full hover:scale-105 active:scale-95 shadow-md shadow-orange-500/15 transition cursor-pointer flex items-center justify-center outline-none font-bold"
                title={isPlaying ? "Deter" : "Reproduzir"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 md:w-4.5 md:h-4.5 fill-slate-950" />
                ) : (
                  <Play className="w-4 h-4 md:w-4.5 md:h-4.5 fill-slate-950 ml-0.5" />
                )}
              </button>

              <button 
                id="next-btn"
                onClick={onNext}
                className="text-slate-400 hover:text-white transition p-1 hover:scale-110 active:scale-95 cursor-pointer outline-none" 
                title="Próxima música"
              >
                <SkipForward className="w-4 h-4 md:w-4.5 md:h-4.5" />
              </button>
            </div>

            {/* Micro Slider Seek Progress Row */}
            <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-slate-500 font-bold select-none">
              <span>{formatTime(currentTime)}</span>
              <input 
                id="track-seekbar"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-yellow-400 transition outline-none"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Block: Volume control, Letras Toggle & Car Mode */}
          <div className="flex items-center justify-end gap-3 w-full sm:w-[25%] shrink-0">
            
            {/* Letra button section (Main feature requested) */}
            <button 
              onClick={() => setShowLyrics(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/50 border border-orange-500/20 text-orange-300 hover:text-slate-950 hover:bg-orange-500 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer select-none font-bold hover:border-transparent"
              title="Letra da canção"
            >
              <AlignLeft className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
              <span>Letra</span>
            </button>

            {/* Car Mode Launcher button */}
            <button 
              id="launch-car-mode-btn"
              onClick={() => setCarMode(true)}
              className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition hover:scale-102 active:scale-98 cursor-pointer uppercase tracking-wider group select-none hover:border-slate-700"
              title="Transmissão para Carro"
            >
              <Car className="w-3.5 h-3.5 text-orange-450 group-hover:animate-bounce" />
              <span className="text-orange-450 ml-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wide">Carro</span>
            </button>

            {/* Simple Volume Node (hidden on mobile, gorgeous compact size) */}
            <div className="hidden lg:flex items-center gap-1.5 select-none">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer outline-none"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
               </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-12 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-slate-400 outline-none"
              />
            </div>

          </div>
        </div>
      </div>

      {/* COMPACT TECHNICAL SLIDE DIALOG */}
      {showFicha && (
        <div className="fixed bottom-24 left-4 md:left-8 bg-[#0b0e14] border border-slate-800 p-4 rounded-xl shadow-2xl max-w-sm w-[calc(100vw-32px)] z-50 text-slate-300 animate-slide-up select-none">
          <div className="flex justify-between items-start border-b border-slate-850 pb-2 mb-2">
            <h5 className="font-heading font-black text-xs tracking-widest text-yellow-450 uppercase flex items-center gap-1.5 font-bold">
              <Disc className="w-4 h-4 text-orange-400 animate-spin-slow" /> Ficha Técnica Autor
            </h5>
            <button 
              onClick={() => setShowFicha(false)} 
              className="hover:text-white text-slate-500 transition cursor-pointer text-[10px] uppercase font-bold"
            >
              Fechar
            </button>
          </div>
          <div className="space-y-1 text-[11px] text-slate-300">
            <p><strong className="text-slate-500 font-bold uppercase">Música:</strong> {currentTrack.title}</p>
            <p><strong className="text-slate-500 font-bold uppercase">Cantor/Banda:</strong> {currentTrack.singer || "Não especificado"}</p>
            {currentTrack.composer && <p><strong className="text-slate-500 font-bold uppercase">Compositores:</strong> {currentTrack.composer}</p>}
            {currentTrack.genre && <p><strong className="text-slate-500 font-bold uppercase">Estilo Musical:</strong> {currentTrack.genre}</p>}
            {currentTrack.description && (
              <p className="mt-2 text-slate-400 italic border-l-2 border-orange-500 pl-2 py-0.5 leading-relaxed bg-slate-900/35 rounded-r">
                "{currentTrack.description}"
              </p>
            )}
            <p className="text-[9px] text-orange-500 font-mono text-right pt-2.5 uppercase tracking-wider">Registrado no acervo pen drive</p>
          </div>
        </div>
      )}

      {/* ELEGANT COMPACT GLASS BACKDROP OVERLAY */}
      {showLyrics && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 transition-all duration-300"
          onClick={() => setShowLyrics(false)}
        />
      )}

      {/* SLIDING PREMIER LYRICS SIDE DRAWER */}
      <div 
        id="side-lyrics-drawer"
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#07090e]/98 border-l border-slate-900/80 backdrop-blur-2xl z-50 flex flex-col justify-between p-6 select-text transition-transform duration-500 ease-out shadow-2xl shadow-black/80 ${
          showLyrics ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Decorative subtle top edge ambient light */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Header Block of Lyrics Drawer */}
        <div className="relative flex items-center justify-between z-10 border-b border-slate-900/60 pb-3.5 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-500/25 flex items-center justify-center text-orange-400 shadow-lg flex-shrink-0">
              <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin-slow text-orange-400' : 'text-slate-500'}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Tocando Agora</h4>
              <h3 className="text-sm font-heading font-black uppercase text-white truncate w-full">{currentTrack.title}</h3>
            </div>
          </div>
          
          <button 
            onClick={() => setShowLyrics(false)}
            className="px-3.5 py-1.5 bg-slate-900/90 border border-slate-850 hover:bg-slate-800 hover:text-white rounded-lg transition cursor-pointer text-[10px] font-heading font-black uppercase tracking-wider text-slate-400"
          >
            Fechar
          </button>
        </div>

        {/* Scrollable Lyric Lines with Fading Gradient mask */}
        <div className="relative flex-1 flex flex-col my-5 overflow-hidden z-10">
          <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#07090e] to-transparent pointer-events-none z-10"></div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-5 py-6 text-center scroll-smooth scrollbar-none">
            {currentTrack.lyrics ? (
              currentTrack.lyrics.split('\n').map((line, idx) => {
                const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                if (isSectionHeader) {
                  return (
                    <p key={idx} className="text-[10px] font-mono uppercase tracking-widest text-yellow-405 font-extrabold pt-4 pb-1">
                      {line}
                    </p>
                  );
                }
                return (
                  <p 
                    key={idx} 
                    className="text-base font-extrabold tracking-tight text-slate-300 hover:text-white hover:scale-101 transition-all cursor-default leading-relaxed font-sans"
                  >
                    {line}
                  </p>
                );
              })
            ) : (
              <div className="space-y-4 py-16">
                <BookOpen className="w-9 h-9 text-slate-800 mx-auto animate-bounce" />
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Essa obra não possui letra arquivada</p>
                <p className="text-slate-600 text-xs max-w-xs mx-auto leading-relaxed">
                  O compositor de "{currentTrack.title}" ainda não editou as estrofes desta música.
                </p>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#07090e] to-transparent pointer-events-none z-10"></div>
        </div>

        {/* Micro Synced Player Controls inside Bottom Drawer */}
        <div className="relative border-t border-slate-900/60 pt-4 space-y-3 z-10 select-none">
          {/* Seekbar and timings */}
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500 font-bold">
            <span>{formatTime(currentTime)}</span>
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-orange-500 transition outline-none"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Core Player buttons */}
          <div className="flex items-center justify-center gap-5">
            <button 
              onClick={onPrev} 
              className="p-2.5 bg-slate-900/80 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button 
              onClick={onPlayPause} 
              className="p-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-full hover:brightness-110 shadow-lg shadow-orange-500/15 transition cursor-pointer font-bold"
              title={isPlaying ? "Deter" : "Tocar"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
            </button>
            
            <button 
              onClick={onNext} 
              className="p-2.5 bg-slate-900/80 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Seguinte"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
