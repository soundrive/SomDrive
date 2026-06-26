import React from 'react';
import { 
  Music, 
  Award, 
  Megaphone, 
  MailOpen, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementCardProps {
  announcement: Announcement;
  compact?: boolean;
  key?: string | number;
}

export function AnnouncementCard({ announcement, compact = false }: AnnouncementCardProps) {
  const {
    title,
    type,
    summary,
    content,
    imageUrl,
    buttonText,
    buttonUrl,
    priority,
    endsAt,
  } = announcement;

  // Visual configuration based on Announcement Type
  const typeConfigs = {
    audition: {
      label: 'Audição',
      badgeClass: 'bg-emerald-950/40 text-[#1ed760] border-emerald-500/20',
      icon: Music
    },
    opportunity: {
      label: 'Oportunidade',
      badgeClass: 'bg-blue-950/40 text-blue-400 border-blue-500/20',
      icon: Award
    },
    announcement: {
      label: 'Comunicado',
      badgeClass: 'bg-amber-950/40 text-amber-400 border-amber-500/20',
      icon: Megaphone
    },
    invitation: {
      label: 'Convite',
      badgeClass: 'bg-purple-950/40 text-purple-400 border-purple-500/20',
      icon: MailOpen
    }
  };

  const config = typeConfigs[type] || typeConfigs.announcement;
  const TypeIcon = config.icon;

  // High priority style: Gold border & gold accents
  const isHighPriority = priority >= 3;
  const cardBorderClass = isHighPriority 
    ? 'border-[#d4af37]/40 shadow-lg shadow-[#d4af37]/5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-955/20' 
    : 'border-slate-800/80 hover:border-slate-700 bg-slate-900';

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const formattedEndsAt = formatDate(endsAt);

  if (compact) {
    return (
      <div 
        id={`announcement-compact-${announcement.id}`}
        className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 text-left ${cardBorderClass}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Badge & Type Icon */}
          <div className={`p-2 rounded-xl border shrink-0 ${config.badgeClass}`}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${config.badgeClass}`}>
                {config.label}
              </span>
              {isHighPriority && (
                <span className="text-[8px] font-mono font-black uppercase text-[#d4af37] bg-amber-950/30 px-1 rounded border border-[#d4af37]/20 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-current" /> Importante
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1 mt-1">
              {title}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {summary}
            </p>
          </div>
        </div>

        {/* Expiration badge / Button */}
        <div className="flex items-center gap-2 shrink-0">
          {formattedEndsAt && (
            <div className="text-right font-mono text-[9px] text-slate-500 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-850">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Até {formattedEndsAt}</span>
            </div>
          )}

          {buttonUrl && (
            <a 
              href={buttonUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[#1ed760] hover:text-white rounded-xl transition cursor-pointer flex items-center justify-center"
              title={buttonText || 'Ver detalhes'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`announcement-full-${announcement.id}`}
      className={`p-4 rounded-2xl border transition-all duration-300 ${cardBorderClass}`}
    >
      <div className="flex gap-4 items-start text-left">
        
        {/* Optional Image / Icon container */}
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            referrerPolicy="no-referrer"
            className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-lg object-cover object-center border border-slate-800 shadow-md shrink-0"
          />
        ) : (
          <div className={`w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-lg border border-slate-800/60 flex items-center justify-center shrink-0 shadow-md ${config.badgeClass}`}>
            <TypeIcon className="w-4 h-4" />
          </div>
        )}
 
        {/* Text Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
              {config.label}
            </span>
            {isHighPriority && (
              <span className="text-[9px] font-mono font-black uppercase text-[#d4af37] bg-amber-950/30 px-2 py-0.5 rounded-full border border-[#d4af37]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" /> Urgente
              </span>
            )}
            {formattedEndsAt && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded-full border border-slate-850/60 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#1ed760]" /> Prazo: {formattedEndsAt}
              </span>
            )}
          </div>
 
          <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-tight mt-1">
            {title}
          </h3>
          
          <p className="text-xs text-slate-350 leading-relaxed font-sans line-clamp-3 break-words">
            {summary}
          </p>
 
          {content && (
            <p className="text-[10px] md:text-[11px] text-slate-400 italic font-mono pt-0.5 line-clamp-2 break-words">
              {content}
            </p>
          )}
        </div>
 
        {/* Action Button */}
        {buttonUrl && (
          <div className="shrink-0 flex items-center self-center pl-2">
            <a
              href={buttonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-lg shadow-black/20 cursor-pointer ${
                isHighPriority 
                  ? 'bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black' 
                  : 'bg-[#1ed760] hover:bg-[#1db954] text-slate-950'
              }`}
            >
              <span className="hidden md:inline">{buttonText || 'Ver Detalhes'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
 
      </div>
    </div>
  );
}
