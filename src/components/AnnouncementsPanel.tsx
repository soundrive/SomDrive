import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  X, 
  FolderSync, 
  ListCollapse 
} from 'lucide-react';
import { Announcement } from '../types';
import { dbService } from '../lib/db';
import { AnnouncementCard } from './AnnouncementCard';

export function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadActiveAnnouncements() {
      try {
        const list = await dbService.getAnnouncements(true);
        
        // Filter by date: startsAt in the past AND endsAt either null or in the future
        const now = new Date();
        const validList = list.filter(ann => {
          const starts = new Date(ann.startsAt);
          const ends = ann.endsAt ? new Date(ann.endsAt) : null;
          
          const started = starts <= now;
          const notEnded = !ends || ends >= now;
          
          return started && notEnded;
        });

        setAnnouncements(validList);
      } catch (e) {
        console.error("Error fetching announcements in panel:", e);
      } finally {
        setLoading(false);
      }
    }

    loadActiveAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-6 bg-slate-900/30 rounded-3xl border border-slate-800 animate-pulse">
        <FolderSync className="w-4 h-4 text-[#1ed760] animate-spin mr-2" />
        <span className="text-xs text-slate-400 font-mono">Carregando avisos e audições...</span>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null; // Return nothing so we don't occupy layout space if there are no announcements
  }

  // Display strategy:
  // - 1 main announcement fully expanded
  // - up to 2 compact additional announcements
  const mainAnnouncement = announcements[0];
  const additionalAnnouncements = announcements.slice(1, 3);
  const hasMoreThanThree = announcements.length > 3;

  return (
    <div id="announcements-section-panel" className="w-full space-y-3.5 mb-6">
      
      {/* Header section of notifications panel */}
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
        <h3 className="font-heading font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#1ed760]" />
          Avisos & Oportunidades ({announcements.length})
        </h3>
        {announcements.length > 1 && (
          <button 
            onClick={() => setShowAllModal(true)}
            className="text-[10px] font-mono font-bold text-[#1ed760] hover:text-white uppercase transition-colors cursor-pointer flex items-center gap-1"
          >
            <ListCollapse className="w-3.5 h-3.5" />
            Ver todos ({announcements.length})
          </button>
        )}
      </div>

      {/* Main expanded announcement */}
      {mainAnnouncement && (
        <AnnouncementCard announcement={mainAnnouncement} compact={false} />
      )}

      {/* Up to 2 compact items */}
      {additionalAnnouncements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {additionalAnnouncements.map((ann) => (
            <AnnouncementCard key={ann.id} announcement={ann} compact={true} />
          ))}
        </div>
      )}

      {/* Button if there are more than 3 */}
      {hasMoreThanThree && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAllModal(true)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all rounded-xl cursor-pointer shadow-md"
          >
            Ver mais {announcements.length - 3} avisos de audições
          </button>
        </div>
      )}

      {/* Modal containing all announcements */}
      {showAllModal && (
        <div id="view-all-announcements-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[85vh] overflow-y-auto flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div>
                <h3 className="font-heading font-black text-lg uppercase text-white tracking-tight flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#1ed760]" />
                  Avisos & Audições Ativas
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Mural de oportunidades, seleções de composições e comunicados gerais.
                </p>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scroll area */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {announcements.map((ann) => (
                <AnnouncementCard key={ann.id} announcement={ann} compact={false} />
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-805 shrink-0">
              <button 
                onClick={() => setShowAllModal(false)}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase transition rounded-xl cursor-pointer"
              >
                Fechar mural
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
