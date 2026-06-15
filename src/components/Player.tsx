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
  Music as MusicIcon,
  Heart,
  Shuffle,
  Repeat,
  FileText,
  Bluetooth,
  Zap,
  Wifi,
  MoreVertical,
  List,
  ChevronDown
} from 'lucide-react';
import { Music } from '../types';

// Premium Soundrive custom curly-ribbon wireframe brand logo (S) with emerald gradient
const SLogoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="slogo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" /> {/* Emerald / Mint Green */}
        <stop offset="50%" stopColor="#84cc16" /> {/* Lime / Bright Green */}
        <stop offset="100%" stopColor="#eab308" /> {/* Gold / Amber Yellow */}
      </linearGradient>
    </defs>
    <path 
      d="M72 32C72 21 62 15 50 15C34 15 26 25 26 37C26 53 50 51 50 65C50 73 42 79 32 79C22 79 18 71 18 65" 
      stroke="url(#slogo-gradient)" 
      strokeWidth="7" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M28 68C28 79 38 85 50 85C66 85 74 75 74 63C74 47 50 49 50 35C50 27 58 21 68 21C78 21 82 29 82 35" 
      stroke="url(#slogo-gradient)" 
      strokeWidth="7" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      opacity="0.85"
    />
  </svg>
);

// Minimalist Sports Car outline in green-to-gold gradient
const CarSilhouetteIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 35" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="car-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#22c55e" /> {/* Green/Emerald */}
        <stop offset="50%" stopColor="#84cc16" /> {/* Lime/Light Green */}
        <stop offset="100%" stopColor="#eab308" /> {/* Gold/Amber */}
      </linearGradient>
    </defs>
    <path 
      d="M12 26C12 26 16 26 19 26C22 21 28 10 40 8.5C47 7.5 52 11 62 19C64 20.5 72 21.5 76 23C84 23.5 88 26 90 26C90 26 86 29 78 29M22 26C22 26 26 25 28 25C32 25 34 27 34 28.5M68 26C68 26 72 25 74 25C78 25 80 27 80 28.5" 
      stroke="url(#car-gradient)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

