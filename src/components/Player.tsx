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
      <div id="car-player-fullscreen" onContextMenu={(e) => e.preventDefault()} className="fixed inset-0 bg-[#090b10] text-[#f8fafc] z-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans overflow-y-auto sm:overflow-hidden select-none">
        
        {/* Specular Ambient Glow effects */}
        <div className="absolute right-[-10%] top-[10%] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-amber-500/5 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"></div>
        <div className="absolute left-[-10%] bottom-[10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-orange-600/5 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff01_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

        {/* Dynamic Header Row */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 z-10 w-full shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0"></div>
            <span className="text-xs sm:text-sm font-mono tracking-widest text-zinc-400 font-bold uppercase flex items-center gap-2">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Transmissão Bluetooth
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCarLyricsActive(!carLyricsActive)}
              className={`flex items-center gap-1 px-3.5 py-1.5 transition rounded-xl text-[10px] sm:text-xs font-heading font-black uppercase tracking-wider cursor-pointer border select-none ${
                carLyricsActive 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" /> Letras
            </button>

            <button 
              id="exit-car-mode-btn"
              onClick={() => {
                setCarMode(false);
                setCarLyricsActive(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 rounded-xl transition cursor-pointer text-[10px] sm:text-xs font-heading font-black uppercase tracking-wide text-zinc-300"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-500" /> Celular
            </button>
          </div>
        </div>

        {/* Adaptive Dynamic Splitting Canvas with scroll safety for smaller devices */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-8 lg:gap-14 my-4 max-w-6xl mx-auto w-full z-10 overflow-y-visible lg:overflow-hidden min-h-0">
          
          {/* Cover Art / Golden Vinyl Spinning graphic */}
          <div className={`flex flex-col items-center justify-center gap-3 sm:gap-6 transition-all duration-505 ${carLyricsActive ? 'lg:w-[45%] lg:items-start text-center lg:text-left' : 'w-full'}`}>
            <div className="relative flex-shrink-0">
              {/* Premium Realistic Concentric Glossy Vinyl Disc with optimized viewport-based diameters */}
              <div 
                id="car-track-cover-notes"
                className={`rounded-full bg-gradient-to-b from-[#14161f] to-[#04060a] border-[8px] sm:border-[12px] border-zinc-900 shadow-2xl flex flex-col items-center justify-center transition-all duration-[6000ms] ease-in-out relative ${
                  carLyricsActive 
                    ? 'w-28 h-28 min-[380px]:w-36 min-[380px]:h-36 sm:w-52 sm:h-52 md:w-60 md:h-60' 
                    : 'w-36 h-36 min-[380px]:w-44 min-[380px]:h-44 sm:w-64 sm:h-64 md:w-76 md:h-76'
                } ${isPlaying ? 'animate-spin-slow scale-102 shadow-amber-550/15' : ''}`}
              >
                {/* Mirror finish glossy grooves */}
                <div className="absolute inset-2 sm:inset-3 rounded-full border border-zinc-850/15"></div>
                <div className="absolute inset-5 sm:inset-7 rounded-full border border-zinc-850/30"></div>
                <div className="absolute inset-8 sm:inset-11 rounded-full border border-zinc-850/20"></div>
                <div className="absolute inset-12 sm:inset-16 rounded-full border border-zinc-850/15"></div>
                <div className="absolute inset-16 sm:inset-22 rounded-full border border-zinc-850/10"></div>
                <div className="absolute inset-20 sm:inset-28 rounded-full border border-zinc-850/5"></div>
                
                {/* Golden Center Sticker with concentric lines and spindle opening */}
                <div className="w-[32%] h-[32%] rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 border border-zinc-950 flex items-center justify-center text-zinc-950 shadow-inner relative select-none">
                  <div className="absolute inset-1 rounded-full border border-zinc-950/20"></div>
                  <MusicIcon className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-950 stroke-[2.5] animate-pulse" />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-[#090b10] border border-zinc-950/40"></div>
                </div>
              </div>
              {isPlaying && (
                <div className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 opacity-15 blur-lg -z-10 animate-pulse"></div>
              )}
            </div>
            
            {/* Metadata overlay with improved sizes for mobile without color clipping */}
            <div className={carLyricsActive ? 'lg:max-w-md w-full' : 'max-w-2xl text-center w-full'}>
              <h1 id="car-track-title" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-black tracking-tight leading-normal uppercase text-white px-4 truncate">
                {currentTrack.title}
              </h1>
              <p id="car-track-artist" className="text-amber-400 text-base sm:text-lg md:text-xl mt-0.5 font-extrabold tracking-wide">
                {currentTrack.singer || "Artista Independente"}
              </p>
              {currentTrack.composer && (
                <p className="text-zinc-505 text-[10px] sm:text-xs mt-1 uppercase font-mono tracking-widest leading-normal font-bold">
                  Compositor: <span className="text-zinc-300 font-extrabold">{currentTrack.composer}</span>
                </p>
              )}
            </div>
          </div>

          {/* Expanded scrolling lyrics inside Car Modal */}
          {carLyricsActive && (
            <div className="flex-1 lg:w-[55%] h-[20vh] sm:h-[30vh] lg:h-[50vh] w-full bg-zinc-950/60 border border-zinc-900/60 p-4 sm:p-6 rounded-3xl overflow-y-auto scrollbar-none flex flex-col justify-between relative select-text transition-all duration-300">
              <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-[#090b10] to-transparent pointer-events-none z-10"></div>
              
              <div className="space-y-3.5 text-center py-3">
                {currentTrack.lyrics ? (
                  currentTrack.lyrics.split('\n').map((line, idx) => {
                    const isHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                    if (isHeader) {
                      return (
                        <p key={idx} className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold pt-2 pb-0.5">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs sm:text-base font-bold tracking-tight text-zinc-300 hover:text-white leading-relaxed">
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <div className="space-y-2 py-8">
                    <p className="text-zinc-550 text-xs font-mono uppercase tracking-widest font-black">[ Sem Letra Cadastrada ]</p>
                    <p className="text-zinc-600 text-[11px] leading-relaxed max-w-xs mx-auto">O compositor não arquivou as estrofes originais no painel.</p>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#090b10] to-transparent pointer-events-none z-10"></div>
            </div>
          )}

        </div>

        {/* Compact, elegant timeline slider */}
        <div className="w-full max-w-2xl mx-auto px-4 space-y-1.5 z-10">
          <div className="relative flex items-center">
            <input 
              id="car-track-seekbar"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-900 accent-amber-500 rounded-lg appearance-none cursor-pointer transition-all hover:bg-zinc-850"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-550 font-bold select-none px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Central Dashboard Large Touch Controls */}
        <div className="w-full max-w-xl mx-auto flex items-center justify-center gap-6 sm:gap-9 py-2 sm:py-3.5 px-4 z-10 select-none">
          <button 
            id="car-prev-btn"
            onClick={onPrev}
            className="p-3 bg-zinc-905 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black/30"
            title="Música anterior"
          >
            <SkipBack className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-200" />
          </button>

          <button 
            id="car-play-pause-btn"
            onClick={onPlayPause}
            className="p-4.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-zinc-950 rounded-full hover:brightness-110 shadow-xl shadow-amber-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-zinc-950 text-zinc-950" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-zinc-950 text-zinc-955 ml-1" />
            )}
          </button>

          <button 
            id="car-next-btn"
            onClick={onNext}
            className="p-3 bg-zinc-905 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black/30"
            title="Próxima música"
          >
            <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-200" />
          </button>
        </div>

        {/* Bottom guidance banner */}
        <div className="text-center text-zinc-550 text-[10px] sm:text-xs font-mono py-1 flex items-center justify-center gap-1.5 z-10 select-none">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Toques ampliados ideais para centrais automotivas ou suporte de para-brisa.
        </div>
      </div>
    );
  }

  // 2. COMPACT FLOATING CAPSULE PLAYER (STANDARD MODE)
  return (
    <>
      <div 
        id="bottom-dock-player" 
        onContextMenu={(e) => e.preventDefault()}
        className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 md:bottom-6 max-w-5xl mx-auto z-40 rounded-2xl bg-[#0d0f14]/92 border border-zinc-800/80 backdrop-blur-xl transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.65)] select-none"
      >
        {/* Sleek top edge continuous neon seekbar */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-zinc-900/60 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-amber-450 to-orange-500 transition-all duration-150"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          ></div>
        </div>

        <div className="p-3 px-4 md:px-6 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Block: Track Thumbnail & Text Metadata */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-[55%] md:max-w-[35%] overflow-hidden">
            <div className="relative flex-shrink-0 group select-none">
              <div 
                id="player-mini-cover"
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${isPlaying ? 'from-zinc-950 to-zinc-900 border border-zinc-800' : 'from-amber-505 to-orange-555'} text-zinc-950 flex items-center justify-center shadow-lg transition-all duration-500 ${
                  isPlaying ? 'ring-2 ring-amber-500/30' : ''
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-end gap-0.5 h-3.5 sm:h-4.5">
                    <span className="w-0.75 bg-amber-500 animate-bar-1 rounded-full"></span>
                    <span className="w-0.75 bg-amber-400 animate-bar-2 rounded-full"></span>
                    <span className="w-0.75 bg-orange-400 animate-bar-3 rounded-full"></span>
                    <span className="w-0.75 bg-amber-500 animate-bar-4 rounded-full"></span>
                  </div>
                ) : (
                  <MusicIcon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 stroke-[2]" />
                )}
              </div>
              <button 
                onClick={() => setShowFicha(!showFicha)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition cursor-pointer"
                title="Informações da canção"
              >
                <Info className="w-4 h-4 text-amber-550" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 id="player-track-title" className="font-heading font-black text-xs sm:text-sm tracking-tight text-[#f8fafc] truncate uppercase leading-none">
                  {currentTrack.title}
                </h4>
                <button 
                  onClick={() => setShowFicha(!showFicha)}
                  className="text-zinc-500 hover:text-amber-400 transition cursor-pointer shrink-0"
                  title="Ficha da música"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <p id="player-track-artist" className="text-[10px] sm:text-xs text-zinc-400 truncate mt-0.5 font-semibold">
                {currentTrack.singer || "Artista Independente"}
              </p>
            </div>
          </div>

          {/* Center Block: Playback controls on Tablet & Desktop */}
          <div className="hidden md:flex flex-col items-center flex-1 max-w-[40%] gap-1.5 shrink-0">
            {/* Player Buttons */}
            <div className="flex items-center gap-5 select-none text-zinc-400">
              <button 
                id="prev-btn"
                onClick={onPrev}
                className="hover:text-white transition p-1 hover:scale-115 active:scale-90 cursor-pointer outline-none" 
                title="Música anterior"
              >
                <SkipBack className="w-4.5 h-4.5 text-zinc-400" />
              </button>

              <button 
                id="play-pause-btn"
                onClick={onPlayPause}
                className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-550 text-zinc-950 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10 transition cursor-pointer flex items-center justify-center outline-none font-bold"
                title={isPlaying ? "Deter" : "Reproduzir"}
              >
                {isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950 ml-0.5" />
                )}
              </button>

              <button 
                id="next-btn"
                onClick={onNext}
                className="hover:text-white transition p-1 hover:scale-115 active:scale-90 cursor-pointer outline-none" 
                title="Próxima música"
              >
                <SkipForward className="w-4.5 h-4.5 text-zinc-400" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-zinc-550 font-bold select-none text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <input 
                id="track-seekbar"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition outline-none"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Block: Controls & Option Toggles */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 max-w-[45%] md:max-w-[25%] shrink-0">
            
            {/* Play/Pause Button on Mobile Only */}
            <button 
              id="mobile-play-pause-btn"
              onClick={onPlayPause}
              className="md:hidden p-2.5 bg-gradient-to-tr from-amber-500 to-orange-550 text-zinc-950 rounded-full active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer select-none border border-transparent"
              title={isPlaying ? "Pausar" : "Tocar"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
              ) : (
                <Play className="w-4 h-4 fill-zinc-950 text-zinc-950 ml-0.5" />
              )}
            </button>

            {/* Lyrics Toggle Button */}
            <button 
              onClick={() => setShowLyrics(true)}
              className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2.5 bg-amber-500/10 border border-amber-500/20 hover:border-amber-550/40 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 font-heading"
              title="Letra da canção"
            >
              <AlignLeft className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden min-[380px]:inline">Letra</span>
            </button>

            {/* Car Mode Launcher button */}
            <button 
              id="launch-car-mode-btn"
              onClick={() => setCarMode(true)}
              className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 select-none"
              title="Para Carro"
            >
              <Car className="w-3.5 h-3.5 text-amber-500 cursor-pointer" />
              <span className="hidden min-[380px]:inline text-[10px] sm:text-xs font-bold uppercase tracking-wide text-zinc-300">Carro</span>
            </button>

            {/* Desktop Volume Node */}
            <div className="hidden lg:flex items-center gap-1.5 select-none text-zinc-500">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-zinc-500 hover:text-white transition p-1 cursor-pointer outline-none"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-500" />
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
                className="w-12 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500 outline-none"
              />
            </div>

          </div>
        </div>
      </div>

      {/* COMPACT TECHNICAL SLIDE DIALOG */}
      {showFicha && (
        <div className="fixed bottom-24 left-4 md:left-8 bg-[#0b0e14]/95 border border-zinc-800/80 p-4 rounded-2xl shadow-2xl max-w-sm w-[calc(100vw-32px)] z-50 text-zinc-300 animate-slide-up select-none backdrop-blur-xl">
          <div className="flex justify-between items-start border-b border-zinc-900 pb-2 mb-2 w-full">
            <h5 className="font-heading font-black text-xs tracking-widest text-amber-400 uppercase flex items-center gap-1.5 font-bold">
              <Disc className="w-4 h-4 text-amber-550 animate-spin-slow" /> Ficha Técnica Autor
            </h5>
            <button 
              onClick={() => setShowFicha(false)} 
              className="hover:text-white text-zinc-500 transition cursor-pointer text-[10px] uppercase font-bold"
            >
              Fechar
            </button>
          </div>
          <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
            <p><strong className="text-zinc-550 font-bold uppercase tracking-wide">Música:</strong> {currentTrack.title}</p>
            <p><strong className="text-zinc-550 font-bold uppercase tracking-wide">Intérprete:</strong> {currentTrack.singer || "Não especificado"}</p>
            {currentTrack.composer && <p><strong className="text-zinc-550 font-bold uppercase tracking-wide">Compositores:</strong> {currentTrack.composer}</p>}
            {currentTrack.genre && <p><strong className="text-zinc-550 font-bold uppercase tracking-wide">Estilo:</strong> {currentTrack.genre}</p>}
            {currentTrack.description && (
              <p className="mt-2 text-zinc-400 italic border-l-2 border-amber-500 pl-2 py-0.5 leading-relaxed bg-zinc-900/30 rounded-r">
                "{currentTrack.description}"
              </p>
            )}
            <p className="text-[9px] text-amber-550 font-mono text-right pt-2.5 uppercase tracking-wider select-none leading-none">Registrado no acervo digital</p>
          </div>
        </div>
      )}

      {/* Backdrop overlay */}
      {showLyrics && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 transition-all duration-300"
          onClick={() => setShowLyrics(false)}
        />
      )}

      {/* SLIDING PREMIER LYRICS SIDE DRAWER */}
      <div 
        id="side-lyrics-drawer"
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-[#090b10]/98 border-l border-zinc-900 backdrop-blur-3xl z-50 flex flex-col justify-between p-6 select-text transition-transform duration-500 ease-out shadow-2xl shadow-black/80 ${
          showLyrics ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Specular premium gradient orb */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Header Block of Lyrics Drawer */}
        <div className="relative flex items-center justify-between z-10 border-b border-zinc-900 pb-3.5 select-none w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-lg flex-shrink-0">
              <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin-slow text-amber-550' : 'text-zinc-555'}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold leading-none">Tocando Agora</h4>
              <h3 className="text-sm font-heading font-black uppercase text-white truncate w-full mt-1">{currentTrack.title}</h3>
            </div>
          </div>
          
          <button 
            onClick={() => setShowLyrics(false)}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl transition cursor-pointer text-[10px] font-heading font-black uppercase tracking-wider text-zinc-400"
          >
            Fechar
          </button>
        </div>

        {/* Dynamic scrollable lyric text block with fading masks */}
        <div className="relative flex-1 flex flex-col my-5 overflow-hidden z-10">
          <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-[#090b10] to-transparent pointer-events-none z-10"></div>
          
          <div className="flex-1 overflow-y-auto px-2 space-y-4 py-5 text-center scroll-smooth scrollbar-none">
            {currentTrack.lyrics ? (
              currentTrack.lyrics.split('\n').map((line, idx) => {
                const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                if (isSectionHeader) {
                  return (
                    <p key={idx} className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold pt-3.5 pb-0.5 select-none">
                      {line}
                    </p>
                  );
                }
                return (
                  <p 
                    key={idx} 
                    className="text-base font-extrabold tracking-tight text-zinc-300 hover:text-white transition-all cursor-default leading-relaxed font-sans"
                  >
                    {line}
                  </p>
                );
              })
            ) : (
              <div className="space-y-3 py-16">
                <BookOpen className="w-8 h-8 text-zinc-700 mx-auto animate-bounce" />
                <p className="text-zinc-555 text-[10px] font-mono uppercase tracking-widest">[ Obra instrumental / sem letra arquivada ]</p>
                <p className="text-zinc-600 text-xs max-w-xs mx-auto leading-relaxed">
                  O compositor de "{currentTrack.title}" ainda não disponibilizou o arquivo literário para esta demo.
                </p>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#090b10] to-transparent pointer-events-none z-10"></div>
        </div>

        {/* Micro Synced Player Controls inside Drawer */}
        <div className="relative border-t border-zinc-900 pt-4 space-y-3 z-10 select-none w-full">
          {/* Progress seekbar */}
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-zinc-500 font-bold w-full">
            <span>{formatTime(currentTime)}</span>
            <input 
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition outline-none"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Core Player control layout */}
          <div className="flex items-center justify-center gap-5 w-full">
            <button 
              onClick={onPrev} 
              className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button 
              onClick={onPlayPause} 
              className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-555 text-zinc-950 rounded-full hover:brightness-110 shadow-lg shadow-amber-555/15 transition cursor-pointer font-bold"
              title={isPlaying ? "Deter" : "Tocar"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-slate-950 text-zinc-950" /> : <Play className="w-5 h-5 fill-slate-950 text-zinc-950 ml-0.5" />}
            </button>
            
            <button 
              onClick={onNext} 
              className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
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
