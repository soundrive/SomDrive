import React from 'react';

interface BrandLogoProps {
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  classNameText?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  iconOnly = false,
  size = 'md',
  className = '',
  classNameText = ''
}) => {
  // Size mappings
  const sizeMap = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-base',
      dWidth: 'w-4 h-4.5',
    },
    md: {
      icon: 'w-10 h-10',
      text: 'text-xl sm:text-2xl',
      dWidth: 'w-5.5 h-6',
    },
    lg: {
      icon: 'w-14 h-14',
      text: 'text-3xl sm:text-4xl',
      dWidth: 'w-8 h-8.5',
    }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Soundwave + Play Button Logo Mark */}
      <svg className={`${currentSize.icon} select-none shrink-0`} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Gradients */}
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="playGradient" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Soundwave Bars (glowing) */}
        <g filter="url(#glow)">
          {/* Left Bars */}
          <rect x="14" y="45" width="5" height="30" rx="2.5" fill="url(#waveGradient)" opacity="0.8" />
          <rect x="25" y="35" width="5" height="50" rx="2.5" fill="url(#waveGradient)" opacity="0.9" />
          <rect x="36" y="20" width="5" height="80" rx="2.5" fill="url(#waveGradient)" />
          <rect x="47" y="10" width="5" height="100" rx="2.5" fill="url(#waveGradient)" />
          
          {/* Right Bars */}
          <rect x="68" y="10" width="5" height="100" rx="2.5" fill="url(#waveGradient)" />
          <rect x="79" y="20" width="5" height="80" rx="2.5" fill="url(#waveGradient)" />
          <rect x="90" y="35" width="5" height="50" rx="2.5" fill="url(#waveGradient)" opacity="0.9" />
          <rect x="101" y="45" width="5" height="30" rx="2.5" fill="url(#waveGradient)" opacity="0.8" />
        </g>
        
        {/* Play Button Overlay with clean borders */}
        <polygon 
          points="42,35 42,85 85,60" 
          fill="url(#playGradient)" 
          stroke="#090a0f" 
          strokeWidth="3.5" 
          strokeLinejoin="round" 
          filter="url(#glow)"
        />
      </svg>
      
      {/* SomDrive Text Logotype */}
      {!iconOnly && (
        <span className={`font-heading font-black tracking-tight uppercase leading-none select-none flex items-center ${currentSize.text} ${classNameText}`}>
          <span className="text-white">Som</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 font-black tracking-tight flex items-center ml-0.5">
            {/* Custom styled "Drive" where the letter D has a play button hole inside */}
            <span className="inline-flex items-center">
              <span className="inline-block relative">
                <svg className={`${currentSize.dWidth} mr-[1px] select-none text-orange-400 self-center`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer 'D' shape path */}
                  <path d="M4 2h8c5.523 0 10 4.477 10 10s-4.477 10-10 10H4V2z" fill="currentColor" />
                  {/* Play button triangle cutout */}
                  <polygon points="9.5,7 9.5,17 17.5,12" fill="#090a0f" />
                </svg>
              </span>
              <span className="-ml-[1px] tracking-tight uppercase">rive</span>
            </span>
          </span>
        </span>
      )}
    </div>
  );
};