// High-fidelity integrated dynamic center with equalizer waves & golden gauge
const SoundriveCarVisualizer = ({ isPlaying, isDataSaver = false, className = "w-full h-full" }: { isPlaying: boolean, isDataSaver?: boolean, className?: string }) => {
  const raysCount = 48;
  const rays = Array.from({ length: raysCount });

  // Determine the count of dots in each radial direction based on the angle
  // This calculates the horizontal lens/eye shape with vertical flares and diagonal dips
  const getRayDotsCount = (angle: number) => {
    const hWeight = Math.pow(Math.cos(angle), 12); // sharp horizontal peak
    const vWeight = Math.pow(Math.sin(angle), 12); // sharp vertical peak
    const baseWeight = Math.pow(Math.abs(Math.cos(2 * angle)), 1.5) * 1.8; // general starburst pattern
    
    const factor = baseWeight + hWeight * 5.5 + vWeight * 3;
    return Math.max(2, Math.round(2 + factor));
  };

  return (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
      {/* Scope-local CSS style to support high-performance hardware accelerated svg bar scale animations */}
      {!isDataSaver && (
        <style>{`
          @keyframes glow-dot-pulse {
            0% {
              transform: scale(0.9);
              opacity: 0.65;
            }
            50% {
              transform: scale(1.15);
              opacity: 1;
            }
            100% {
              transform: scale(0.9);
              opacity: 0.65;
            }
          }
          .visualizer-glow-dot {
            transform-origin: center;
          }
        `}</style>
      )}

      {/* Deep black cosmic background container with subtle gold atmospheric glow */}
      <div className="absolute inset-0 rounded-full bg-black flex items-center justify-center overflow-hidden border border-zinc-900/40 shadow-2xl shadow-yellow-950/20">
        {/* Soft background radial ambient light */}
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,138,0,0.04)_0%,transparent_70%)] ${isPlaying && !isDataSaver ? 'animate-pulse' : ''}`} />
      </div>
      
      {/* Interactive Dot Grid SVG */}
      <div className="relative z-10 w-[95%] h-[95%] flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* High-fidelity glowing radial and linear color spectrums */}
            <radialGradient id="ring-glow-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbdf" />
              <stop offset="30%" stopColor="#ffb000" />
              <stop offset="70%" stopColor="#ff5500" />
              <stop offset="100%" stopColor="#bb1100" />
            </radialGradient>
            
            <linearGradient id="solid-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe57f" />
              <stop offset="50%" stopColor="#ffb300" />
              <stop offset="100%" stopColor="#ff6f00" />
            </linearGradient>

            <filter id="beauty-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Symmetrical glowing orange dots forming the eye/galaxy layout */}
          <g filter="url(#beauty-glow)">
            {rays.map((_, i) => {
              const angle = (i * 2 * Math.PI) / raysCount;
              const dotsCount = getRayDotsCount(angle);
              
              // Map individual dots along this ray
              return Array.from({ length: dotsCount }).map((_, j) => {
                // Calculate position from center (80, 80)
                // First dot (core ring) begins at r=28, outwards to max r=70
                const distance = 28 + j * 4.6;
                const roundedDistance = Number(distance.toFixed(2));
                const x = (80 + Math.cos(angle) * roundedDistance).toFixed(2);
                const y = (80 + Math.sin(angle) * roundedDistance).toFixed(2);
                
                // Color mapping: brightest on the inner rings, turning deeper orange on the pointers
                const fillRatio = j / Math.max(1, dotsCount - 1);
                // Custom dot colors mapping from cream/yellow to deep orange-red
                let dotColor = "#ffb000"; // Default vibrant orange-gold
                if (j === 0) dotColor = "#ffea79"; // Cream yellow core ring
                else if (j === 1) dotColor = "#ffa000"; // Rich orange-gold
                else if (fillRatio > 0.7) dotColor = "#e64a19"; // Ruby deep orange edge
                else if (fillRatio > 0.4) dotColor = "#ff5722"; // Bright vermilion

                // Radius scaling down as it propagates outwards
                const maxRadius = j === 0 ? 1.9 : Math.max(0.48, 1.6 - j * 0.14);
                const roundedRadius = Number(maxRadius.toFixed(2));

                // Ripple animation styling
                const delay = (j * 0.08 + i * 0.005).toFixed(2);
                const duration = isPlaying ? "1.1s" : "0s";
                const animStyle = isPlaying && !isDataSaver ? {
                  animation: `glow-dot-pulse ${duration} ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                } : undefined;

                return (
                  <circle
                    key={`${i}-${j}`}
                    cx={x}
                    cy={y}
                    r={roundedRadius}
                    fill={dotColor}
                    className="visualizer-glow-dot"
                    style={{
                      ...animStyle,
                      transformOrigin: `${x}px ${y}px`
                    }}
                  />
                );
              });
            })}
          </g>

          {/* Center decorative gold icon - elegant spinning gold core */}
          <circle cx="80" cy="80" r="21" fill="black" stroke="url(#solid-gold-grad)" strokeWidth="0.5" className="opacity-45" />
          <circle cx="80" cy="80" r="16" fill="black" />
          
          {/* Inner core emblem: micro golden sound waves inside the central area */}
          <g className={isPlaying && !isDataSaver ? 'animate-pulse' : ''} style={{ transformOrigin: '80px 80px' }}>
            <path d="M 74 80 L 74 80 M 77 76 L 77 84 M 80 72 L 80 88 M 83 75 L 83 85 M 86 80 L 86 80" stroke="url(#solid-gold-grad)" strokeWidth="1.2" strokeLinecap="round" className="opacity-80" />
          </g>
        </svg>
      </div>

      {/* Symmetrical glowing luxury outer ring */}
      <div className={`absolute inset-0 rounded-full border-2 border-orange-500/10 opacity-60 -z-10 ${isPlaying && !isDataSaver ? 'animate-pulse' : ''}`} />
    </div>
  );
};

interface PlayerProps {
  currentTrack: Music | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  trackList: Music[];
  isCarMode: boolean;
  setCarMode: (active: boolean) => void;
  onNavigate?: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  onSelectTrack?: (track: Music) => void;
}

