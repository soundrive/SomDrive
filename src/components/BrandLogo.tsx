import React from 'react';

interface BrandLogoProps {
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  classNameText?: string;
  scale?: number;
  customLogoUrl?: string;
  showLogo?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  iconOnly = false,
  size = 'md',
  className = '',
  classNameText = '',
  scale,
  customLogoUrl = '',
  showLogo = true
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!showLogo) return null;

  // Responsive size mappings - smaller on mobile, standard on PC
  const sizeMap = {
    sm: {
      icon: 'w-5 h-5 sm:w-6 sm:h-6',
      text: 'text-sm sm:text-base',
      dWidth: 'w-3 h-3.5 sm:w-4 sm:h-4.5',
      imgMaxHeight: 'max-h-5 sm:max-h-7',
    },
    md: {
      icon: 'w-7.5 h-7.5 sm:w-10 sm:h-10',
      text: 'text-base sm:text-2xl',
      dWidth: 'w-4 h-4.5 sm:w-5.5 sm:h-6',
      imgMaxHeight: 'max-h-7.5 sm:max-h-11',
    },
    lg: {
      icon: 'w-9 h-9 sm:w-14 sm:h-14',
      text: 'text-xl sm:text-4xl',
      dWidth: 'w-5 h-5.5 sm:w-8 sm:h-8.5',
      imgMaxHeight: 'max-h-9 sm:max-h-16',
    }
  };

  const currentSize = sizeMap[size];

  if (customLogoUrl && customLogoUrl.trim() !== '') {
    // Elegant base heights for custom logo, giving a robust and well-proportioned visual
    const baseHeight = size === 'sm' ? 38 : (size === 'md' ? 56 : 76);
    
    // Scale down height on mobile ("modo inteligente se é um celular a logo tem que ser menos"):
    const mobileReduction = size === 'lg' ? 0.6 : (size === 'md' ? 0.72 : 0.85);
    const activeBaseHeight = isMobile ? Math.round(baseHeight * mobileReduction) : baseHeight;
    const computedHeight = scale ? Math.round(activeBaseHeight * scale) : activeBaseHeight;

    // Scale maximum width ceilings dynamically as well so landscape/wide logos are never cut off
    const activeMaxW = isMobile ? Math.round(480 * 0.75) : 480;
    const computedMaxW = scale ? Math.round(activeMaxW * scale) : activeMaxW;

    return (
      <div 
        className={`flex items-center ${className}`}
        style={{ display: 'inline-flex' }}
      >
        <img 
          src={customLogoUrl} 
          alt="SomDrive Logo" 
          className="object-contain select-none transition-all duration-150"
          style={{ 
            height: `${computedHeight}px`, 
            maxHeight: `${computedHeight}px`,
            maxWidth: `${computedMaxW}px`
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Apply a smart responsive scale modification for non-custom logo
  const activeScale = scale 
    ? (isMobile ? scale * 0.75 : scale) 
    : (isMobile ? 0.8 : undefined);

  const styleObj = activeScale 
    ? { transform: `scale(${activeScale})`, transformOrigin: 'left center', display: 'inline-flex' } 
    : undefined;

  return (
    <div 
      className={`flex items-center gap-2.5 ${className}`}
      style={styleObj}
    >
      {/* Brand Golden Logo Icon */}
      <svg className={`${currentSize.icon} select-none shrink-0 rounded-xl overflow-hidden`} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Seamless premium green gradient matching the new logo */}
          <linearGradient id="yellow-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#79D32E" />
            <stop offset="45%" stopColor="#1DB954" />
            <stop offset="100%" stopColor="#118F35" />
          </linearGradient>

          {/* Glowing bright ambient reflection filter */}
          <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Squircle base */}
        <rect width="512" height="512" rx="135" fill="url(#yellow-gold-grad)" />

        {/* Three vertical soundwave bars (White) */}
        <g fill="#FFFFFF">
          <rect x="102" y="215" width="20" height="82" rx="10" />
          <rect x="134" y="165" width="20" height="182" rx="10" />
          <rect x="166" y="230" width="20" height="52" rx="10" />
        </g>

        {/* Neon light green dot indicator */}
        <circle cx="166" cy="318" r="12" fill="#00E676" filter="url(#glow-effect)" />

        {/* Curly elegant 'S' path stroke */}
        <path d="M 400,180 C 400,135 350,115 300,115 C 245,115 220,150 220,205 C 220,280 390,245 390,315 C 390,370 350,395 295,395 C 240,395 210,355 210,320" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="44" 
              strokeLinecap="round" 
              strokeLinejoin="round" />
      </svg>
      
      {/* SomDrive Text Logotype */}
      {!iconOnly && (
        <span className={`font-heading font-black tracking-tight uppercase leading-none select-none flex items-center ${currentSize.text} ${classNameText}`}>
          <span className="text-white">Som</span>
          <span className="text-white font-black tracking-tight flex items-center ml-0.5">
            {/* Custom styled "Drive" where the letter D has a play button hole inside */}
            <span className="inline-flex items-center">
              <span className="inline-block relative">
                <svg className={`${currentSize.dWidth} mr-[1px] select-none text-emerald-400 self-center`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer 'D' shape path */}
                  <path d="M4 2h8c5.523 0 10 4.477 10 10s-4.477 10-10 10H4V2z" fill="currentColor" />
                  {/* Play button triangle cutout */}
                  <polygon points="9.5,7 9.5,17 17.5,12" fill="#090a0f" />
                </svg>
              </span>
              <span className="-ml-[1px] tracking-tight uppercase text-white">rive</span>
            </span>
          </span>
        </span>
      )}
    </div>
  );
};
