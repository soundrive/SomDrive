import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { RecommendedToolConfig } from '../types';

interface RecommendedToolCardProps {
  config: RecommendedToolConfig;
  isPreview?: boolean;
}

export const RecommendedToolCard: React.FC<RecommendedToolCardProps> = ({ config, isPreview = false }) => {
  if (!config || (!config.active && !isPreview)) return null;

  const cardStyle = config.cardStyle || 'purple_gradient';
  const logoSize = config.logoSize || 'large';
  const buttonColor = config.buttonColor || 'purple';
  const buttonSize = config.buttonSize || 'large';

  // Card theme classes
  let cardBgClass = 'bg-gradient-to-r from-slate-950 via-purple-950/70 to-slate-950 border-2 border-purple-500/40 shadow-2xl shadow-purple-950/40 hover:border-purple-400/70';
  let logoBoxClass = 'bg-purple-950/90 border-2 border-purple-500/40 text-purple-300 shadow-md shadow-purple-950/50';
  let badgeClass = 'bg-purple-900/90 text-purple-200 border border-purple-400/40 font-bold';
  let subtitleClass = 'text-purple-300 font-bold';

  if (cardStyle === 'blue_gradient') {
    cardBgClass = 'bg-gradient-to-r from-slate-950 via-blue-950/70 to-slate-950 border-2 border-blue-500/40 shadow-2xl shadow-blue-950/40 hover:border-blue-400/70';
    logoBoxClass = 'bg-blue-950/90 border-2 border-blue-500/40 text-blue-300 shadow-md shadow-blue-950/50';
    badgeClass = 'bg-blue-900/90 text-blue-200 border border-blue-400/40 font-bold';
    subtitleClass = 'text-blue-300 font-bold';
  } else if (cardStyle === 'emerald_gradient') {
    cardBgClass = 'bg-gradient-to-r from-slate-950 via-emerald-950/70 to-slate-950 border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/40 hover:border-emerald-400/70';
    logoBoxClass = 'bg-emerald-950/90 border-2 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/50';
    badgeClass = 'bg-emerald-900/90 text-emerald-200 border border-emerald-400/40 font-bold';
    subtitleClass = 'text-emerald-300 font-bold';
  } else if (cardStyle === 'dark_premium') {
    cardBgClass = 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border-2 border-amber-500/30 shadow-2xl hover:border-amber-500/50';
    logoBoxClass = 'bg-slate-950 border-2 border-amber-500/30 text-amber-400 shadow-md';
    badgeClass = 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold';
    subtitleClass = 'text-amber-400 font-bold';
  }

  // Logo sizing classes
  let logoBoxSize = 'p-3.5 min-w-[100px] md:min-w-[140px] min-h-[72px] md:min-h-[90px]';
  let logoImgSize = 'max-h-14 md:max-h-20 max-w-[140px] md:max-w-[180px]';

  if (logoSize === 'small') {
    logoBoxSize = 'p-2 min-w-[54px] min-h-[54px]';
    logoImgSize = 'max-h-8 md:max-h-10 max-w-[90px]';
  } else if (logoSize === 'medium') {
    logoBoxSize = 'p-2.5 min-w-[80px] md:min-w-[110px] min-h-[64px] md:min-h-[76px]';
    logoImgSize = 'max-h-11 md:max-h-14 max-w-[110px] md:max-w-[140px]';
  } else if (logoSize === 'featured') {
    logoBoxSize = 'p-4 md:p-5 min-w-[120px] md:min-w-[180px] min-h-[86px] md:min-h-[110px]';
    logoImgSize = 'max-h-20 md:max-h-28 max-w-[160px] md:max-w-[240px]';
  }

  // Button styling classes
  let btnColorClass = 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 shadow-lg shadow-purple-500/30 border border-purple-300/20';
  if (buttonColor === 'cyan') {
    btnColorClass = 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/30 border border-cyan-200/30';
  } else if (buttonColor === 'emerald') {
    btnColorClass = 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-500/30 border border-emerald-200/30';
  } else if (buttonColor === 'amber') {
    btnColorClass = 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-amber-500/30 border border-amber-200/30';
  } else if (buttonColor === 'blue') {
    btnColorClass = 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 shadow-lg shadow-blue-500/30 border border-blue-300/20';
  }

  // Button size classes
  let btnSizeClass = 'px-5 py-3 md:px-6 md:py-3.5 text-xs md:text-sm rounded-xl font-heading font-black uppercase tracking-wider';
  if (buttonSize === 'normal') {
    btnSizeClass = 'px-4 py-2.5 text-xs rounded-xl font-bold uppercase tracking-wider';
  } else if (buttonSize === 'featured') {
    btnSizeClass = 'px-6 py-3.5 md:px-8 md:py-4 text-xs md:text-base rounded-2xl font-heading font-black uppercase tracking-widest shadow-xl scale-102 hover:scale-105';
  }

  return (
    <div className={`p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 backdrop-blur-md transition-all duration-300 ${cardBgClass} ${!config.active && isPreview ? 'opacity-70 border-dashed' : ''}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Logo / Image Box */}
        <div className={`rounded-2xl shrink-0 flex items-center justify-center overflow-hidden transition-all ${logoBoxClass} ${logoBoxSize}`}>
          {config.imageUrl ? (
            <img
              src={config.imageUrl}
              alt={config.title || 'Logo'}
              className={`object-contain transition-all ${logoImgSize}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-center p-1">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{config.title || 'Parceiro'}</span>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base md:text-lg font-heading font-black uppercase text-white tracking-wide">
              {config.title || 'Ferramenta Recomendada'}
            </h4>
            <span className={`px-2 py-0.5 text-[9px] md:text-[10px] uppercase font-mono tracking-wider rounded-md ${badgeClass}`}>
              Ferramenta Recomendada
            </span>
            {isPreview && !config.active && (
              <span className="px-2 py-0.5 text-[9px] bg-red-950 text-red-300 border border-red-500/40 rounded font-bold uppercase">
                (Inativo no App)
              </span>
            )}
          </div>

          {config.subtitle && (
            <p className={`text-xs md:text-sm ${subtitleClass}`}>
              {config.subtitle}
            </p>
          )}

          {config.description && (
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl">
              {config.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      {config.linkUrl && (
        <a
          href={config.linkUrl}
          target={config.openInNewTab !== false ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isPreview) {
              e.preventDefault();
            }
          }}
          className={`shrink-0 self-start md:self-center flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer ${btnColorClass} ${btnSizeClass}`}
        >
          <span>{config.buttonText || "Acessar"}</span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      )}
    </div>
  );
};