export default function Player({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  trackList,
  isCarMode,
  setCarMode,
  onNavigate,
  onSelectTrack
}: PlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [carLyricsActive, setCarLyricsActive] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(true);
  
  // Data saver (3G/4G/5G) mode to restrict graphic re-renders and audio preloading
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('soundrive_datasaver_v2');
        if (stored !== null) return stored === 'true';
        
        // Auto cellular connection, 3G/4G/5G, and browser data saver detection
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
          const conn = (navigator as any).connection;
          
          // If the user turned on the Data Saver setting on their phone/browser
          if (conn?.saveData) {
            return true;
          }
          
          // If connection type is cellular (3G, 4G, 5G, or generic mobile data)
          if (conn?.type === 'cellular') {
            return true;
          }

          // If the connection quality is classified as typical cellular bands
          const effective = conn?.effectiveType || '';
          if (['cellular', 'slow-2g', '2g', '3g', '4g'].includes(effective)) {
            return true;
          }
        }

        // Fallback: If it's a mobile device (touch primary and screen size), default to active saver on cellular to protect user data
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
          // If we are on a smartphone, assume they might be using mobile data and gently auto-optimize to preloading metadata only
          return true;
        }
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('soundrive_datasaver_v2', isDataSaver.toString());
    } catch (e) {}
  }, [isDataSaver]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize audio element state
  useEffect(() => {
    if (!currentTrack) return;

    if (!audioRef.current) {
      audioRef.current = document.createElement('audio');
    }

    const audio = audioRef.current;
    
    // Check if source changed
    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      audio.preload = isDataSaver ? "metadata" : "auto";
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

  // Support mobile lock screen details and physical control buttons with navigator.mediaSession
  useEffect(() => {
    if (!currentTrack) return;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.somdrive.com.br';
        const brandVersion = "v=3";
        const SOMDRIVE_DEFAULT_ARTWORK = "https://www.somdrive.com.br/somdrive-player-artwork-512.png?v=3";

        const isValidArtworkUrl = (url: any): boolean => {
          if (typeof url !== 'string') return false;
          const cleaned = url.trim();
          if (cleaned.length === 0) return false;
          if (!cleaned.startsWith("https://")) return false;
          const lower = cleaned.toLowerCase();
          if (lower.includes(".svg")) return false;
          if (lower.includes("favicon") && !lower.includes("somdrive-player")) return false;
          return true;
        };

        const hasValidCover = currentTrack.coverUrl && isValidArtworkUrl(currentTrack.coverUrl);

        const artwork = [
          {
            src: hasValidCover ? currentTrack.coverUrl! : `https://www.somdrive.com.br/somdrive-player-96.png?${brandVersion}`,
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: hasValidCover ? currentTrack.coverUrl! : `https://www.somdrive.com.br/somdrive-player-128.png?${brandVersion}`,
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: hasValidCover ? currentTrack.coverUrl! : `https://www.somdrive.com.br/somdrive-player-192.png?${brandVersion}`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: hasValidCover ? currentTrack.coverUrl! : `https://www.somdrive.com.br/somdrive-player-256.png?${brandVersion}`,
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: hasValidCover ? currentTrack.coverUrl! : `https://www.somdrive.com.br/somdrive-player-384.png?${brandVersion}`,
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: hasValidCover ? currentTrack.coverUrl! : SOMDRIVE_DEFAULT_ARTWORK,
            sizes: "512x512",
            type: "image/png",
          },
        ];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || "SomDrive",
          artist: currentTrack.singer || currentTrack.composer || "SomDrive",
          album: "SomDrive - Catálogo Musical",
          artwork: artwork
        });

        navigator.mediaSession.setActionHandler('play', () => {
          onPlayPause();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          onPlayPause();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          onPrev();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          onNext();
        });
      } catch (err) {
        console.warn("navigator.mediaSession setup failed:", err);
      }
    }
  }, [currentTrack, onPlayPause, onPrev, onNext]);

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
      <div id="car-player-fullscreen" className="fixed inset-0 bg-[#04060a] text-[#f8fafc] z-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans overflow-hidden select-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes eq-bounce-1 {
            0% { transform: scaleY(0.25); }
            100% { transform: scaleY(1); }
          }
          @keyframes eq-bounce-2 {
            0% { transform: scaleY(0.4); }
            100% { transform: scaleY(1.1); }
          }
          @keyframes eq-bounce-3 {
            0% { transform: scaleY(0.15); }
            100% { transform: scaleY(0.85); }
          }
          .animate-eq-1 {
            animation: eq-bounce-1 0.45s ease-in-out infinite alternate;
            transform-origin: bottom;
          }
          .animate-eq-2 {
            animation: eq-bounce-2 0.65s ease-in-out infinite alternate;
            transform-origin: bottom;
          }
          .animate-eq-3 {
            animation: eq-bounce-3 0.55s ease-in-out infinite alternate;
            transform-origin: bottom;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1f2937;
            border-radius: 9999px;
          }
        `}} />

        {/* Specular Ambient Glow effects in Mint-Emerald and Gold-Amber */}
        <div className="absolute right-[-10%] top-[10%] w-[350px] h-[350px] bg-[#10b981]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute left-[-10%] bottom-[10%] w-[300px] h-[300px] bg-[#eab308]/5 rounded-full blur-[90px] pointer-events-none"></div>

        {/* Dynamic Header Row - Replicated precisely from Image */}
        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 z-10 w-full shrink-0 relative">
          
          {/* Left Block: TRANSMISSÃO BLUETOOTH */}
          <div className="flex items-center gap-2 select-none">
            <Bluetooth className="w-4 h-4 text-emerald-400 stroke-[2] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono tracking-[0.2em] text-emerald-400 font-extrabold uppercase">
              TRANSMISSÃO BLUETOOTH
            </span>
          </div>

          {/* Right Block: LETRAS / CELULAR action pills */}
          <div className="flex items-center gap-2 select-none">
            <button 
              onClick={() => setCarLyricsActive(!carLyricsActive)}
              className={`flex items-center gap-1.5 px-3 py-1 transition rounded-lg border text-[9px] sm:text-xs font-sans font-bold uppercase tracking-wider cursor-pointer select-none ${
                carLyricsActive 
                  ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                  : 'bg-transparent border-zinc-800 text-zinc-350 hover:border-emerald-500/50 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" /> 
              <span>LETRAS</span>
            </button>

            <button 
              id="exit-car-mode-btn"
              onClick={() => {
                setCarMode(false);
                setCarLyricsActive(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-transparent border border-zinc-800 hover:border-emerald-500/50 rounded-lg transition cursor-pointer text-[9px] sm:text-xs font-sans font-bold uppercase tracking-wider text-zinc-350 hover:text-white"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#84cc16]" /> 
              <span>CELULAR</span>
            </button>
          </div>
        </div>

        {/* Central Playback visualizer area with flanking equalizers */}
        <div className="flex-1 flex flex-col justify-center items-center my-2 max-w-lg mx-auto w-full z-10 min-h-0">
          <div className="flex items-center justify-center gap-6 w-full shrink-0">
            {/* Left audio equalizer wave block */}
            <div className="flex items-end gap-[3px] h-10 select-none text-emerald-500 shrink-0">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  style={{ height: `${8 + i * 4}px` }}
                  className={`w-[2.5px] bg-emerald-500 rounded-full ${isPlaying ? `animate-eq-${(i % 3) + 1}` : 'opacity-40'}`} 
                />
              ))}
            </div>

            {/* Central big circular orb logo with glowing green arrow */}
            <button 
              onClick={onPlayPause}
              className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 flex items-center justify-center border-2 border-zinc-900 shadow-2xl relative cursor-pointer active:scale-95 transition-all outline-none"
            >
              <div className="absolute inset-1.5 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-900/60 shadow-inner">
                <div className="relative flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-emerald-500 text-emerald-500" />
                  ) : (
                    <Play className="w-8 h-8 fill-emerald-500 text-emerald-500 ml-1.5" />
                  )}
                </div>
              </div>
            </button>

            {/* Right audio equalizer wave block */}
            <div className="flex items-end gap-[3px] h-10 select-none text-emerald-500 shrink-0">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  style={{ height: `${20 - i * 4}px` }}
                  className={`w-[2.5px] bg-emerald-500 rounded-full ${isPlaying ? `animate-eq-${((4 - i) % 3) + 1}` : 'opacity-40'}`} 
                />
              ))}
            </div>
          </div>

          <div className="text-center mt-3 shrink-0">
            <h1 className="font-heading font-black tracking-widest text-[#f8fafc] text-sm sm:text-base uppercase truncate max-w-sm px-2">
              {currentTrack.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 font-mono tracking-wide mt-0.5">
              Auto: <span className="font-bold text-zinc-300">{currentTrack.singer || currentTrack.composer || "STARNEJO"}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Content: MÚSICAS or LYRICS */}
        <div className="flex-[2] min-h-[140px] max-h-[280px] bg-[#070b12]/95 border border-zinc-900/80 rounded-2xl flex flex-col overflow-hidden max-w-md mx-auto w-full z-10 relative shadow-inner mb-3">
          {/* Header row */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-900 shrink-0 select-none">
            {carLyricsActive ? (
              <>
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">LETRA</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">MÚSICAS</span>
              </>
            )}
          </div>

          {/* Core scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-902/30">
            {carLyricsActive ? (
              <div className="p-4 space-y-3.5 text-center font-sans tracking-wide">
                {currentTrack.lyrics ? (
                  currentTrack.lyrics.split('\n').map((line, idx) => {
                    const isHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                    if (isHeader) {
                      return (
                        <p key={idx} className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-400 font-extrabold pt-2 pb-0.5">
                          {line}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs sm:text-sm font-extrabold text-zinc-300 hover:text-white leading-relaxed">
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <div className="space-y-2 py-6 flex flex-col items-center justify-center">
                    <p className="text-emerald-400 text-xs font-mono uppercase tracking-[0.15em] font-bold">[ SEM LETRA CADASTRADA ]</p>
                    <p className="text-zinc-500 text-[10px] leading-relaxed max-w-xs mx-auto">O compositor não arquivou as estrofes originais no painel.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {trackList.map((track, idx) => {
                  const isActive = track.trackId === currentTrack.trackId;
                  return (
                    <div 
                      key={track.trackId}
                      onClick={() => onSelectTrack?.(track)}
                      className={`py-3 px-4 flex items-center justify-between cursor-pointer transition-colors duration-150 relative border-b border-zinc-950/20 hover:bg-[#111e30]/30 ${
                        isActive ? 'border-l-[4px] border-emerald-500 bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Left: Play icon status, Index number, Track metadata */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isActive ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                            className="w-8 h-8 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-400 bg-emerald-950/40 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-emerald-400" /> : <Play className="w-3.5 h-3.5 fill-emerald-400 ml-0.5" />}
                          </button>
                        ) : (
                          <button 
                            className="w-8 h-8 rounded-full border border-zinc-850 hover:border-zinc-750 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 transition"
                          >
                            <Play className="w-3.5 h-3.5 fill-zinc-400 text-zinc-400 ml-0.5" />
                          </button>
                        )}

                        <span className="text-[11px] font-mono text-zinc-500 font-bold w-4 text-center select-none shrink-0">{idx + 1}</span>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase truncate ${isActive ? 'text-[#10b981]' : 'text-zinc-100'}`}>
                            {track.title}
                          </p>
                          <p className="text-[9.5px] text-zinc-500 font-mono tracking-wide truncate mt-0.5">
                            {track.singer || track.composer || "STARNEJO"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Wave anim / Ellipsis Option */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isActive && isPlaying && (
                          <div className="flex items-end gap-[1.5px] h-3 text-emerald-400 mr-1 select-none">
                            <span className="w-[1.5px] h-2.5 bg-emerald-400 rounded-full animate-eq-1" />
                            <span className="w-[1.5px] h-3.5 bg-emerald-400 rounded-full animate-eq-2" />
                            <span className="w-[1.5px] h-2 bg-emerald-400 rounded-full animate-eq-3" />
                          </div>
                        )}
                        <MoreVertical className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Timeline seeker slider bar */}
        <div className="w-full max-w-md mx-auto px-1 space-y-1 z-10 shrink-0">
          <div className="relative flex items-center">
            <input 
              id="car-track-seekbar"
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-150 accent-[#10b981]"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / (duration || 1)) * 100}%, #18181b ${(currentTime / (duration || 1)) * 100}%, #18181b 100%)`
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-450 font-bold select-none px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Music Control center knobs array (Shuffle, Prev, PlayOutlineGlow, Next, Repeat) */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-2 py-2.5 z-10 select-none shrink-0">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition duration-155 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center p-2.5 ${isShuffle ? 'text-emerald-400 animate-pulse' : 'text-zinc-450 hover:text-white'}`}
            title="Aleatório"
          >
            <Shuffle className="w-5.25 h-5.25" />
          </button>

          <button 
            onClick={onPrev}
            className="transition duration-155 hover:scale-105 active:scale-95 text-zinc-100 hover:text-emerald-450 cursor-pointer flex items-center justify-center p-2.5"
            title="Música anterior"
          >
            <SkipBack className="w-5.5 h-5.5" />
          </button>

          <button 
            onClick={onPlayPause}
            className="w-14 h-14 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)] bg-black/40"
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-emerald-400" />
            ) : (
              <Play className="w-6 h-6 text-emerald-400 ml-1" />
            )}
          </button>

          <button 
            onClick={onNext}
            className="transition duration-155 hover:scale-105 active:scale-95 text-zinc-100 hover:text-emerald-450 cursor-pointer flex items-center justify-center p-2.5"
            title="Próxima música"
          >
            <SkipForward className="w-5.5 h-5.5" />
          </button>

          <button 
            onClick={() => setIsRepeat(!isRepeat)}
            className={`transition duration-155 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center p-2.5 ${isRepeat ? 'text-emerald-400' : 'text-zinc-450 hover:text-white'}`}
            title="Repetições"
          >
            <Repeat className="w-5.25 h-5.25" />
          </button>
        </div>

        {/* Double-pill main controllers at the very footer */}
        <div className="w-full max-w-md mx-auto flex items-center gap-3.5 pt-2 z-10 select-none shrink-0 mb-1">
          <button 
            onClick={() => setCarLyricsActive(!carLyricsActive)}
            className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-xl text-xs font-mono font-bold tracking-widest w-1/2 cursor-pointer transition duration-200 outline-none ${
              carLyricsActive 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                : 'border-emerald-500/80 hover:bg-emerald-500/5 text-[#10b981]'
            }`}
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>LETRA</span>
          </button>

          <button 
            onClick={() => {
              setCarMode(false);
              setCarLyricsActive(false);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-amber-500/80 hover:bg-amber-500/5 text-amber-500 rounded-xl text-xs font-mono font-bold tracking-widest w-1/2 cursor-pointer transition duration-200 outline-none"
          >
            <Car className="w-4 h-4 stroke-[2.5]" />
            <span>CARRO</span>
          </button>
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
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#050609]/95 border-t border-zinc-800/80 backdrop-blur-2xl transition-all duration-350 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] select-none"
        style={{
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="max-w-7xl mx-auto p-4 md:py-5 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 min-h-[90px]">
          
          {/* MOBILE ONLY: Compact / Expanded Adaptive Player */}
          <div className="flex md:hidden flex-col w-full px-2">
            {!isMobileExpanded ? (
              /* PLAYER COMPACTO */
              <div 
                onClick={() => setIsMobileExpanded(true)}
                className="flex items-center justify-between w-full h-[64px] select-none cursor-pointer"
              >
                {/* Left: Mini gráfico, Título, Compositor */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Mini Gráfico */}
                  <div className="relative w-10 h-10 rounded-lg bg-[#0d0f14] border border-zinc-800 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 via-zinc-950 to-zinc-950"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:6px_8px]"></div>
                    <div className="relative flex flex-col items-center justify-center p-1 text-emerald-400 text-center z-10">
                      <div className="flex items-end gap-[1.5px] h-3.5 justify-center">
                        <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-2 animate-bar-1' : 'h-1.5'}`}></span>
                        <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-3.5 animate-bar-2' : 'h-2.5'}`}></span>
                        <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-2.5 animate-bar-3' : 'h-2'}`}></span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Compositor */}
                  <div className="min-w-0 text-left">
                    <h4 className="font-heading font-black text-xs sm:text-sm tracking-wide text-white uppercase truncate">
                      {currentTrack.title}
                    </h4>
                    <p className="text-[10px] text-[#84cc16] uppercase font-mono tracking-wider font-extrabold mt-0.5 truncate">
                      {currentTrack.singer || currentTrack.composer || "STARNEJO"}
                    </p>
                  </div>
                </div>

                {/* Right: Play/Pause button + Expand Button */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Play/Pause Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPause();
                    }}
                    className="w-10 h-10 rounded-full bg-[#050608] border border-emerald-500/85 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer outline-none"
                    title={isPlaying ? "Pausar" : "Tocar"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    )}
                  </button>

                  {/* Expand Chevron Up */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMobileExpanded(true);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl active:bg-zinc-900 transition-colors cursor-pointer"
                    title="Expandir player"
                  >
                    <ChevronDown className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              </div>
            ) : (
              /* PLAYER EXPANDIDO */
              <div className="flex flex-col w-full gap-3 py-2">
                {/* Expanded Header Control info bar */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1 select-none">
                  <span className="text-[9px] font-mono tracking-widest text-[#00e676] font-extrabold uppercase">
                    GUIA ATIVA EXPANDIDA
                  </span>
                  <button 
                    onClick={() => setIsMobileExpanded(false)}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-[#00e676] hover:text-white transition font-mono text-[10px] tracking-wider font-extrabold uppercase rounded-lg cursor-pointer select-none active:scale-95"
                  >
                    RECOLHER ✕
                  </button>
                </div>

                {/* Row 1: Graphic Disc Artwork, Title Metadata, Heart Toggler */}
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      onClick={() => setShowFicha(!showFicha)}
                      className="relative w-11 h-11 rounded-xl bg-[#0d0f14] border border-zinc-800 flex items-center justify-center shadow-md overflow-hidden shrink-0 cursor-pointer active:scale-95 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 via-zinc-950 to-zinc-950"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:6px_8px]"></div>
                      <div className="relative flex flex-col items-center justify-center p-1 text-emerald-400 text-center z-10">
                        <div className="flex items-end gap-[1.5px] h-3.5 justify-center">
                          <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-2 animate-bar-1' : 'h-1.5'}`}></span>
                          <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-3.5 animate-bar-2' : 'h-2.5'}`}></span>
                          <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-2.5 animate-bar-3' : 'h-2'}`}></span>
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        if (onNavigate && currentTrack?.artistId) {
                          onNavigate('public', { id: currentTrack.artistId });
                        }
                      }}
                      className="min-w-0 text-left cursor-pointer group/mobile-meta active:scale-97 transition-all"
                      title="Clique para voltar ao perfil do compositor"
                    >
                      <h4 id="player-track-title-mobile" className="font-heading font-extrabold text-sm tracking-tight text-white uppercase truncate leading-none group-hover/mobile-meta:text-[#d4af37]">
                        {currentTrack.title}
                      </h4>
                      <p id="player-track-artist-mobile" className="text-[10px] text-[#84cc16] uppercase font-mono tracking-wider font-extrabold mt-1.5 leading-none flex items-center gap-1.5">
                        {currentTrack.singer || "STARNEJO"}
                        <span className="text-[7.5px] font-sans font-black text-[#d4af37] whitespace-nowrap bg-amber-500/10 border border-amber-500/25 px-1.2 py-[1px] rounded leading-none shrink-0 scale-95 origin-left">
                          VOLTAR 📁
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Heart Button */}
                  <button 
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shrink-0 p-1 bg-zinc-900/30 rounded-lg"
                    title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Heart className={`w-4.5 h-4.5 transition-colors ${isFavorited ? 'fill-emerald-450 text-emerald-450 stroke-emerald-500' : 'text-zinc-500 hover:text-white'}`} />
                  </button>
                </div>

                {/* Row 2: Elegant Timeline progress bar */}
                <div className="w-full flex items-center gap-3 font-mono text-[10px] text-zinc-400 font-bold select-none">
                  <span className="w-8 text-left select-none">{formatTime(currentTime)}</span>
                  
                  <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="flex-1 h-[3px] bg-zinc-800 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-150 accent-emerald-500"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #eab308 ${(currentTime / (duration || 1)) * 100}%, #27272a ${(currentTime / (duration || 1)) * 100}%, #27272a 100%)`
                    }}
                  />
                  
                  <span className="w-8 text-right select-none">{formatTime(duration)}</span>
                </div>

                {/* Row 3: Professional Compact Controls Grid */}
                <div className="w-full flex items-center justify-between px-4 py-1 select-none">
                  {/* Shuffle */}
                  <button 
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`transition-all duration-300 hover:scale-110 cursor-pointer p-1.5 ${isShuffle ? 'text-emerald-400' : 'text-zinc-500'}`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  {/* Previous */}
                  <button 
                    onClick={onPrev}
                    className="text-zinc-300 hover:text-white transition-all p-1.5 hover:scale-110 active:scale-95 cursor-pointer outline-none" 
                  >
                    <SkipBack className="w-4.5 h-4.5" />
                  </button>

                  {/* Large Green Glowing play/pause */}
                  <button 
                    onClick={onPlayPause}
                    className="w-12 h-12 rounded-full bg-[#050608] border border-emerald-500/80 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer outline-none shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-4.5 h-4.5 fill-white text-white" />
                    ) : (
                      <Play className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
                    )}
                  </button>

                  {/* Next */}
                  <button 
                    onClick={onNext}
                    className="text-zinc-300 hover:text-white transition-all p-1.5 hover:scale-110 active:scale-95 cursor-pointer outline-none" 
                  >
                    <SkipForward className="w-4.5 h-4.5" />
                  </button>

                  {/* Repeat */}
                  <button 
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={`transition-all duration-300 hover:scale-110 cursor-pointer p-1.5 ${isRepeat ? 'text-emerald-400' : 'text-zinc-500'}`}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Row 4: Side-by-side luxurious "LETRA" and "CARRO" button pills */}
                <div className="grid grid-cols-2 gap-2 w-full mt-0.5">
                  <button 
                    onClick={() => setShowLyrics(true)}
                    className="flex items-center justify-center gap-1 py-2 bg-transparent border border-emerald-500/25 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-97"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>LETRA</span>
                  </button>

                  <button 
                    onClick={() => setCarMode(true)}
                    className="flex items-center justify-center gap-1 py-2 bg-yellow-500/10 border border-yellow-500/80 hover:border-yellow-400 text-yellow-400 hover:text-yellow-300 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-97 shadow-[0_0_10px_rgba(234,179,8,0.15)]"
                  >
                    <Car className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span>CARRO</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP/TABLET ONLY: Left Block: Perfect Soundrive Album Thumbnail & Text Metadata */}
          <div className="hidden md:flex items-center gap-4 min-w-0 w-full md:w-auto md:max-w-[30%] select-none shrink-0">
            <div className="relative w-14 h-14 rounded-lg bg-[#0d0f14] border border-zinc-955 flex items-center justify-center shadow-md overflow-hidden shrink-0 group">
              {/* Premium abstract emerald to gold gradient background like screenshot */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 via-zinc-950 to-zinc-950"></div>
              
              {/* Emerald Sound representation overlay inside block */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:8px_8px]"></div>
              
              <div className="relative flex flex-col items-center justify-center p-2 text-emerald-400 text-center z-10">
                <div className="flex items-end gap-[2px] h-4.5 justify-center mb-0.5">
                  <span className={`w-[2px] bg-gradient-to-t from-[#10b981] to-[#84cc16] rounded-full ${isPlaying && !isDataSaver ? 'h-3 animate-bar-1' : 'h-1.5'}`}></span>
                  <span className={`w-[2px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-4 animate-bar-2' : 'h-2.5'}`}></span>
                  <span className={`w-[2px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-3 animate-bar-3' : 'h-2'}`}></span>
                  <span className={`w-[2px] bg-gradient-to-t from-[#10b981] to-[#eab308] rounded-full ${isPlaying && !isDataSaver ? 'h-2 animate-bar-4' : 'h-1'}`}></span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowFicha(!showFicha)}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity duration-305 cursor-pointer z-20"
                title="Ficha técnica"
              >
                <Info className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            <div 
              onClick={() => {
                if (onNavigate && currentTrack?.artistId) {
                  onNavigate('public', { id: currentTrack.artistId });
                }
              }}
              className="min-w-0 flex-1 text-left cursor-pointer group/desktop-meta select-none"
              title="Clique para voltar ao perfil do compositor"
            >
              <div className="flex items-center gap-2.5">
                <h4 id="player-track-title" className="font-heading font-extrabold text-sm sm:text-base tracking-tight text-zinc-100 uppercase truncate leading-none group-hover/desktop-meta:text-[#d4af37]">
                  {currentTrack.title}
                </h4>
                
                {/* Heart Action button toggler */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFavorited(!isFavorited);
                  }}
                  className="transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shrink-0 p-1"
                  title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-emerald-450 text-emerald-450 stroke-emerald-500' : 'text-zinc-500 hover:text-white'}`} />
                </button>
              </div>
              
              <p id="player-track-artist" className="text-[10px] sm:text-xs text-[#84cc16] uppercase font-mono tracking-wider font-extrabold mt-1.5 leading-none flex items-center gap-2">
                {currentTrack.singer || "STARNEJO"}
                <span className="text-[8px] font-sans font-bold text-zinc-400 border border-zinc-800 rounded-full px-2 py-0.5 bg-zinc-950 group-hover/desktop-meta:border-[#d4af37]/45 group-hover/desktop-meta:text-[#d4af37] transition-all whitespace-nowrap leading-none">
                  VER COMPOSITOR 📁
                </span>
              </p>
            </div>
          </div>

          {/* DESKTOP/TABLET ONLY: Center Block: Complete exact replica playback suite */}
          <div className="hidden md:flex flex-1 w-full md:max-w-[45%] flex flex-col items-center gap-2.5">
            {/* Control buttons inside header */}
            <div className="flex items-center gap-6.5 select-none text-zinc-455">
              
              {/* Shuffle button */}
              <button 
                onClick={() => setIsShuffle(!isShuffle)}
                className={`transition-all duration-300 hover:scale-110 cursor-pointer p-1 ${isShuffle ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-305'}`}
                title="Ordem aleatória"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev button */}
              <button 
                id="prev-btn"
                onClick={onPrev}
                className="text-zinc-300 hover:text-white transition-all p-1 hover:scale-115 active:scale-90 cursor-pointer outline-none" 
                title="Música anterior"
              >
                <SkipBack className="w-4.5 h-4.5" />
              </button>

              {/* Play/Pause Button - BEAUTIFUL custom circle with green gradient outer glow outline */}
              <button 
                id="play-pause-btn"
                onClick={onPlayPause}
                className="w-12 h-12 rounded-full bg-[#050608] border border-emerald-500/50 hover:border-yellow-405 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer outline-none shrink-0"
                title={isPlaying ? "Pausar" : "Tocar"}
              >
                {isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-white text-white" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
                )}
              </button>

              {/* Next button */}
              <button 
                id="next-btn"
                onClick={onNext}
                className="text-zinc-300 hover:text-white transition-all p-1 hover:scale-115 active:scale-90 cursor-pointer outline-none" 
                title="Próxima música"
              >
                <SkipForward className="w-4.5 h-4.5" />
              </button>

              {/* Repeat button */}
              <button 
                onClick={() => setIsRepeat(!isRepeat)}
                className={`transition-all duration-300 hover:scale-110 cursor-pointer p-1 ${isRepeat ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-303'}`}
                title="Repetir faixa"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Progress seek bar mimicking reference */}
            <div className="w-full flex items-center gap-3.5 text-[11px] font-mono text-zinc-400 font-bold select-none">
              <span className="w-8 text-right select-none">{formatTime(currentTime)}</span>
              
              <input 
                id="track-seekbar"
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 h-[3px] bg-zinc-800 rounded-lg appearance-none cursor-pointer outline-none transition-all duration-150 accent-emerald-500 hover:accent-emerald-400"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #eab308 ${(currentTime / (duration || 1)) * 100}%, #27272a ${(currentTime / (duration || 1)) * 100}%, #27272a 100%)`
                }}
              />
              
              <span className="w-8 text-left select-none">{formatTime(duration)}</span>
            </div>
          </div>

          {/* DESKTOP/TABLET ONLY: Right Block: Double Option Capsules, Volume slider & wave equalizer */}
          <div className="hidden md:flex items-center justify-end gap-3.5 min-w-0 w-full md:w-auto md:max-w-[32%] shrink-0">
            
            {/* Capsule 1: Ver Letras action */}
            <button 
              onClick={() => setShowLyrics(true)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-emerald-550/20 hover:border-emerald-500 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-96"
              title="Exibir Letra"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] md:text-xs">Ver letras</span>
            </button>

            {/* Capsule 2: Modo Carro action */}
            <button 
              id="launch-car-mode-btn"
              onClick={() => setCarMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-yellow-550/20 hover:border-[#eab308] text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-96 flex-shrink-0"
              title="Ativar Modo Carro"
            >
              <Car className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] md:text-xs">Modo carro</span>
            </button>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2 select-none text-zinc-400">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-emerald-400 hover:text-white transition-colors p-1 cursor-pointer outline-none shrink-0"
                title={isMuted ? "Desativar mudo" : "Mudo"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 animate-pulse" />
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
                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer outline-none transition-all accent-emerald-500 hover:accent-emerald-400"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(isMuted ? 0 : volume) * 100}%, #27272a ${(isMuted ? 0 : volume) * 100}%, #27272a 100%)`
                }}
              />
            </div>

            {/* Micro Equalizer parallel lines animation exact match */}
            <div className="hidden min-[1100px]:flex items-end gap-[2px] h-3.5 select-none text-emerald-400 shrink-0 opacity-80 hover:opacity-100 transition-all duration-300 bg-zinc-950/20 px-1 py-0.5 rounded ml-1">
              <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-3 animate-bar-1' : 'h-1.5'}`}></span>
              <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-4.5 animate-bar-2' : 'h-3.5'}`}></span>
              <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-3.5 animate-bar-3' : 'h-2'}`}></span>
              <span className={`w-[1.5px] bg-[#10b981] rounded-full ${isPlaying && !isDataSaver ? 'h-2 animate-bar-4' : 'h-1.5'}`}></span>
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
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 py-5 text-left scroll-smooth scrollbar-none">
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
