import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Disc, 
  Trash2, 
  Pencil,
  Copy, 
  ExternalLink, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Music, 
  Loader2, 
  ArrowLeft, 
  LogOut, 
  Calendar, 
  User, 
  Save, 
  Info,
  ChevronRight,
  Globe,
  UploadCloud,
  Link2,
  Link2Off,
  Share2,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  SlidersHorizontal,
  Check,
  FolderPlus,
  Folders,
  ListChecks,
  Square,
  CheckSquare,
  X,
  Lock,
  Folder,
  FolderClosed,
  FolderOpen,
  MoreVertical,
  MoreHorizontal
} from 'lucide-react';

const FOLDER_COLORS = [
  {
    name: 'verde_somdrive',
    primary: '#1ed760',
    border: 'border-[#1ed760]/30',
    hoverBorder: 'hover:border-[#1ed760]/60',
    glow: 'shadow-[#1ed760]/10 hover:shadow-[#1ed760]/20',
    ring: 'ring-[#1ed760]/20',
    text: 'text-[#1ed760]',
    bg: 'bg-[#121c16]',
    textAccent: 'text-[#1ed760]'
  },
  {
    name: 'dourado',
    primary: '#f59e0b',
    border: 'border-[#f59e0b]/30',
    hoverBorder: 'hover:border-[#f59e0b]/60',
    glow: 'shadow-[#f59e0b]/10 hover:shadow-[#f59e0b]/20',
    ring: 'ring-[#f59e0b]/20',
    text: 'text-[#f59e0b]',
    bg: 'bg-[#1b1611]',
    textAccent: 'text-[#f59e0b]'
  },
  {
    name: 'azul',
    primary: '#3b82f6',
    border: 'border-[#3b82f6]/30',
    hoverBorder: 'hover:border-[#3b82f6]/60',
    glow: 'shadow-[#3b82f6]/10 hover:shadow-[#3b82f6]/20',
    ring: 'ring-[#3b82f6]/20',
    text: 'text-[#3b82f6]',
    bg: 'bg-[#111623]',
    textAccent: 'text-[#3b82f6]'
  },
  {
    name: 'roxo',
    primary: '#a855f7',
    border: 'border-[#a855f7]/30',
    hoverBorder: 'hover:border-[#a855f7]/60',
    glow: 'shadow-[#a855f7]/10 hover:shadow-[#a855f7]/20',
    ring: 'ring-[#a855f7]/20',
    text: 'text-[#a855f7]',
    bg: 'bg-[#171120]',
    textAccent: 'text-[#a855f7]'
  },
  {
    name: 'ciano',
    primary: '#06b6d4',
    border: 'border-[#06b6d4]/30',
    hoverBorder: 'hover:border-[#06b6d4]/60',
    glow: 'shadow-[#06b6d4]/10 hover:shadow-[#06b6d4]/20',
    ring: 'ring-[#06b6d4]/20',
    text: 'text-[#06b6d4]',
    bg: 'bg-[#111920]',
    textAccent: 'text-[#06b6d4]'
  },
  {
    name: 'laranja',
    primary: '#f97316',
    border: 'border-[#f97316]/30',
    hoverBorder: 'hover:border-[#f97316]/60',
    glow: 'shadow-[#f97316]/10 hover:shadow-[#f97316]/20',
    ring: 'ring-[#f97316]/20',
    text: 'text-[#f97316]',
    bg: 'bg-[#1b1411]',
    textAccent: 'text-[#f97316]'
  },
  {
    name: 'cinza_premium',
    primary: '#cbd5e1',
    border: 'border-[#cbd5e1]/30',
    hoverBorder: 'hover:border-[#cbd5e1]/60',
    glow: 'shadow-[#cbd5e1]/10 hover:shadow-[#cbd5e1]/20',
    ring: 'ring-[#cbd5e1]/20',
    text: 'text-[#cbd5e1]',
    bg: 'bg-[#151920]',
    textAccent: 'text-[#cbd5e1]'
  }
];

const getFolderColor = (index: number) => {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
};

const getCategoryIcon = (index: number, color: string) => {
  const iconIdx = index % 8;
  switch (iconIdx) {
    case 0:
      // Sertanejo: Music Note
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 1:
      // Românticas: Star
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 2:
      // Inéditas: Heart
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case 3:
      // Participações: Mic
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
        </svg>
      );
    case 4:
      // Modão: Guitar
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 9.5 3-3M17.5 11l3-3M12.5 13H15M8.5 16.5C7.5 16.5 6 15 6 13.5c0-1.5 2-3 4-3s4.5.5 4.5 2.5-2 3.5-6 3.5Z" />
          <path d="M14.5 10.5 21 4" />
        </svg>
      );
    case 5:
      // Trabalhos: Playlist Lines
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h11M3 6h18M3 14h11" />
          <path d="M17 14v6" />
          <circle cx="15" cy="20" r="2" />
        </svg>
      );
    case 6:
      // Ao Vivo: Flame
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    default:
      // Outros: Ellipsis (three dots)
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
  }
};

import { Artist, Music as Track, Analytics, ShareCardSettings, Repertoire } from '../types';
import { dbService, getSafeExpirationDate } from '../lib/db';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { AnnouncementsPanel } from './AnnouncementsPanel';
import PlansScreen from './PlansScreen';
import { motion } from 'motion/react';

interface DashboardProps {
  currentUser: Artist;
  onLogout: () => void;
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  onSelectTrack: (track: Track, list: Track[]) => void;
  activeTrack: Track | null;
  isPlaying?: boolean;
}

export default function Dashboard({ 
  currentUser, 
  onLogout, 
  onNavigate, 
  onSelectTrack,
  activeTrack,
  isPlaying = false
}: DashboardProps) {
  const [profile, setProfile] = useState<Artist>(currentUser);
  const [tracks, setTracks] = useState<Track[]>([]);
  const generalSongs = tracks.filter(t => !t.repertoireId);
  const [analytics, setAnalytics] = useState<Analytics>({ artistId: currentUser.userId, viewsCount: 0, whatsappClicks: 0 });
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const [showPlanPopover, setShowPlanPopover] = useState(false);
  
  // Editing state block
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editComposer, setEditComposer] = useState('');
  const [editSinger, setEditSinger] = useState('');
  const [editPartners, setEditPartners] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  
  // Storage Upload state block
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Custom filters and ordering states requested
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New track form states
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState(currentUser.name);
  const [singer, setSinger] = useState(currentUser.name);
  const [partners, setPartners] = useState('');
  const [genre, setGenre] = useState('');
  const [desc, setDesc] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [coverOption, setCoverOption] = useState('gradient'); // gradient or custom url
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [audioOption, setAudioOption] = useState('file'); // default file upload option
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [newTrackStatus, setNewTrackStatus] = useState<'active' | 'inactive'>('active');
  const [editTrackStatus, setEditTrackStatus] = useState<'active' | 'inactive'>('active');
  const [editRepertoireId, setEditRepertoireId] = useState<string>('all_songs');
  const [formError, setFormError] = useState('');
  
  // File handlers for browser object url injection
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Composer Profile Customization States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profWhatsapp, setProfWhatsapp] = useState('');
  const [profInstagram, setProfInstagram] = useState('');
  const [profBio, setProfBio] = useState('');
  const [profGenre, setProfGenre] = useState('');
  const [profCity, setProfCity] = useState('');
  const [profState, setProfState] = useState('');
  const [profAvatarUrl, setProfAvatarUrl] = useState('');
  const [profAvatarFile, setProfAvatarFile] = useState<File | null>(null);
  const [profError, setProfError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Custom public page text states
  const [profCustomBadgeText, setProfCustomBadgeText] = useState('');
  const [profCustomContactLabel, setProfCustomContactLabel] = useState('');
  const [profCustomShareLabel, setProfCustomShareLabel] = useState('');
  const [profCustomRightBadgeTitle, setProfCustomRightBadgeTitle] = useState('');
  const [profCustomRightBadgeStatus, setProfCustomRightBadgeStatus] = useState('');
  const [profCustomRightBadgeDescription, setProfCustomRightBadgeDescription] = useState('');
  const [profCustomNoticeText, setProfCustomNoticeText] = useState('');
  const [profCustomSongsListTitle, setProfCustomSongsListTitle] = useState('');
  const [profCustomSongsListSubtitle, setProfCustomSongsListSubtitle] = useState('');

  // Tab Navigation state
  const [dashboardTab, setDashboardTab] = useState<'musics' | 'repertoires' | 'projects' | 'shares' | 'profile' | 'contact'>('musics');

  // Repertoires list & creations
  const [dashboardRepertoires, setDashboardRepertoires] = useState<Repertoire[]>([]);
  const [loadingRepertoires, setLoadingRepertoires] = useState(true);
  const [repertoiresError, setRepertoiresError] = useState<string | null>(null);
  const [isSyncingRepertoire, setIsSyncingRepertoire] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!currentUser?.userId) return;

    setLoadingRepertoires(true);
    setRepertoiresError(null);

    const q = query(
      collection(db, 'repertoires'),
      where('ownerUid', '==', currentUser.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const repsList: Repertoire[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ownerUid: data.ownerUid,
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          type: data.type || 'repertoire',
          trackIds: data.trackIds || [],
          orderedTrackIds: data.orderedTrackIds || data.trackIds || [],
          visibility: data.visibility || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Repertoire;
      });
      setDashboardRepertoires(repsList);
      setLoadingRepertoires(false);
    }, (err: any) => {
      console.error("Firestore repertoire error", {
        code: err?.code,
        message: err?.message,
        name: err?.name
      });
      console.error("Error subscribing to repertoires snapshot in Dashboard:", err);
      setRepertoiresError("Não foi possível carregar os repertórios.");
      setLoadingRepertoires(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.userId) return;

    const q = query(
      collection(db, 'songs'),
      where('ownerId', '==', currentUser.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsList: Track[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          trackId: docSnap.id || d.songId || d.trackId,
          artistId: d.ownerId || d.artistId || currentUser.userId,
          title: d.title || "",
          composer: d.composer || "",
          partners: d.partners || "",
          singer: d.performer || d.singer || "",
          performer: d.performer || d.singer || "",
          genre: d.genre || "",
          description: d.description || "",
          audioUrl: d.audioUrl || "",
          coverUrl: d.coverUrl || "",
          lyrics: d.lyrics || "",
          playsCount: d.plays !== undefined ? d.plays : (d.playsCount || 0),
          plays: d.plays !== undefined ? d.plays : (d.playsCount || 0),
          status: d.status || "active",
          storageProvider: d.storageProvider || "cloudflare_r2",
          storagePath: d.storagePath || "",
          fileSize: d.fileSize || 0,
          mimeType: d.mimeType || "audio/mpeg",
          originalFileName: d.originalFileName || "",
          audioFileId: d.audioFileId || "",
          position: d.position !== undefined ? d.position : (d.orderIndex !== undefined ? d.orderIndex : undefined),
          orderIndex: d.orderIndex !== undefined ? d.orderIndex : (d.position !== undefined ? d.position : undefined),
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : (d.updatedAt || d.createdAt || new Date().toISOString()),
          repertoireId: d.repertoireId !== undefined ? d.repertoireId : null,
          publicationDestination: d.publicationDestination || (d.repertoireId ? 'repertoire' : 'general'),
          isActive: d.isActive !== undefined ? d.isActive : (d.status !== 'inactive'),
          isPublic: d.isPublic !== undefined ? d.isPublic : true
        } as Track;
      });

      // Sort by orderIndex/position or createdAt
      setTracks(songsList.sort((a, b) => {
        const getPosVal = (t: Track) => {
          if (t.orderIndex !== undefined) return t.orderIndex;
          if (t.position !== undefined) return t.position;
          return 99999;
        };
        const posA = getPosVal(a);
        const posB = getPosVal(b);
        if (posA !== posB) return posA - posB;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }));
    }, (err) => {
      console.error("Error subscribing to songs snapshot:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [newRepName, setNewRepName] = useState('');
  const [newRepDesc, setNewRepDesc] = useState('');
  const [newRepVisibility, setNewRepVisibility] = useState<'public' | 'private'>('public');
  const [newRepType, setNewRepType] = useState<'repertoire' | 'playlist' | 'collection'>('repertoire');
  const [showCreateRep, setShowCreateRep] = useState(false);
  const [isSavingRepertoire, setIsSavingRepertoire] = useState(false);
  const [repCopiedId, setRepCopiedId] = useState<string | null>(null);
  const [editingRepertoire, setEditingRepertoire] = useState<Repertoire | null>(null);
  const [viewingRepertoireTracks, setViewingRepertoireTracks] = useState<Repertoire | null>(null);
  const [isOrganizingFolderTracks, setIsOrganizingFolderTracks] = useState(false);
  const [organizedFolderTrackIds, setOrganizedFolderTrackIds] = useState<string[]>([]);
  const [isSavingTrackOrder, setIsSavingTrackOrder] = useState(false);
  const [trackOrderError, setTrackOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingRepertoireTracks) {
      setIsOrganizingFolderTracks(false);
      setOrganizedFolderTrackIds([]);
    } else {
      const orderedIds = viewingRepertoireTracks.orderedTrackIds || viewingRepertoireTracks.trackIds || [];
      const matchedSongs = tracks.filter(t => t.repertoireId === viewingRepertoireTracks.id || orderedIds.includes(t.trackId));
      const currentValidTrackIds = matchedSongs.map(t => t.trackId);

      setOrganizedFolderTrackIds(prev => {
        if (!isOrganizingFolderTracks) {
          const orderedSongs: Track[] = [];
          const matchedMap = new Map<string, Track>(matchedSongs.map(t => [t.trackId, t]));
          
          orderedIds.forEach(id => {
            const track = matchedMap.get(id);
            if (track) {
              orderedSongs.push(track);
              matchedMap.delete(id);
            }
          });
          
          matchedMap.forEach((track: Track) => {
            orderedSongs.push(track);
          });
          
          return Array.from(new Set(orderedSongs.map(t => t.trackId)));
        } else {
          return prev.filter(id => currentValidTrackIds.includes(id));
        }
      });
    }
  }, [viewingRepertoireTracks, tracks, isOrganizingFolderTracks]);

  const handleStartOrganizing = () => {
    if (!viewingRepertoireTracks) return;

    const orderedIds = viewingRepertoireTracks.orderedTrackIds || viewingRepertoireTracks.trackIds || [];
    const currentRepertoireSongs = tracks.filter(t => 
      t.repertoireId === viewingRepertoireTracks.id || orderedIds.includes(t.trackId)
    );

    const validSongsMap = new Map<string, Track>(currentRepertoireSongs.map(t => [t.trackId, t]));
    const seenIds = new Set<string>();
    const cleanedOrderedIds: string[] = [];

    orderedIds.forEach(id => {
      if (validSongsMap.has(id) && !seenIds.has(id)) {
        cleanedOrderedIds.push(id);
        seenIds.add(id);
      }
    });

    currentRepertoireSongs.forEach(song => {
      if (!seenIds.has(song.trackId)) {
        cleanedOrderedIds.push(song.trackId);
        seenIds.add(song.trackId);
      }
    });

    setOrganizedFolderTrackIds(cleanedOrderedIds);
    setIsOrganizingFolderTracks(true);
    setTrackOrderError(null);
  };

  const handleMoveTrackUp = (index: number) => {
    if (index <= 0) return;
    setOrganizedFolderTrackIds(prev => {
      const nextIds = [...prev];
      const temp = nextIds[index];
      nextIds[index] = nextIds[index - 1];
      nextIds[index - 1] = temp;
      return nextIds;
    });
  };

  const handleMoveTrackDown = (index: number) => {
    setOrganizedFolderTrackIds(prev => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const nextIds = [...prev];
      const temp = nextIds[index];
      nextIds[index] = nextIds[index + 1];
      nextIds[index + 1] = temp;
      return nextIds;
    });
  };

  const handleSaveTrackOrder = async () => {
    if (!viewingRepertoireTracks) return;
    setIsSavingTrackOrder(true);
    setTrackOrderError(null);

    try {
      const uniqueOrderedTrackIds = Array.from(new Set(organizedFolderTrackIds));
      const updatedRep: Repertoire = {
        ...viewingRepertoireTracks,
        orderedTrackIds: uniqueOrderedTrackIds,
        updatedAt: new Date().toISOString()
      };

      await dbService.saveRepertoire(updatedRep);
      
      setViewingRepertoireTracks(updatedRep);
      setIsOrganizingFolderTracks(false);
      setToastMessage("Ordem das faixas salva com sucesso.");
    } catch (err: any) {
      console.error("Error saving track order:", err);
      setTrackOrderError("Falha ao salvar a nova ordem das faixas. Tente novamente.");
    } finally {
      setIsSavingTrackOrder(false);
    }
  };
  const [managingRepTrackId, setManagingRepTrackId] = useState<string | null>(null); // Repertoire ID for checkboxes modal
  const [openMenuRepId, setOpenMenuRepId] = useState<string | null>(null);

  // Projects list & creations
  const [dashboardProjects, setDashboardProjects] = useState<any[]>([]);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStatus, setNewProjStatus] = useState<'draft' | 'ongoing' | 'published'>('ongoing');
  const [showCreateProj, setShowCreateProj] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [managingProjTrackId, setManagingProjTrackId] = useState<string | null>(null); // Project ID for checkboxes modal

  // User details type of profile addition
  const [profUserType, setProfUserType] = useState('');

  // 6-step Wizard Upload states
  const [uploadStep, setUploadStep] = useState<number>(1);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [organizationOption, setOrganizationOption] = useState<'all_songs' | 'existing_repertoire' | 'new_repertoire' | 'each_separately'>('all_songs');
  const [selectedRepertoireIds, setSelectedRepertoireIds] = useState<string[]>([]);
  const [newRepertoireName, setNewRepertoireName] = useState('');
  const [newRepertoireDesc, setNewRepertoireDesc] = useState('');
  const [newRepertoireType, setNewRepertoireType] = useState<'repertoire' | 'playlist' | 'collection' | 'project'>('repertoire');
  const [newRepertoireVisibility, setNewRepertoireVisibility] = useState<'public' | 'private'>('public');
  const [trackSpecificOrganization, setTrackSpecificOrganization] = useState<Record<string, { option: 'all_songs' | 'existing' | 'new'; selectedRepIds?: string[]; newRepName?: string }>>({});

  // Direct Repertoire Quick Association modal states
  const [selectedTrackForRepAction, setSelectedTrackForRepAction] = useState<Track | null>(null);
  const [showRepActionModal, setShowRepActionModal] = useState(false);
  const [activeTrackRepCheckboxes, setActiveTrackRepCheckboxes] = useState<Record<string, boolean>>({});

  // Interactive Reorder Tracks states
  const [reorderRepertoire, setReorderRepertoire] = useState<Repertoire | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Custom multi-selection sharing in Shares and Dissemination Tab
  const [selectedTracksForCustomShare, setSelectedTracksForCustomShare] = useState<string[]>([]);



  // Warnings system for upcoming or post expiration cases
  const getPlanExpiryWarnings = () => {
    const endsAtStr = profile.subscriptionEndsAt || profile.trialEndsAt || profile.manualAccessEndsAt;
    if (!endsAtStr) return null;

    const now = new Date();
    const endsAt = new Date(endsAtStr);
    const diffMs = endsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const isExpired = diffMs < 0;
    const elapsedDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const daysUntilDeletion = 30 - elapsedDays;

    if (!isExpired) {
      if (diffDays <= 7 && diffDays >= 0) {
        let warnText = "";
        if (diffDays === 7) warnText = "Faltam exatamente 7 dias para o vencimento do seu plano.";
        else if (diffDays === 3) warnText = "Faltam exatamente 3 dias para o vencimento do seu plano.";
        else if (diffDays === 1) warnText = "Falta exatamente 1 dia para o vencimento do seu plano (Vence amanhã!).";
        else if (diffDays === 0) warnText = "Seu plano vence HOJE! Renove agora para evitar o bloqueio do seu catálogo.";
        else warnText = `Seu plano está próximo do vencimento (restam ${diffDays} dias).`;

        return {
          type: 'warn_near_expiry',
          title: "Aviso importante de vencimento ⚠️",
          message: `${warnText} Escolha as 3 músicas que deseja manter ativas caso não renove.`,
          showSelector: true,
          actionButton: true,
          buttonText: "RENOVAR PLANO"
        };
      }
    } else {
      if (elapsedDays <= 5) {
        let deletionCountdown = "";
        if (daysUntilDeletion === 15) deletionCountdown = " Faltam 15 dias para a exclusão definitiva de seus arquivos.";
        else if (daysUntilDeletion === 5) deletionCountdown = " ATENÇÃO: Restam apenas 5 dias para a exclusão definitiva!";
        else if (daysUntilDeletion === 1) deletionCountdown = " CRÍTICO: Resta apenas 1 dia para a exclusão definitiva!";

        return {
          type: 'expired_1_to_5',
          title: "Seu plano venceu ⚠️",
          message: `Seu plano venceu. As músicas acima do limite gratuito estão temporariamente indisponíveis. Renove para restaurar todo o seu catálogo.${deletionCountdown}`,
          showSelector: true,
          actionButton: true,
          buttonText: "RENOVAR PLANO"
        };
      } else if (elapsedDays < 30) {
        let deletionCountdown = "";
        if (daysUntilDeletion === 15) deletionCountdown = " Faltam exatamente 15 dias para a exclusão definitiva.";
        else if (daysUntilDeletion === 5) deletionCountdown = " IMPORTANTE: Faltam exatamente 5 dias para a exclusão definitiva.";
        else if (daysUntilDeletion === 1) deletionCountdown = " URGENTE: Falta apenas 1 dia para a exclusão definitiva!";

        const deletionDate = new Date(endsAt.getTime() + 30 * 24 * 3600 * 1000).toLocaleDateString('pt-BR');

        return {
          type: 'expired_6_to_29',
          title: "Músicas Excedentes Bloqueadas 🔒",
          message: `Seis arquivos excedentes estão armazenados temporariamente. Renove até ${deletionDate} para evitar a exclusão definitiva de seus arquivos em MP3.${deletionCountdown}`,
          showSelector: true,
          actionButton: true,
          buttonText: "RENOVAR PLANO"
        };
      } else {
        return {
          type: 'expired_over_30',
          title: "Músicas Excedentes Removidas 🗑️",
          message: `O prazo de 30 dias de segurança terminou e seus arquivos excedentes foram excluídos permanentemente por falta de renovação. Seus dados cadastrais e as 3 faixas mantidas permanecem totalmente ativos e preservados.`,
          showSelector: false,
          actionButton: false
        };
      }
    }

    return null;
  };

  const handleToggleTrackPreference = async (trackId: string) => {
    const currentPreferred = profile.preferredFreeTracks || [];
    let nextPreferred = [...currentPreferred];
    
    if (nextPreferred.includes(trackId)) {
      nextPreferred = nextPreferred.filter(id => id !== trackId);
    } else {
      if (nextPreferred.length >= 3) {
        setToastMessage("Você pode selecionar no máximo 3 músicas.");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      nextPreferred.push(trackId);
    }
    
    const updatedProfile = { ...profile, preferredFreeTracks: nextPreferred };
    setProfile(updatedProfile);
    
    try {
      await dbService.updateArtistProfileLocallyAndFirestore(profile.userId, updatedProfile);
      const evaluated = dbService.checkAndRevertExpiredAccess(updatedProfile);
      setProfile(evaluated);
      const freshTracks = dbService.getArtistMusics(profile.userId);
      setTracks(freshTracks);
      setToastMessage("Seleção de preferência atualizada com sucesso!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error("Error saving preferred free tracks:", e);
    }
  };

  const handleOpenProfileModal = () => {
    setProfName(profile.name || '');
    setProfEmail(profile.email || '');
    setProfWhatsapp(profile.whatsapp || profile.phone || '');
    setProfInstagram(profile.instagram || '');
    setProfBio(profile.bio || '');
    setProfGenre(profile.genre || profile.mainGenre || '');
    setProfCity(profile.city || '');
    setProfState(profile.state || '');
    setProfAvatarUrl(profile.avatarUrl || '');
    setProfAvatarFile(null);
    setProfError('');

    // Custom texts
    setProfCustomBadgeText(profile.customBadgeText || '');
    setProfCustomContactLabel(profile.customContactLabel || '');
    setProfCustomShareLabel(profile.customShareLabel || '');
    setProfCustomRightBadgeTitle(profile.customRightBadgeTitle || '');
    setProfCustomRightBadgeStatus(profile.customRightBadgeStatus || '');
    setProfCustomRightBadgeDescription(profile.customRightBadgeDescription || '');
    setProfCustomNoticeText(profile.customNoticeText || '');
    setProfCustomSongsListTitle(profile.customSongsListTitle || '');
    setProfCustomSongsListSubtitle(profile.customSongsListSubtitle || '');

    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) {
      setProfError('O nome artístico é de preenchimento obrigatório.');
      return;
    }
    if (!profEmail.trim()) {
      setProfError('O e-mail é de preenchimento obrigatório.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfError('');

      let avatarUrl = profAvatarUrl;
      if (profAvatarFile) {
        try {
          avatarUrl = await dbService.uploadAvatar(profile.userId, profAvatarFile);
        } catch (uploadErr: any) {
          console.error("Erro no processamento do avatar:", uploadErr);
          setProfError("Não foi possível salvar sua foto. Tente novamente.");
          setIsSavingProfile(false);
          return;
        }
      }

      const updatedProfile = dbService.updateArtistProfile(profile.userId, {
        name: profName.trim(),
        email: profEmail.trim(),
        whatsapp: profWhatsapp.trim(),
        phone: profWhatsapp.trim(),
        instagram: profInstagram.trim(),
        bio: profBio.trim(),
        genre: profGenre.trim(),
        city: profCity.trim(),
        state: profState.trim().toUpperCase().slice(0, 2),
        avatarUrl: avatarUrl,
        
        customBadgeText: profCustomBadgeText.trim(),
        customContactLabel: profCustomContactLabel.trim(),
        customShareLabel: profCustomShareLabel.trim(),
        customRightBadgeTitle: profCustomRightBadgeTitle.trim(),
        customRightBadgeStatus: profCustomRightBadgeStatus.trim(),
        customRightBadgeDescription: profCustomRightBadgeDescription.trim(),
        customNoticeText: profCustomNoticeText.trim(),
        customSongsListTitle: profCustomSongsListTitle.trim(),
        customSongsListSubtitle: profCustomSongsListSubtitle.trim()
      });

      setProfile(updatedProfile);
      setShowProfileModal(false);
      refreshData();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setProfError(err.message || 'Erro ao salvar alterações no seu perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Load tracks & analytics
  const refreshData = () => {
    const artistData = dbService.getArtist(currentUser.userId) || currentUser;
    setProfile(artistData);
    setTracks(dbService.getArtistMusics(currentUser.userId));
    setAnalytics(dbService.getAnalytics(currentUser.userId));

    // Warm up Projects from LocalStorage/Cache instantly
    const localKeyProj = `somdrive_projects_${currentUser.userId}`;
    const cachedProjs = localStorage.getItem(localKeyProj);
    if (cachedProjs) {
      setDashboardProjects(JSON.parse(cachedProjs));
    }

    // Refresh concurrently in the background from Firestore
    dbService.getProjects(currentUser.userId).then(projs => {
      if (projs) setDashboardProjects(projs);
    });
  };

  const handleMoveTrack = async (trackId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const trackIdx = tracks.findIndex(t => t.trackId === trackId);
    if (trackIdx === -1) return;

    const newIdx = direction === 'up' ? trackIdx - 1 : trackIdx + 1;
    if (newIdx < 0 || newIdx >= tracks.length) return;

    const newTracks = [...tracks];
    const [movedTrack] = newTracks.splice(trackIdx, 1);
    newTracks.splice(newIdx, 0, movedTrack);

    // Set updated local state index sequentially
    const orderedIds = newTracks.map(t => t.trackId);
    try {
      setTracks(newTracks.map((t, idx) => ({ ...t, position: idx, orderIndex: idx })));
      await dbService.saveMusicOrder(profile.userId, orderedIds);
      refreshData();
      
      // Show success toast
      setToastMessage("Ordem das músicas atualizada.");
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Erro ao reordenar faixa:", err);
    }
  };

  useEffect(() => {
    refreshData();
    // Synchronize newest changes in the background from Firestore
    dbService.syncArtistData(currentUser.userId).then((success) => {
      if (success) {
        refreshData();
      }
    });
  }, [currentUser]);

  const getPlanTracksLimit = (plan: string) => {
    const pLower = (plan || 'free').toLowerCase();
    if (pLower === 'essencial') return 10;
    if (pLower === 'pro') return 15;
    if (pLower === 'premium') return 50;
    return profile.musicLimit || 3;
  };
  const limitCount = getPlanTracksLimit(profile.plan);

  const getExpiryLabelAndDate = () => {
    const date = getSafeExpirationDate(profile);
    if (!date) return null;

    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formattedLongDate = date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const accessType = profile.accessType || 'free';
    
    let label = "Válido até";
    if (accessType === 'trial') {
      label = "Período de teste válido até";
    } else if (accessType === 'manual') {
      label = "Acesso liberado até";
    }

    return {
      date,
      formattedDate,
      formattedLongDate,
      label,
      fullText: `${label}: ${formattedDate}`
    };
  };

  const getPlanStatus = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return "Processando vencimento";
    }
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return "Vence em breve";
    }
    
    return "Ativo";
  };

  const expiryInfo = getExpiryLabelAndDate();
  const planDisplayStatus = expiryInfo ? getPlanStatus(expiryInfo.date) : null;

  const handleCopyLink = async () => {
    const slugifyStr = (text: string) => {
      return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    let slug = profile.slug;
    if (!slug) {
      const nameToUse = (profile.name || profile.artistName || "artista").trim();
      slug = slugifyStr(nameToUse);
      dbService.updateArtistProfile(profile.userId, { slug });
      setProfile({ ...profile, slug });
    }

    const appBaseUrl = window.location.origin;
    const pageUrl = `${appBaseUrl}/s/${slug}`;
    navigator.clipboard.writeText(pageUrl);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    const slugifyStr = (text: string) => {
      return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    let slug = profile.slug;
    if (!slug) {
      const nameToUse = (profile.name || profile.artistName || "artista").trim();
      slug = slugifyStr(nameToUse);
      dbService.updateArtistProfile(profile.userId, { slug });
      setProfile({ ...profile, slug });
    }

    const appBaseUrl = window.location.origin;
    const pageUrl = `${appBaseUrl}/s/${slug}`;
    const messageText = `🎧 Ouça meu catálogo musical no SomDrive.\n\nAqui estão minhas composições disponíveis:\n${pageUrl}`;
    const urlEncoded = encodeURIComponent(messageText);
    
    // Increment WhatsApp counter safely
    dbService.incrementAnalyticsView(profile.userId, false, true).catch((e) => {
      console.error("Firestore error tracking dashboard share:", e);
    });
    
    window.open(`https://wa.me/?text=${urlEncoded}`, '_blank');
  };

  const handleUpgradePlan = () => {
    const nextPlan = profile.plan === 'free' ? 'premium' : 'free';
    const updated = dbService.updateArtistProfile(profile.userId, { plan: nextPlan });
    setProfile(updated);
    setUpgradeSuccess(true);
    setTimeout(() => setUpgradeSuccess(false), 2500);
  };

  // Predefined gorgeous cover gradients in case no cover file is selected
  const PRESET_COVERS = [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
    "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500",
  ];

  const uploadAudioToR2 = async (
    userId: string,
    songId: string,
    file: File,
    onProgress: (percent: number) => void
  ): Promise<{ publicAudioUrl: string; storagePath: string }> => {
    const fileType = file.type || "audio/mpeg";

    // 1. Tentar fazer o upload robusto usando o proxy local para evitar qualquer erro de CORS ou PUT direto do navegador
    let proxyErrorMessage = "";
    try {
      console.log("Iniciando tentativa de upload super-seguro via proxy local (CORS-Bypass)...");
      onProgress(30);
      const proxyResponse = await fetch("/api/r2-proxy-upload", {
        method: "POST",
        headers: {
          "X-File-Name": encodeURIComponent(file.name),
          "X-File-Type": fileType,
          "X-File-Size": file.size.toString(),
          "X-User-Id": userId,
          "X-Song-Id": songId,
        },
        body: file, // Envia o binário bruto do arquivo
      });

      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        console.log("Upload via Proxy concluído com sucesso total!", proxyData);
        onProgress(100);
        return {
          publicAudioUrl: proxyData.publicAudioUrl,
          storagePath: proxyData.storagePath,
        };
      } else {
        const proxyJson = await proxyResponse.json().catch(() => null);
        proxyErrorMessage = proxyJson?.error || `Falha de proxy HTTP ${proxyResponse.status}`;
        console.warn(`Tentativa via Proxy falhou. Usando fallback presigned. Detalhe: ${proxyErrorMessage}`);
      }
    } catch (proxyError: any) {
      proxyErrorMessage = proxyError?.message || "Erro de conexão com o proxy local";
      console.warn("Falha de rede/conexão na tentativa via Proxy, usando fallback presigned:", proxyError);
    }

    // 2. FALLBACK: Fluxo de upload original via URL Presignada de PUT direto para o bucket R2
    console.log("Iniciando fluxo de fallback (URL Presignada S3)...");
    let response;
    try {
      response = await fetch("/api/r2-presigned-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
          userId,
          songId,
        }),
      });
    } catch (e: any) {
      console.error("erro ao chamar rota R2:", e);
      throw new Error(`step:presigned_url_fetch_failed:proxy_error:${proxyErrorMessage}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detailedMessage = errorData?.error || "Falha na geração";
      console.error("resposta da rota (R2 presigned upload falhou):", response.status, errorData);
      throw new Error(`step:presigned_url_generation_failed:proxy_error:${proxyErrorMessage}:detailed:${detailedMessage}`);
    }

    let uploadUrl, storagePath, publicAudioUrl;
    try {
      const resData = await response.json();
      uploadUrl = resData.uploadUrl;
      storagePath = resData.storagePath;
      publicAudioUrl = resData.publicAudioUrl;
    } catch (e: any) {
      console.error("erro ao decodificar JSON da rota R2:", e);
      throw new Error(`step:presigned_url_generation_failed:json_parse_error:proxy_error:${proxyErrorMessage}`);
    }

    // Adicionar logs detalhados no front-end antes do PUT:
    console.log("Enviando MP3 para R2 (Fallback PUT)", {
      uploadUrl: uploadUrl ? uploadUrl.substring(0, 80) + "..." : "",
      fileType: fileType,
      fileSize: file.size,
      fileName: file.name
    });
    console.log("Início da uploadUrl para confirmar endpoint R2:", uploadUrl ? uploadUrl.split('?')[0] : '');

    onProgress(50); // Set progress to 50% visually before putting

    // Upload direto do binário para o Cloudflare R2 usando PUT via fetch (no extra headers)
    try {
      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": fileType
        },
        body: file
      });

      if (putResponse.ok) {
        console.log("Upload PUT direto para R2 (Fallback) concluído com sucesso!");
        onProgress(100);
        return { publicAudioUrl, storagePath };
      } else {
        const responseText = await putResponse.text().catch(() => "Sem resposta textual");
        console.error("Erro PUT R2", {
          status: putResponse.status,
          statusText: putResponse.statusText,
          responseText,
          fileType: fileType,
          fileSize: file.size,
          fileName: file.name
        });
        throw new Error(`step:r2_upload_put_failed_status_real:${putResponse.status}:${putResponse.statusText || "Error"}:${responseText}`);
      }
    } catch (e: any) {
      console.error("erro do PUT para R2 rede:", e);
      if (e.message && e.message.startsWith("step:r2_upload_put_failed_status_real")) {
        throw e;
      }
      throw new Error(`step:r2_upload_put_failed_network:proxy_error:${proxyErrorMessage}`);
    }
  };

  const computeSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleAddMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (tracks.length + audioFiles.length > limitCount) {
      setFormError(`Limite de plano excedido. Seu limite total é de ${limitCount} músicas.`);
      setShowAddForm(false);
      setShowLimitPrompt(true);
      return;
    }

    if (audioOption === 'file' && audioFiles.length === 0) {
      setFormError('Por favor, selecione pelo menos um arquivo de áudio MP3 para enviar.');
      return;
    }

    // Formats & sizes check
    if (audioOption === 'file') {
      for (const file of audioFiles) {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        const mimeLower = file.type.toLowerCase();
        const isMp3Mime = mimeLower === 'audio/mpeg' || mimeLower === 'audio/mp3' || mimeLower === 'audio/x-mpeg' || mimeLower === 'audio/x-mp3' || mimeLower === 'audio/mpeg3';
        const isMp3Ext = fileExt === '.mp3';

        if (!isMp3Mime && !isMp3Ext) {
          setFormError(`O arquivo "${file.name}" não é um MP3 válido. Converta para MP3 antes do envio.`);
          return;
        }

        const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;
        if (file.size > MAX_AUDIO_SIZE_BYTES) {
          setFormError(`Este arquivo possui mais de 6 MB. Converta a música para MP3 em 96 ou 128 kbps e tente novamente.`);
          return;
        }
      }
    } else {
      if (!title.trim()) {
        setFormError('O título da música é obrigatório.');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      // Helper function to create repertoire dynamically
      const createNewRepertoireInFirestore = async (name: string, desc: string, type: 'repertoire' | 'playlist' | 'collection' | 'project', visibility: 'public' | 'private', initialTrackIds: string[] = []) => {
        const repId = `rep_${Date.now().toString(36) + Math.random().toString(36).substring(2, 7)}`;
        const newRep: Repertoire = {
          id: repId,
          ownerUid: profile.userId,
          name: name.trim(),
          description: desc.trim(),
          type: type,
          trackIds: initialTrackIds,
          orderedTrackIds: initialTrackIds,
          visibility: (visibility as string) === 'active' ? 'public' : visibility,
          createdAt: new Date().toISOString()
        };
        await dbService.saveRepertoire(newRep);
        return repId;
      };

      // 1. Create main batch repertoire if needed
      let batchNewRepId = "";
      if (organizationOption === 'new_repertoire' && newRepertoireName.trim()) {
        batchNewRepId = await createNewRepertoireInFirestore(
          newRepertoireName,
          newRepertoireDesc,
          newRepertoireType,
          newRepertoireVisibility
        );
      }

      const repToTracksMap: Record<string, string[]> = {}; // repertoireId -> trackIds[]

      // Cover image logic configuration
      let finalCover = PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)];
      if (coverFile) {
        setUploadProgress(10);
        finalCover = await dbService.uploadFile(profile.userId, coverFile, 'cover', (p) => setUploadProgress(prev => Math.max(prev, p)));
      } else if (coverOption === 'url' && customCoverUrl.trim()) {
        finalCover = customCoverUrl.trim();
      }

      // Loop over files to save
      if (audioOption === 'file') {
        for (let i = 0; i < audioFiles.length; i++) {
          const file = audioFiles[i];
          const uniqueId = `track-${Math.floor(Math.random() * 89999) + 10000}`;
          
          const fileBaseProgress = Math.round((i / audioFiles.length) * 80);
          const fileProgressWeight = 80 / audioFiles.length;
          setUploadProgress(fileBaseProgress + 10);

          // Compute File Hash (SHA-256)
          let computedHashHex = "";
          try {
            computedHashHex = await computeSHA256(file);
          } catch (err) {
            console.error("Hash derivation failed: ", err);
          }

          // Deduplication check
          let existingAudioFile = null;
          if (computedHashHex) {
            existingAudioFile = await dbService.findAudioFileByHash(computedHashHex);
          }

          let finalAudio = "";
          let r2StoragePath = "";
          let r2MimeType = file.type || "audio/mpeg";
          let r2FileSize = file.size;
          let r2OriginalName = file.name;
          let r2StorageProvider = "cloudflare_r2";
          let calculatedAudioFileId = "";

          if (existingAudioFile) {
            finalAudio = existingAudioFile.audioUrl;
            r2StoragePath = existingAudioFile.storagePath;
            calculatedAudioFileId = existingAudioFile.id;
            await dbService.incrementAudioFileUsage(existingAudioFile.id);
          } else {
            const uploadResult = await uploadAudioToR2(
              profile.userId,
              uniqueId,
              file,
              (percent) => {
                const filePercent = Math.round(fileBaseProgress + ((percent / 100) * fileProgressWeight));
                setUploadProgress(Math.min(90, filePercent + 10));
              }
            );
            finalAudio = uploadResult.publicAudioUrl;
            r2StoragePath = uploadResult.storagePath;
            calculatedAudioFileId = `file-${Math.floor(Math.random() * 89999) + 10000}`;

            const newAudioFileObject = {
              id: calculatedAudioFileId,
              audioHash: computedHashHex,
              audioUrl: finalAudio,
              storagePath: r2StoragePath,
              fileSize: r2FileSize,
              mimeType: r2MimeType,
              originalFileName: r2OriginalName,
              createdBy: profile.userId,
              usageCount: 1,
              createdAt: new Date().toISOString()
            };
            await dbService.createAudioFile(calculatedAudioFileId, newAudioFileObject);
          }

          // Song Title
          const songTitle = audioFiles.length === 1 && title.trim() 
            ? title.trim() 
            : file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();

          // Decide target repertoires
          let targetRepIds: string[] = [];
          if (organizationOption === 'all_songs') {
            targetRepIds = [];
          } else if (organizationOption === 'existing_repertoire') {
            targetRepIds = selectedRepertoireIds;
          } else if (organizationOption === 'new_repertoire') {
            if (batchNewRepId) {
              targetRepIds = [batchNewRepId];
            }
          } else if (organizationOption === 'each_separately') {
            const spec = trackSpecificOrganization[file.name] || { option: 'all_songs' };
            if (spec.option === 'existing') {
              targetRepIds = spec.selectedRepIds || [];
            } else if (spec.option === 'new' && spec.newRepName?.trim()) {
              const itemNewRepId = await createNewRepertoireInFirestore(
                spec.newRepName,
                "Criado no upload múltiplo individualizado",
                'repertoire',
                'public'
              );
              targetRepIds = [itemNewRepId];
            }
          }

          const finalRepId = targetRepIds.length > 0 ? targetRepIds[0] : null;
          const pubDest = finalRepId ? "repertoire" : "general";

          await dbService.addMusic(profile.userId, {
            trackId: uniqueId,
            artistId: profile.userId,
            title: songTitle,
            composer: composer.trim() || profile.name,
            singer: singer.trim() || profile.name,
            performer: singer.trim() || profile.name,
            genre: genre.trim() || profile.genre || 'Sertanejo',
            description: desc.trim() || 'Faixa exclusiva em exibição para ouvintes.',
            audioUrl: finalAudio,
            coverUrl: finalCover,
            lyrics: lyrics.trim(),
            plays: 0,
            status: newTrackStatus,
            storageProvider: r2StorageProvider,
            storagePath: r2StoragePath,
            fileSize: r2FileSize,
            mimeType: r2MimeType,
            originalFileName: r2OriginalName,
            audioFileId: calculatedAudioFileId,
            partners: partners.trim(),
            audioHash: computedHashHex,
            repertoireId: finalRepId,
            publicationDestination: pubDest,
            isActive: newTrackStatus === 'active',
            isPublic: true
          });

          // Reference tracking
          targetRepIds.forEach(repId => {
            if (!repToTracksMap[repId]) {
              repToTracksMap[repId] = [];
            }
            repToTracksMap[repId].push(uniqueId);
          });
        }
      } else {
        // Individual URL-linked creation fallback
        const uniqueId = `track-${Math.floor(Math.random() * 89999) + 10000}`;
        let finalAudio = customAudioUrl.trim() || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        let r2OriginalName = "custom_url_link.mp3";
        let r2StoragePath = "custom-external";
        let r2MimeType = "audio/mpeg";
        let r2FileSize = 0;
        let r2StorageProvider = "external_link";
        let calculatedAudioFileId = `file-ext-${Math.floor(Math.random() * 89999) + 10000}`;

        // Link with selected repertoires directly if configured
        let targetRepIds: string[] = [];
        if (organizationOption === 'existing_repertoire') {
          targetRepIds = selectedRepertoireIds;
        } else if (organizationOption === 'new_repertoire' && batchNewRepId) {
          targetRepIds = [batchNewRepId];
        }

        const finalRepId = targetRepIds.length > 0 ? targetRepIds[0] : null;
        const pubDest = finalRepId ? "repertoire" : "general";

        await dbService.addMusic(profile.userId, {
          trackId: uniqueId,
          artistId: profile.userId,
          title: title.trim(),
          composer: composer.trim() || profile.name,
          singer: singer.trim() || profile.name,
          performer: singer.trim() || profile.name,
          genre: genre.trim() || profile.genre || 'Sertanejo',
          description: desc.trim() || 'Faixa exclusiva em divulgação.',
          audioUrl: finalAudio,
          coverUrl: finalCover,
          lyrics: lyrics.trim(),
          plays: 0,
          status: newTrackStatus,
          storageProvider: r2StorageProvider,
          storagePath: r2StoragePath,
          fileSize: r2FileSize,
          mimeType: r2MimeType,
          originalFileName: r2OriginalName,
          audioFileId: calculatedAudioFileId,
          partners: partners.trim(),
          audioHash: "",
          repertoireId: finalRepId,
          publicationDestination: pubDest,
          isActive: newTrackStatus === 'active',
          isPublic: true
        });
        
        targetRepIds.forEach(repId => {
          if (!repToTracksMap[repId]) {
            repToTracksMap[repId] = [];
          }
          repToTracksMap[repId].push(uniqueId);
        });
      }

      setUploadProgress(92);

      // Now update target repertoires in Firestore/State
      for (const repId of Object.keys(repToTracksMap)) {
        const queryReps = await dbService.getRepertoires(profile.userId);
        const existingRep = queryReps.find(r => r.id === repId);
        const existingTrackIds = existingRep?.trackIds || [];
        const updatedTrackIds = [...existingTrackIds];

        repToTracksMap[repId].forEach(tid => {
          if (!updatedTrackIds.includes(tid)) {
            updatedTrackIds.push(tid);
          }
        });

        const updatedRep: Repertoire = {
          id: repId,
          ownerUid: profile.userId,
          name: existingRep?.name || newRepertoireName || "Novo Repertório",
          description: existingRep?.description || newRepertoireDesc || "",
          type: existingRep?.type || newRepertoireType || 'repertoire',
          trackIds: updatedTrackIds,
          orderedTrackIds: updatedTrackIds,
          visibility: existingRep?.visibility || newRepertoireVisibility || 'public',
          createdAt: existingRep?.createdAt || new Date().toISOString()
        };
        await dbService.saveRepertoire(updatedRep);
      }

      setUploadProgress(96);
      await dbService.syncArtistData(profile.userId);
      setUploadProgress(100);

      // Reset Wizard & form states
      setTitle('');
      setDesc('');
      setLyrics('');
      setPartners('');
      setAudioFile(null);
      setAudioFiles([]);
      setCoverFile(null);
      setCustomAudioUrl('');
      setCustomCoverUrl('');
      setShowAddForm(false);
      refreshData();
    } catch (err: any) {
      console.error("Upload workflow failed: ", err);
      const errMsg = err.message || "";
      let extractedProxyError = "";
      if (errMsg.includes("proxy_error:")) {
        extractedProxyError = decodeURIComponent(errMsg.split("proxy_error:")[1].split(":")[0]).trim();
      }

      if (errMsg.startsWith("step:presigned_url_fetch_failed") || errMsg.startsWith("step:presigned_url_generation_failed")) {
        setFormError(`Falha ao gerar URL de upload no Cloudflare R2.${extractedProxyError ? ` (R2: ${extractedProxyError})` : ""}`);
      } else if (errMsg.startsWith("step:r2_upload_put_failed_status_real")) {
        setFormError(`Falha ao carregar arquivo de áudio para armazenamento R2.`);
      } else {
        setFormError(errMsg || "Erro inesperado ao salvar composições.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMusic = async (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm("Deseja realmente remover esta música do seu catálogo?")) {
      await dbService.deleteMusic(profile.userId, trackId);
      refreshData();
    }
  };

  const handleToggleMusicStatus = async (track: Track, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const currentStatus = track.status || 'active';
      const newStatus = await dbService.toggleMusicStatus(profile.userId, track.trackId, currentStatus);
      
      // Update local state tracks immediately
      setTracks(prev => prev.map(t => t.trackId === track.trackId ? { ...t, status: newStatus } : t));
      
      // If currently playing track was modified, update active track too as well
      if (activeTrack?.trackId === track.trackId) {
        onSelectTrack({ ...activeTrack, status: newStatus }, tracks.map(t => t.trackId === track.trackId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error("Error toggling music link status:", err);
    }
  };

  const handleOpenRepAction = async (track: Track, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTrackForRepAction(track);
    
    try {
      const allReps = await dbService.getRepertoires(profile.userId);
      const checkboxes: Record<string, boolean> = {};
      allReps.forEach(rep => {
        checkboxes[rep.id] = !!(rep.trackIds && rep.trackIds.includes(track.trackId));
      });
      setActiveTrackRepCheckboxes(checkboxes);
    } catch (err) {
      console.error("Failed to map track checkbox states: ", err);
    }

    setNewRepertoireName('');
    setNewRepertoireDesc('');
    setNewRepertoireType('repertoire');
    setNewRepertoireVisibility('public');
    setShowRepActionModal(true);
  };

  const handleSaveRepAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackForRepAction) return;

    try {
      setIsUploading(true);
      const allReps = await dbService.getRepertoires(profile.userId);
      let checkboxesSnapshot = { ...activeTrackRepCheckboxes };

      if (newRepertoireName.trim()) {
        const newRepId = "rep_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const newRep: Repertoire = {
          id: newRepId,
          ownerUid: profile.userId,
          name: newRepertoireName.trim(),
          description: newRepertoireDesc.trim(),
          type: newRepertoireType,
          trackIds: [selectedTrackForRepAction.trackId],
          orderedTrackIds: [selectedTrackForRepAction.trackId],
          visibility: newRepertoireVisibility,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await dbService.saveRepertoire(newRep);
        checkboxesSnapshot[newRepId] = true;
      }

      for (const rep of allReps) {
        const shouldBelong = !!checkboxesSnapshot[rep.id];
        const existingTrackIds = rep.trackIds || [];
        const currentlyHas = existingTrackIds.includes(selectedTrackForRepAction.trackId);

        let updatedTrackIds = [...existingTrackIds];
        let changed = false;

        if (shouldBelong && !currentlyHas) {
          updatedTrackIds.push(selectedTrackForRepAction.trackId);
          changed = true;
        } else if (!shouldBelong && currentlyHas) {
          updatedTrackIds = updatedTrackIds.filter(id => id !== selectedTrackForRepAction.trackId);
          changed = true;
        }

        if (changed) {
          const updatedRep: Repertoire = {
            ...rep,
            trackIds: updatedTrackIds,
            orderedTrackIds: updatedTrackIds,
            updatedAt: new Date().toISOString()
          };
          await dbService.saveRepertoire(updatedRep);
        }
      }

      // Update the track's own repertoireId alignment as well
      let firstCheckedRepId: string | null = null;
      for (const repId of Object.keys(checkboxesSnapshot)) {
        if (checkboxesSnapshot[repId]) {
          firstCheckedRepId = repId;
          break;
        }
      }

      await dbService.updateMusic(profile.userId, selectedTrackForRepAction.trackId, {
        repertoireId: firstCheckedRepId,
        publicationDestination: firstCheckedRepId ? 'repertoire' : 'general'
      });

      setShowRepActionModal(false);
      setSelectedTrackForRepAction(null);
      setNewRepertoireName('');
      setNewRepertoireDesc('');
      refreshData();
    } catch (err: any) {
      console.error("Failed to save quick association: ", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFromRepertoire = async (track: Track, rep: Repertoire) => {
    if (!window.confirm(`Deseja remover a música "${track.title}" desta pasta? Ela continuará disponível no seu catálogo geral.`)) {
      return;
    }
    
    try {
      // 1. Remove from trackIds and orderedTrackIds
      const nextTrackIds = (rep.trackIds || []).filter(id => id !== track.trackId);
      const nextOrderedTrackIds = (rep.orderedTrackIds || []).filter(id => id !== track.trackId);
      
      const updatedRep: Repertoire = {
        ...rep,
        trackIds: nextTrackIds,
        orderedTrackIds: nextOrderedTrackIds,
        updatedAt: new Date().toISOString()
      };
      
      await dbService.saveRepertoire(updatedRep);
      
      // Update local state for viewingRepertoireTracks so the modal reflects the change immediately
      setViewingRepertoireTracks(updatedRep);
      
      // 2. Adjust legacy repertoireId for the song
      // Let's check other repertoires of this user that contain this track (excluding the current one)
      const otherReps = dashboardRepertoires.filter(r => r.id !== rep.id && r.trackIds && r.trackIds.includes(track.trackId));
      let nextRepertoireId: string | null = null;
      
      if (track.repertoireId === rep.id) {
        if (otherReps.length > 0) {
          nextRepertoireId = otherReps[0].id;
        } else {
          nextRepertoireId = null;
        }
        
        await dbService.updateMusic(profile.userId, track.trackId, {
          repertoireId: nextRepertoireId,
          publicationDestination: nextRepertoireId ? 'repertoire' : 'general'
        });
      }
      
      // Update local tracks state
      setTracks(prev => prev.map(t => t.trackId === track.trackId ? {
        ...t,
        repertoireId: nextRepertoireId !== undefined ? nextRepertoireId : t.repertoireId,
        publicationDestination: nextRepertoireId ? 'repertoire' : 'general'
      } : t));
      
      // Trigger refresh
      refreshData();
      setToastMessage?.("Música removida da pasta com sucesso!");
    } catch (err: any) {
      console.error("Erro ao remover música da pasta:", err);
      alert(err.message || "Erro ao remover música da pasta.");
    }
  };

  const handleDeleteMusicFromPasta = async (track: Track) => {
    const confirmed = window.confirm(`Tem certeza de que deseja excluir esta música definitivamente? Ela também será removida de todas as pastas em que estiver incluída.`);
    if (!confirmed) return;
    
    try {
      setModalMessage("Excluindo música...");
      
      // 1. Localizar todas as pastas do usuário que contêm o trackId
      const repsWithTrack = dashboardRepertoires.filter(r => r.trackIds && r.trackIds.includes(track.trackId));
      
      // 2. Remover de todas as pastas
      for (const rep of repsWithTrack) {
        const nextTrackIds = (rep.trackIds || []).filter(id => id !== track.trackId);
        const nextOrderedTrackIds = (rep.orderedTrackIds || []).filter(id => id !== track.trackId);
        
        const updatedRep: Repertoire = {
          ...rep,
          trackIds: nextTrackIds,
          orderedTrackIds: nextOrderedTrackIds,
          updatedAt: new Date().toISOString()
        };
        
        await dbService.saveRepertoire(updatedRep);
      }
      
      // 3. Chamar a função atual deleteMusic
      const deleteResult = await dbService.deleteMusic(profile.userId, track.trackId);
      if (!deleteResult) {
        throw new Error("Não foi possível excluir o documento no banco de dados.");
      }
      
      // 4. Atualizar o estado local
      setTracks(prev => prev.filter(t => t.trackId !== track.trackId));
      
      // If we are currently viewing this repertoire, let's update viewingRepertoireTracks
      if (viewingRepertoireTracks) {
        const updatedRep = {
          ...viewingRepertoireTracks,
          trackIds: (viewingRepertoireTracks.trackIds || []).filter(id => id !== track.trackId),
          orderedTrackIds: (viewingRepertoireTracks.orderedTrackIds || []).filter(id => id !== track.trackId)
        };
        setViewingRepertoireTracks(updatedRep);
      }
      
      // If the deleted track was the active playing track, stop playing
      if (activeTrack?.trackId === track.trackId) {
        onSelectTrack(null as any, []);
      }
      
      refreshData();
      setToastMessage?.("Música excluída com sucesso!");
      setModalMessage(null);
    } catch (err: any) {
      console.error("Erro ao excluir música definitivamente:", err);
      alert(`Erro: ${err.message || 'Falha ao excluir música.'}`);
      setModalMessage(null);
    }
  };

  const handleStartEdit = (track: Track, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTrack(track);
    setEditTitle(track.title || '');
    setEditComposer(track.composer || '');
    setEditSinger(track.singer || track.performer || '');
    setEditPartners(track.partners || '');
    setEditGenre(track.genre || '');
    setEditDesc(track.description || '');
    setEditLyrics(track.lyrics || '');
    setEditTrackStatus((track.status || 'active') as 'active' | 'inactive');
    
    // Check which repertoire (if any) contains this trackId
    const foundRep = dashboardRepertoires.find(r => r.trackIds && r.trackIds.includes(track.trackId));
    setEditRepertoireId(foundRep ? foundRep.id : 'all_songs');

    setFormError('');
    setShowEditForm(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editingTrack) return;
    if (!editTitle.trim()) {
      setFormError('O título da música é obrigatório.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      let finalAudioUrl = editingTrack.audioUrl;
      let finalStoragePath = editingTrack.storagePath;
      let finalFileSize = editingTrack.fileSize;
      let finalMimeType = editingTrack.mimeType;
      let finalOriginalFileName = editingTrack.originalFileName;

      if (newAudioFile) {
        setUploadProgress(10);
        const uploadResult = await uploadAudioToR2(
          profile.userId,
          editingTrack.trackId,
          newAudioFile,
          (percent) => {
            setUploadProgress(Math.min(80, 10 + Math.round(percent * 0.7)));
          }
        );
        finalAudioUrl = uploadResult.publicAudioUrl;
        finalStoragePath = uploadResult.storagePath;
        finalFileSize = newAudioFile.size;
        finalMimeType = newAudioFile.type || 'audio/mpeg';
        finalOriginalFileName = newAudioFile.name;
      }

      setUploadProgress(85);
      const updatedTrack = await dbService.updateMusic(profile.userId, editingTrack.trackId, {
        title: editTitle.trim(),
        composer: editComposer.trim(),
        singer: editSinger.trim(),
        performer: editSinger.trim(),
        partners: editPartners.trim(),
        genre: editGenre.trim(),
        description: editDesc.trim(),
        lyrics: editLyrics.trim(),
        status: editTrackStatus,
        repertoireId: editRepertoireId === 'all_songs' ? null : editRepertoireId,
        publicationDestination: editRepertoireId === 'all_songs' ? 'general' : 'repertoire',
        audioUrl: finalAudioUrl,
        storagePath: finalStoragePath,
        fileSize: finalFileSize,
        mimeType: finalMimeType,
        originalFileName: finalOriginalFileName,
      });

      setUploadProgress(90);
      // Move track across repertoires
      const allReps = await dbService.getRepertoires(profile.userId);
      for (const rep of allReps) {
        let changed = false;
        let nextTrackIds = [...(rep.trackIds || [])];
        let nextOrderedTrackIds = [...(rep.orderedTrackIds || [])];

        const isCurrentlyInRep = nextTrackIds.includes(editingTrack.trackId);
        const shouldBeInRep = rep.id === editRepertoireId;

        if (isCurrentlyInRep && !shouldBeInRep) {
          nextTrackIds = nextTrackIds.filter(id => id !== editingTrack.trackId);
          nextOrderedTrackIds = nextOrderedTrackIds.filter(id => id !== editingTrack.trackId);
          changed = true;
        } else if (!isCurrentlyInRep && shouldBeInRep) {
          nextTrackIds.push(editingTrack.trackId);
          nextOrderedTrackIds.push(editingTrack.trackId);
          changed = true;
        }

        if (changed) {
          const updatedRep: Repertoire = {
            ...rep,
            trackIds: nextTrackIds,
            orderedTrackIds: nextOrderedTrackIds,
            updatedAt: new Date().toISOString()
          };
          await dbService.saveRepertoire(updatedRep);
        }
      }

      // Synchronously update active status list
      setTracks(prev => prev.map(t => t.trackId === editingTrack.trackId ? { ...t, ...updatedTrack } : t));

      if (activeTrack?.trackId === editingTrack.trackId) {
        onSelectTrack({ ...activeTrack, ...updatedTrack }, tracks.map(t => t.trackId === editingTrack.trackId ? { ...t, ...updatedTrack } : t));
      }

      setUploadProgress(100);
      setShowEditForm(false);
      setEditingTrack(null);
      setNewAudioFile(null); // Clear new audio file selection
      refreshData();
      setToastMessage?.("Música atualizada com sucesso!");
    } catch (err: any) {
      console.error("Error updating music:", err);
      setFormError(err.message || 'Erro ao salvar alterações da música.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveRepertoire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepName.trim()) {
      setToastMessage?.("O nome do repertório é obrigatório.");
      return;
    }
    if (isSavingRepertoire) return;

    setIsSavingRepertoire(true);
    try {
      if (editingRepertoire) {
        const updatedRep: Repertoire = {
          ...editingRepertoire,
          name: newRepName.trim(),
          description: newRepDesc.trim(),
          visibility: newRepVisibility,
          updatedAt: new Date().toISOString()
        };
        await dbService.saveRepertoire(updatedRep);
      } else {
        // Generate real Firestore document ID instead of a temporary ID
        const newDocRef = doc(collection(db, 'repertoires'));
        const repId = newDocRef.id;
        const newRep: Repertoire = {
          id: repId,
          ownerUid: profile.userId,
          name: newRepName.trim(),
          description: newRepDesc.trim(),
          type: 'repertoire',
          trackIds: [],
          orderedTrackIds: [],
          visibility: newRepVisibility,
          createdAt: new Date().toISOString()
        };
        await dbService.saveRepertoire(newRep);
      }

      setShowCreateRep(false);
      setEditingRepertoire(null);
      setNewRepName('');
      setNewRepDesc('');
      refreshData();
    } catch (err: any) {
      console.error("Erro ao salvar o repertório:", err);
      setToastMessage(`Falha na gravação: ${err?.message || "Erro desconhecido"}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSavingRepertoire(false);
    }
  };

  // Find most played track
  const topTrack = tracks.length > 0
    ? [...tracks].sort((a, b) => b.playsCount - a.playsCount)[0]
    : null;

  const totalPlays = tracks.reduce((sum, t) => sum + t.playsCount, 0);

  return (
    <div className="min-h-screen bg-[#0f121d] text-white font-sans pb-32">
      
      {/* Top action header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            id="dash-back-home"
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title="Voltar ao início"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading font-black text-base uppercase leading-none tracking-tight">Painel Executivo</h2>
            <p className="text-[10px] font-mono mt-0.5 text-yellow-400">SomDrive</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(profile.role === 'admin' || profile.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com' || profile.email?.toLowerCase().trim() === 'sertanejopremier@gmail.com') && (
            <button 
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 text-xs font-mono uppercase bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-orange-500 hover:text-orange-400 px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition select-none shadow animate-pulse"
              title="Acessar Configurações de Administrador"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Painel Admin
            </button>
          )}

          {/* Plan status button/badge with popover */}
          {(() => {
            if (expiryInfo && planDisplayStatus) {
              return (
                <div className="relative">
                  <button 
                    onClick={() => setShowPlanPopover(!showPlanPopover)}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer select-none group"
                    title="Ver detalhes do plano"
                  >
                    <span className={`w-2 h-2 rounded-full ${profile.plan === 'premium' ? 'bg-yellow-500 animate-pulse' : profile.plan === 'pro' ? 'bg-orange-500 animate-pulse' : profile.plan === 'essencial' ? 'bg-blue-500' : 'bg-slate-500'}`}></span>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-300 group-hover:text-white">
                      Plano: {profile.plan === 'premium' ? 'Premium 🌟' : profile.plan === 'pro' ? 'Pro ⭐' : profile.plan === 'essencial' ? 'Essencial' : 'Free'}
                    </span>
                  </button>

                  {showPlanPopover && (
                    <>
                      {/* Transparent backdrop to close when clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowPlanPopover(false)} />
                      <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-72 sm:w-72 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/90 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
                          <span className="text-xs font-heading font-black uppercase text-slate-200 tracking-wide">Detalhes do Plano</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            planDisplayStatus === 'Ativo' 
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                              : planDisplayStatus === 'Vence em breve'
                              ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40'
                              : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                          }`}>
                            {planDisplayStatus}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs font-mono text-slate-300">
                          <div className="flex justify-between py-1 border-b border-slate-900/50">
                            <span className="text-slate-400">Plano atual:</span>
                            <span className="font-bold text-white uppercase">{profile.plan}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-900/50">
                            <span className="text-slate-400">Limite:</span>
                            <span className="font-bold text-white">{limitCount} músicas</span>
                          </div>
                          <div className="flex flex-col py-1">
                            <span className="text-slate-400 mb-1">{expiryInfo.label}:</span>
                            <span className="font-bold text-amber-400 text-sm">{expiryInfo.formattedDate}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{expiryInfo.formattedLongDate}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            } else {
              // Free plan or fallback when no expiry date is set
              return (
                <button 
                  onClick={() => setShowPlans(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer select-none group"
                  title="Ver planos e limites"
                >
                  <span className={`w-2 h-2 rounded-full ${profile.plan === 'premium' ? 'bg-yellow-500 animate-pulse' : profile.plan === 'pro' ? 'bg-orange-500 animate-pulse' : profile.plan === 'essencial' ? 'bg-blue-500' : 'bg-slate-500'}`}></span>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-300 group-hover:text-white">
                    Plano: {profile.plan === 'premium' ? 'Premium 🌟' : profile.plan === 'pro' ? 'Pro ⭐' : profile.plan === 'essencial' ? 'Essencial' : 'Free'}
                  </span>
                </button>
              );
            }
          })()}

          <button 
            id="dash-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-1 text-xs font-mono uppercase bg-red-950 hover:bg-red-900 border border-red-900/60 text-red-200 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      {/* Main dashboard content container */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* EXPIRED PLAN STATE / EXPIRY WARNING NOTIFICATIONS AND SELECTOR BAR */}
        {(() => {
          const warning = getPlanExpiryWarnings();
          if (!warning) return null;
          
          return (
            <div className="bg-[#0b0e14] border border-orange-500/20 p-6 rounded-3xl relative overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h4 className="font-heading font-black text-sm uppercase text-white tracking-wide flex items-center gap-1.5">
                    {warning.title}
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed max-w-2xl">
                    {warning.message}
                  </p>
                </div>
                {warning.actionButton && (
                  <button 
                    onClick={() => setShowPlans(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shrink-0 transition"
                  >
                    {warning.buttonText || "Assinar Agora"}
                  </button>
                )}
              </div>

              {/* Tracks selection panel if selector is permitted */}
              {warning.showSelector && (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-900/80 p-4 space-y-3 text-left">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-orange-400 font-bold">
                    Suas 3 Músicas Ativas Escolhidas ({profile.preferredFreeTracks?.length || 0}/3)
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal">
                    Selecione abaixo as 3 músicas que você deseja que fiquem ativas e disponíveis no seu plano Free caso não renove. As não selecionadas ficarão guardadas de forma segura por até 30 dias.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tracks.map((t) => {
                      const isSelected = (profile.preferredFreeTracks || []).includes(t.trackId);
                      return (
                        <div 
                          key={t.trackId}
                          onClick={() => handleToggleTrackPreference(t.trackId)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                            isSelected 
                              ? 'bg-orange-950/25 border-orange-500/50 text-orange-200' 
                              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-semibold truncate max-w-[180px]">
                            {t.title}
                          </span>
                          <div className="shrink-0 font-mono text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border">
                            {isSelected ? '✓ Ativa' : 'Bloqueada'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Avisos & Audições Panel */}
        <AnnouncementsPanel />
        
        {/* Welcome Block + Share URL */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-[200px] h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none"></div>
          
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-950 text-orange-400 uppercase text-[9px] font-mono font-bold tracking-widest rounded border border-orange-500/20">Compositor</span>
              {profile.plan === 'pro' && (
                <span className="px-2 py-0.5 bg-orange-950 text-orange-400 uppercase text-[9px] font-mono font-bold tracking-widest rounded border border-orange-500/25">Pro ⭐</span>
              )}
              {profile.plan === 'premium' && (
                <span className="px-2 py-0.5 bg-yellow-950/40 text-yellow-400 uppercase text-[9px] font-mono font-bold tracking-widest rounded border border-yellow-400/25">Premium 🌟</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl md:text-3xl font-heading font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Olá, {profile.name}!
              </h3>
              <button 
                onClick={handleOpenProfileModal}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 rounded-lg flex items-center gap-1 cursor-pointer transition active:scale-95"
                title="Personalizar seu perfil de compositor (Rótulos, Redes Sociais, Bio)"
              >
                <User className="w-3 h-3 text-orange-400" /> Personalizar Perfil
              </button>
            </div>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Aqui você controla seu acervo e acompanha cliques nas suas faixas. Seu link público está ativo e pronto para receber visitas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              id="view-catalog-btn"
              onClick={() => onNavigate('public', { id: profile.slug || profile.userId })}
              className="px-4.5 py-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition hover:scale-102"
            >
              <Globe className="w-4 h-4 text-orange-400 animate-pulse" /> Ver Catálogo Público
            </button>
            
            <button 
              id="copy-link-btn"
              onClick={handleCopyLink}
              className="px-4.5 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition hover:from-orange-500 hover:to-yellow-400 hover:scale-102"
            >
              <Copy className="w-4 h-4" /> {copiedAlert ? "Divulgação Copiada! ✓" : "Copiar Divulgação"}
            </button>

            <button 
              id="share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              className="px-4.5 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition hover:scale-102"
              title="Compartilhar no WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-400" /> WhatsApp
            </button>
          </div>
        </div>

        {/* Upgrade Success Notification */}
        {upgradeSuccess && (
          <div className="p-4 bg-orange-950 border-2 border-orange-400 text-white rounded-2xl flex items-center gap-3 animate-bounce">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            <div>
              <p className="text-sm font-heading font-black uppercase">Plano Atualizado com Sucesso!</p>
              <p className="text-xs text-orange-300 font-mono">Seu armazenamento de catálogo foi expandido para até 15 músicas!</p>
            </div>
          </div>
        )}

        {/* METRICS Bento Block */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          
          {/* Metric 1: Tracks count */}
          <div className="bg-slate-900 border border-slate-850 p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-2">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Músicas</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight">
                {tracks.length} <span className="text-slate-500 text-xs md:text-sm font-normal">/ {limitCount}</span>
              </h4>
              <div className="w-16 sm:w-24 h-1 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${Math.min(100, (tracks.length / limitCount) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="p-2 md:p-3 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-lg md:rounded-xl self-start sm:self-center">
              <Music className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          {/* Metric 2: Plays global */}
          <div className="bg-slate-900 border border-slate-850 p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Total Plays</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight font-mono text-[#d4af37]">{totalPlays}</h4>
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Plays reais (mín. 5s)</p>
            </div>
            <div className="p-2 md:p-3 bg-yellow-950/40 border border-yellow-500/20 text-[#d4af37] rounded-lg md:rounded-xl self-start sm:self-center">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          {/* Metric 3: Profile Visits */}
          <div className="bg-slate-900 border border-slate-850 p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Acessos</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight font-mono text-yellow-400">{analytics.viewsCount}</h4>
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Visitas únicas (24h)</p>
            </div>
            <div className="p-2 md:p-3 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-lg md:rounded-xl self-start sm:self-center">
              <Eye className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          {/* Metric 4: WhatsApp clicks */}
          <div className="bg-slate-900 border border-slate-850 p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">WHATSAPP</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight font-mono text-emerald-400">{analytics.whatsappClicks}</h4>
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Cliques no WhatsApp</p>
            </div>
            <div className="p-2 md:p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg md:rounded-xl self-start sm:self-center">
               <MessageSquare className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

        </div>

        {/* Most Played Highlight */}
        {topTrack && (
          <div className="p-5 bg-gradient-to-r from-orange-950/40 to-yellow-950/25 border border-orange-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-orange-950 border border-orange-500/20 text-yellow-400 text-xs font-mono rounded font-bold uppercase tracking-wider">Música Mais Ouvida ★</span>
              <h4 className="font-heading font-black text-sm uppercase text-slate-200 tracking-wide">
                "{topTrack.title}" — {topTrack.playsCount} Plays
              </h4>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Compositor original: <span className="text-orange-400 font-bold">{topTrack.composer || profile.name}</span>
            </div>
          </div>
        )}

        {/* CURRENT PLAN ENCOURAGING INFO CARD */}
        <div 
          onClick={() => setShowPlans(true)}
          className="p-6 bg-gradient-to-r from-orange-950/20 via-slate-900 to-yellow-950/20 border border-orange-500/15 hover:border-orange-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden cursor-pointer transition group"
        >
          <div className="space-y-1">
            <h4 className="font-heading font-black text-lg text-orange-400 uppercase tracking-wide flex items-center gap-1.5 group-hover:text-amber-300 transition">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" /> 
              {profile.plan === 'free' && 'Você está no SomDrive Free (3 Músicas)'}
              {profile.plan === 'essencial' && 'Você está no SomDrive Essencial (10 Músicas)'}
              {profile.plan === 'pro' && 'Você está no SomDrive Pro (15 Músicas)'}
              {profile.plan === 'premium' && 'Você está no SomDrive Premium (50 Músicas)'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {profile.plan === 'free' && 'Sua conta gratuita permite até 3 músicas em seu catálogo privado. Faça upgrade para expandir seu limite para até 50 faixas.'}
              {profile.plan === 'essencial' && 'Seu plano Essencial está ativo! Agora você pode cadastrar e compartilhar até 10 músicas em seu catálogo.'}
              {profile.plan === 'pro' && 'Seu plano Pro está ativo! Agora você pode cadastrar e compartilhar até 15 músicas em MP3 de alta conversão.'}
              {profile.plan === 'premium' && 'Seu plano Premium está ativo! Aproveite o limite expandido de até 50 músicas cadastradas em seu portfólio.'}
            </p>
            {(() => {
              if (expiryInfo && planDisplayStatus) {
                let dotClass = "bg-emerald-500 animate-pulse";
                let textClass = "text-emerald-400/80";
                
                if (planDisplayStatus === 'Vence em breve') {
                  dotClass = "bg-amber-500 animate-pulse";
                  textClass = "text-amber-400/80";
                } else if (planDisplayStatus === 'Processando vencimento') {
                  dotClass = "bg-rose-500";
                  textClass = "text-rose-400/80";
                }

                return (
                  <p className={`text-[11px] font-mono ${textClass} mt-2 flex items-center gap-1.5`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                    {expiryInfo.fullText}
                  </p>
                );
              }
              return null;
            })()}
          </div>
          <div className="px-4.5 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 text-[10px] font-mono rounded-full font-black uppercase tracking-wider shrink-0 font-bold hover:scale-102 transition shadow-md">
            Gerenciar Assinatura
          </div>
        </div>



        {/* SUB-AREAS NAVIGATION BAR HEADER (Custom sophisticated tabs) */}
        <div className="flex border-b border-slate-900 gap-3 sm:gap-6 md:gap-8 select-none overflow-x-auto pb-2.5 mt-2.5 scrollbar-none text-left">
          <button 
            type="button"
            onClick={() => setDashboardTab('musics')}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative shrink-0 ${
              dashboardTab === 'musics' 
                ? 'border-orange-500 text-orange-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            Minhas Músicas
          </button>
          <button 
            type="button"
            onClick={() => setDashboardTab('repertoires')}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative shrink-0 ${
              dashboardTab === 'repertoires' 
                ? 'border-orange-500 text-orange-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            Meus Repertórios
          </button>
          <button 
            type="button"
            onClick={() => setDashboardTab('projects')}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative shrink-0 ${
              dashboardTab === 'projects' 
                ? 'border-orange-500 text-orange-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            Meus Projetos
          </button>
          <button 
            type="button"
            onClick={() => setDashboardTab('shares')}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative shrink-0 ${
              dashboardTab === 'shares' 
                ? 'border-orange-500 text-orange-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            Links e Divulgação
          </button>
          <button 
            type="button"
            onClick={() => {
              setDashboardTab('profile');
              handleOpenProfileModal();
            }}
            className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 relative shrink-0 ${
              dashboardTab === 'profile' 
                ? 'border-orange-500 text-orange-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            Personalizar Perfil
          </button>
        </div>

        {dashboardTab === 'musics' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* SECTION HEADER: MUSIC CONTROL LIST & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
          <div>
            <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-orange-400" /> Meu Acervo Musical
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Organize suas composições e escolha a ordem em que elas aparecem no catálogo público.</p>
          </div>

          <button 
            id="open-add-modal-btn"
            onClick={() => {
              if (tracks.length >= limitCount) {
                setShowLimitPrompt(true);
              } else {
                setUploadStep(1);
                setAudioFiles([]);
                setOrganizationOption('all_songs');
                setSelectedRepertoireIds([]);
                setNewRepertoireName('');
                setNewRepertoireDesc('');
                setNewRepertoireType('repertoire');
                setNewRepertoireVisibility('public');
                setTrackSpecificOrganization({});
                setTitle('');
                setGenre('');
                setDesc('');
                setLyrics('');
                setPartners('');
                setFormError('');
                setShowAddForm(true);
              }
            }}
            className="px-5 py-3 bg-orange-600 hover:bg-orange-505 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 flex items-center gap-2 shadow-lg shadow-orange-500/20 group cursor-pointer transition duration-250 select-none font-bold"
          >
            <Plus className="w-5 h-5 text-slate-950 stroke-[2.5] group-hover:rotate-180 transition-transform" /> Adicionar Música
          </button>
        </div>

        {/* FILTERS & MODE CONTROLLER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 bg-slate-900/60 p-3 rounded-xl border border-slate-850">
          {/* Simple Filter: Todas / Ativas / Inativas */}
          <div className="flex items-center gap-1.5 overflow-x-auto scroller-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer select-none ${
                statusFilter === 'all'
                  ? 'bg-orange-600 text-slate-950 font-black'
                  : 'bg-slate-955/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer select-none ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-slate-950 font-black'
                  : 'bg-slate-955/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer select-none ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-slate-950 font-black'
                  : 'bg-slate-955/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850'
              }`}
            >
              Inativas
            </button>
          </div>

          {/* Mode Switcher Buttons */}
          <button
            onClick={() => setIsOrganizing(!isOrganizing)}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-black tracking-wider uppercase flex items-center gap-2 cursor-pointer transition select-none ${
              isOrganizing
                ? 'bg-[#d4af37] text-slate-950 border border-[#d4af37]/30 shadow-lg shadow-[#d4af37]/10'
                : 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isOrganizing ? 'Visualizar Painel' : 'Organizar Ordem'}</span>
          </button>
        </div>

        {/* Music List */}
        <div className="flex items-center justify-between border-b border-slate-850/40 pb-2 mt-4 text-left">
          <h4 className="font-heading font-black text-xs uppercase tracking-wider text-slate-400">
            MÚSICAS AVULSAS (Não pertencem a nenhum repertório)
          </h4>
        </div>

        {generalSongs.length === 0 ? (
          <div id="empty-songs" className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-850 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-slate-955 rounded-full flex items-center justify-center mx-auto text-orange-500 border border-slate-800 shadow-xl shadow-orange-550/5">
              <Music className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-lg uppercase text-slate-200">
                {tracks.length === 0 ? "Nenhuma música cadastrada ainda." : "Nenhuma música fora de repertórios."}
              </h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {tracks.length === 0 
                  ? "Adicione sua primeira composição para montar seu catálogo SomDrive." 
                  : "Todas as suas músicas estão vinculadas a repertórios específicos no momento."}
              </p>
            </div>
            <button 
              id="empty-add-btn"
              onClick={() => {
                if (tracks.length >= limitCount) {
                  setShowLimitPrompt(true);
                } else {
                  setShowAddForm(true);
                }
              }}
              className="px-5 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-bold uppercase text-slate-950 tracking-wider shadow-lg shadow-orange-500/20 transition cursor-pointer select-none"
            >
              Adicionar Música
            </button>
          </div>
        ) : (
          isOrganizing ? (
          /* ORGANIZE ORDER MODE (SIMPLIFIED RENDERING AS REQUESTED) */
          <div className="space-y-2 mt-4">
            <div className="bg-slate-950/40 px-4 py-2 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center justify-between border-b border-slate-900">
              <span>Posição & Música</span>
              <span>Ordenar</span>
            </div>
            {generalSongs.filter(t => {
              const isActive = (t.status || 'active') === 'active';
              if (statusFilter === 'active') return isActive;
              if (statusFilter === 'inactive') return !isActive;
              return true;
            }).map((track) => {
              const absoluteIdx = tracks.findIndex(t => t.trackId === track.trackId);
              
              return (
                <div 
                  key={track.trackId}
                  className="bg-gradient-to-r from-slate-900 to-[#0e1628] border border-slate-850 rounded-xl p-3 flex items-center justify-between transition hover:border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    {/* Position tag */}
                    <div className="w-8 h-8 rounded-lg bg-orange-950/80 border border-orange-500/30 flex items-center justify-center text-orange-400 font-mono text-sm font-bold">
                      #{absoluteIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">{track.title}</h4>
                      <p className="text-[10.5px] font-mono text-slate-400 uppercase">{track.genre || profile.genre} • Autor: {track.composer || profile.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleMoveTrack(track.trackId, 'up', e)}
                      disabled={absoluteIdx === 0}
                      className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={(e) => handleMoveTrack(track.trackId, 'down', e)}
                      disabled={absoluteIdx === tracks.length - 1}
                      className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    
                    <span className="hidden sm:inline-block text-[9px] text-emerald-400 font-mono border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold bg-emerald-950/20">
                      salvo automaticamente
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* STANDARD PREMIUM LIST OF MUSIC CARDS VIA HORIZONTAL ROWS */
          <div className="space-y-3 mt-4">
            {generalSongs.filter(t => {
              const isActive = (t.status || 'active') === 'active';
              if (statusFilter === 'active') return isActive;
              if (statusFilter === 'inactive') return !isActive;
              return true;
            }).map((track) => {
              const absoluteIdx = tracks.findIndex(t => t.trackId === track.trackId);
              const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
              const isPublicActive = (track.status || 'active') === 'active';
              
              const handleCopySongLink = (trackVal: Track, e: React.MouseEvent) => {
                e.stopPropagation();
                const slugifyStr = (text: string) => {
                  return text
                    .toString()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/[\s_]+/g, '-')
                    .replace(/-+/g, '-');
                };
                const slugOrId = profile.slug || (profile.name ? slugifyStr(profile.name) : profile.userId);
                const appBaseUrl = window.location.origin;
                const songUrl = `${appBaseUrl}/catalogo/${slugOrId}?play=${trackVal.trackId}`;
                navigator.clipboard.writeText(songUrl);
                
                setToastMessage("Link do catálogo com essa música copiado!");
                setTimeout(() => {
                  setToastMessage(null);
                }, 3000);
              };

              return (
                <div 
                  key={track.trackId}
                  onClick={() => onSelectTrack(track, tracks)}
                  className={`bg-gradient-to-r from-[#0a1122] via-[#0d162a] to-[#080d19] hover:from-[#0d1d3a] hover:to-[#0c162b] border rounded-2xl overflow-hidden shadow-2xl transition duration-300 cursor-pointer p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none relative ${
                    isCurrentlyPlaying ? 'ring-2 ring-orange-500 border-transparent' : 'border-slate-800/60'
                  }`}
                >
                  {/* Left part: Position, Play button & Meta */}
                  <div className="flex items-center gap-3.5 w-full md:w-auto min-w-0 flex-1">
                    {/* Position Tag badge - Premium Orange highlight */}
                    <div className="w-9 h-9 rounded-xl bg-orange-950/60 border border-orange-500/20 flex flex-col items-center justify-center text-orange-400 text-xs font-mono font-bold shrink-0 shadow-lg shadow-orange-500/5">
                      <span className="text-[8px] text-orange-550 font-sans tracking-tight uppercase leading-none font-black">Pos</span>
                      <span className="leading-none mt-0.5 select-none font-mono">#{absoluteIdx + 1}</span>
                    </div>

                    {/* Small & Elegant Play/Pause bubble */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track, tracks);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 ${
                        isCurrentlyPlaying && isPlaying 
                          ? 'bg-orange-600 text-slate-950 shadow-md shadow-orange-500/35' 
                          : 'bg-slate-950 border border-slate-800 text-orange-404 hover:text-white hover:bg-slate-900 bg-opacity-95'
                      }`}
                    >
                      {isCurrentlyPlaying && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current text-slate-950 stroke-none" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current text-orange-400 stroke-none ml-0.5" />
                      )}
                    </button>

                    {/* Meta section */}
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-heading font-black text-sm text-white uppercase tracking-tight truncate max-w-[150px] sm:max-w-xs">
                          {track.title}
                        </h4>
                        
                        <span className="px-2 py-0.5 bg-[#080d19]/80 border border-slate-850 text-slate-400 text-[8px] font-mono rounded-md uppercase font-bold tracking-wider">
                          {track.genre || profile.genre}
                        </span>

                        {isCurrentlyPlaying && isPlaying && (
                          <div className="flex items-end gap-[1.5px] h-3 ml-1">
                            <span className="w-[1.8px] bg-orange-400 animate-bar-1 h-3 rounded-full"></span>
                            <span className="w-[1.8px] bg-orange-400 animate-bar-2 h-1.5 rounded-full"></span>
                            <span className="w-[1.8px] bg-orange-400 animate-bar-3 h-2.5 rounded-full"></span>
                          </div>
                        )}
                      </div>

                      {/* Stacked subtext: Composer & Guia */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-y-0.5 sm:gap-x-3 text-[10.5px] text-slate-405 font-bold uppercase font-sans">
                        <span>Autor: <span className="font-mono text-[10.5px] text-slate-300">{track.composer || profile.name}</span></span>
                        {(track.singer || track.performer) && (
                          <span className="hidden sm:inline text-slate-700 font-bold">•</span>
                        )}
                        {(track.singer || track.performer) && (
                          <span>Intérprete/Guia: <span className="font-mono text-[10.5px] text-orange-400">{track.singer || track.performer}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right part: plays count, status, moves & administrative actions */}
                  <div className="flex flex-row md:items-center justify-between md:justify-end gap-3.5 shrink-0 pt-3 md:pt-0 border-t md:border-0 border-slate-850/55 w-full md:w-auto">
                    {/* Stats & status display label */}
                    <div className="flex items-center gap-2">
                      {/* Plays counter */}
                      <div className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1 bg-slate-950 hover:bg-[#060b14] border border-slate-800 px-2 py-1 rounded-lg select-none">
                        <TrendingUp className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{track.playsCount || 0} plays</span>
                      </div>

                      {/* Interactive Link Status Toggler */}
                      {track.status === 'locked_by_expired_plan' ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPlans(true);
                          }}
                          className="px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[9px] font-mono rounded-lg uppercase font-black tracking-wider transition-all cursor-pointer select-none flex items-center gap-1.5"
                          title="Música bloqueada devido ao vencimento do plano. Clique para assinar e liberar."
                        >
                          <Lock className="w-3 h-3 text-amber-500 animate-pulse" />
                          <span>Bloqueada</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleToggleMusicStatus(track, e)}
                          className={`px-2.5 py-1 border text-[9px] font-mono rounded-lg uppercase font-black tracking-wider transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                            isPublicActive
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-955'
                              : 'bg-rose-950/40 border-rose-500/30 text-rose-450 hover:bg-rose-955'
                          }`}
                          title={isPublicActive ? "Desativar escuta pública (Link Ativo)" : "Ativar escuta pública (Link Inativo)"}
                        >
                          {isPublicActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>Inativo</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Row of actionable control buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Order Position Shift controls */}
                      <button 
                        onClick={(e) => handleMoveTrack(track.trackId, 'up', e)}
                        disabled={absoluteIdx === 0}
                        className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Subir Posição"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={(e) => handleMoveTrack(track.trackId, 'down', e)}
                        disabled={absoluteIdx === tracks.length - 1}
                        className="p-1.5 bg-slate-955 border border-slate-800 text-slate-400 hover:text-orange-400 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Descer Posição"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-[1px] bg-slate-800/80 mx-0.5"></div>

                      <button 
                        onClick={(e) => handleCopySongLink(track, e)}
                        className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Copiar link da música"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => handleOpenRepAction(track, e)}
                        className="p-1.5 bg-[#0f172a] border border-slate-800/80 text-orange-450 hover:text-orange-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Organizar em Repertórios"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-orange-500" />
                      </button>

                      <button 
                        onClick={(e) => handleStartEdit(track, e)}
                        className="p-1.5 bg-slate-955 border border-slate-800 text-slate-400 hover:text-orange-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Editar detalhes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={(e) => handleDeleteMusic(track.trackId, e)}
                        className="p-1.5 bg-slate-955 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Excluir música"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}
        </div>
      )}

      {/* REPERTOIRES, PROJECTS, AND SHARES SUB-AREAS */}
      {dashboardTab === 'repertoires' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                <Folders className="w-5 h-5 text-orange-400" /> Meus Repertórios / Pastas
              </h3>
              <p className="text-slate-405 text-xs mt-0.5 font-medium">Crie, gerencie e compartilhe pastas de músicas específicas com seus parceiros.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewRepName('');
                setNewRepDesc('');
                setNewRepVisibility('public');
                setShowCreateRep(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 flex items-center gap-2 shadow-lg shadow-orange-500/10 cursor-pointer transition duration-200 active:scale-98 font-bold"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" /> Criar Novo Repertório
            </button>
          </div>

          {(() => {
            if (loadingRepertoires) {
              return (
                <div className="text-center py-20 bg-slate-900/10 rounded-3xl border border-slate-850 p-6 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                  <p className="text-xs text-slate-450 font-mono">Sincronizando pastas com o Firestore...</p>
                </div>
              );
            }

            if (repertoiresError) {
              return (
                <div className="text-center py-16 bg-red-950/20 rounded-3xl border border-red-500/20 p-6">
                  <Info className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
                  <h4 className="text-base font-bold text-red-400 uppercase">Erro ao carregar dados</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-mono">{repertoiresError}</p>
                </div>
              );
            }

            const combinedRepertoires = dashboardRepertoires;

            return (
              <div className="space-y-6">
                {combinedRepertoires.length === 0 ? (
                  <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-850 p-6">
                    <Folders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h4 className="text-base font-bold text-slate-300 uppercase">Nenhum repertório criado</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">Você ainda não tem nenhum repertório cadastrado. Envie músicas e organize-as em pastas públicas ou privadas!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combinedRepertoires.map((rep, index) => {
                      const repTracksCount = rep.trackIds?.length || 0;
                      const slugToUse = rep.slug || rep.id;
                      const shareUrl = `${window.location.origin}/s/${profile.slug || profile.userId}/repertorio/${slugToUse}`;
                      const isPrivate = rep.visibility === 'private';
                      const isCopied = repCopiedId === rep.id;
                      const folderColor = getFolderColor(index);

                      // Play all songs helper
                      const handlePlayAll = () => {
                        const repSongs = tracks.filter(t => t.repertoireId === rep.id || (rep.trackIds && rep.trackIds.includes(t.trackId)));
                        if (repSongs.length > 0) {
                          onSelectTrack(repSongs[0], repSongs);
                        } else {
                          alert('Esta pasta não possui músicas para reproduzir.');
                        }
                      };

                      return (
                        <div 
                          key={rep.id}
                          onClick={() => setViewingRepertoireTracks(rep)}
                          className={`relative w-full h-[255px] sm:h-[275px] bg-[#121622]/90 hover:bg-[#151a29] rounded-2xl border ${folderColor.border} ${folderColor.hoverBorder} p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-lg shadow-black/40 hover:shadow-${folderColor.name === 'verde_somdrive' ? 'emerald' : 'blue'}-500/5 group select-none cursor-pointer active:scale-[0.98] overflow-visible`}
                        >
                          {/* Soft inner glow matching the folder's theme */}
                          <div className={`absolute -top-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-br from-${folderColor.name === 'verde_somdrive' ? 'emerald' : 'blue'}-500/5 to-transparent blur-2xl pointer-events-none`}></div>

                          {/* A. CARD HEADER: Private/Public badge & options dropdown trigger */}
                          <div className="flex items-center justify-between w-full relative z-10 pl-1">
                            <span className={`text-[8px] font-mono tracking-widest font-extrabold px-1.5 py-0.5 rounded border uppercase inline-block ${
                              isPrivate ? 'bg-rose-950/30 border-rose-500/20 text-rose-400' : 'bg-emerald-950/30 border-emerald-500/20 text-[#1ed760]'
                            }`}>
                              {isPrivate ? 'Privado' : 'Público'}
                            </span>

                            <div className="flex items-center gap-1.5 relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuRepId(openMenuRepId === rep.id ? null : rep.id);
                                }}
                                className="w-6 h-6 rounded-md bg-black/45 hover:bg-black/65 text-slate-400 hover:text-white transition duration-150 flex items-center justify-center cursor-pointer border border-white/5 active:scale-90"
                                title="Opções"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {/* Absolute dropdown options menu (compact / small) */}
                              {openMenuRepId === rep.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuRepId(null);
                                    }}
                                  />
                                  <div 
                                    className="absolute right-0 mt-7 w-36 bg-[#161d2d] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuRepId(null);
                                        setEditingRepertoire(rep);
                                        setNewRepName(rep.name);
                                        setNewRepDesc(rep.description || '');
                                        setNewRepVisibility(rep.visibility === 'active' ? 'public' : (rep.visibility || 'public') as any);
                                        setShowCreateRep(true);
                                      }}
                                      className="w-full px-3 py-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
                                    >
                                      <Pencil className="w-3 h-3 text-slate-450" />
                                      <span>Editar Pasta</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPrivate}
                                      onClick={() => {
                                        setOpenMenuRepId(null);
                                        navigator.clipboard.writeText(shareUrl);
                                        setRepCopiedId(rep.id);
                                        setTimeout(() => setRepCopiedId(null), 2000);
                                      }}
                                      className="w-full px-3 py-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                      <Share2 className="w-3 h-3 text-slate-450" />
                                      <span>Compartilhar</span>
                                    </button>
                                    <div className="h-[1px] bg-slate-800/80 my-1"></div>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setOpenMenuRepId(null);
                                        if (confirm(`Tem certeza que deseja excluir o repertório "${rep.name}"? As músicas não serão apagadas, apenas a pasta.`)) {
                                          await dbService.deleteRepertoire(rep.id, profile.userId);
                                          refreshData();
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-[11px] text-rose-455 hover:bg-rose-950/20 transition flex items-center gap-2 font-bold"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Excluir Pasta</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* B. MIDDLE SECTION: Center big category icon representing style inside physical folder */}
                          <div className="relative w-full h-[95px] flex items-center justify-center mt-1 select-none pointer-events-none">
                            <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex items-center justify-center">
                              <svg viewBox="0 0 100 75" className="w-[120px] h-[90px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path 
                                  d="M10,21 L10,13 C10,10.5 12,8.5 14.5,8.5 L36,8.5 C38.5,8.5 40.2,10 41.8,12 L47,21 Z"
                                  fill={folderColor.primary}
                                  className="transition-all duration-300"
                                />
                                <rect 
                                  x="10" 
                                  y="21" 
                                  width="80" 
                                  height="45" 
                                  rx="6" 
                                  fill={`${folderColor.primary}05`}
                                  stroke={folderColor.primary} 
                                  strokeWidth="1.8" 
                                  className="transition-all duration-300"
                                />
                              </svg>
                            </div>
                            
                            <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 mt-2 flex items-center justify-center">
                              {getCategoryIcon(index, folderColor.primary)}
                            </div>
                          </div>

                          {/* C. FOLDER INFORMATION: Highlighted Name, Description & Tracks Count */}
                          <div className="space-y-0.5 text-center w-full relative z-10 px-1 mt-1.5 pointer-events-none">
                            <h4 className="font-sans font-extrabold text-[12.5px] sm:text-[13px] text-white uppercase tracking-wider truncate max-w-full group-hover:text-[#1ed760] transition duration-150">
                              {rep.name}
                            </h4>
                            
                            <span className="text-[10px] sm:text-[11px] font-sans font-medium text-slate-400 block">
                              {repTracksCount} {repTracksCount === 1 ? 'música' : 'músicas'}
                            </span>
                          </div>

                          {/* D. CARD FOOTER ACTIONS: Clean Play & Chevron Navigation row */}
                          <div className="flex items-center justify-between w-full pt-2.5 mt-2.5 border-t border-slate-800/60 relative z-10 select-none px-1">
                            {repTracksCount > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAll();
                                }}
                                className="w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-90"
                                style={{ backgroundColor: folderColor.primary }}
                                title="Tocar todas as músicas dessa pasta"
                              >
                                <Play className="w-3 h-3 fill-slate-950 text-slate-950 stroke-[3] ml-0.5" />
                              </button>
                            ) : (
                              <div className="w-7.5 h-7.5" />
                            )}

                            {isCopied ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-455 transition-all animate-pulse">COPIADO!</span>
                            ) : null}

                            <ChevronRight 
                              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 shrink-0"
                              style={{ color: folderColor.primary }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {dashboardTab === 'projects' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" /> Projetos Criativos
              </h3>
              <p className="text-slate-405 text-xs mt-0.5 font-medium">Painel para organizar projetos criativos, lançamentos, parcerias e fã-clubes.</p>
            </div>
          </div>

          <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-850 p-6 max-w-xl mx-auto space-y-4">
            <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-2 animate-bounce" />
            <h4 className="text-base font-bold text-slate-305 uppercase">Módulo de Projetos Criativos</h4>
            <p className="text-xs text-slate-450 font-mono leading-relaxed">
              Estamos preparando um módulo incrível onde você poderá gerenciar álbuns completos, frentes de pré-save, controle de lançamentos e distribuição direta de letras para parceiros. Receba novidades em breve!
            </p>
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full">
                Em Breve • Pro & Premium
              </span>
            </div>
          </div>
        </div>
      )}

      {dashboardTab === 'shares' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" /> Relatório de Divulgação
              </h3>
              <p className="text-slate-405 text-xs mt-0.5 font-medium">Monitore o alcance dos seus links, acessos por região e número de audições.</p>
            </div>
          </div>

          <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-850 p-6 max-w-xl mx-auto space-y-4">
            <Globe className="w-12 h-12 text-slate-500 mx-auto mb-2 animate-pulse" />
            <h4 className="text-base font-bold text-slate-305 uppercase font-heading">Estatísticas Avançadas de Tráfego</h4>
            <p className="text-xs text-slate-455 font-mono leading-relaxed">
              Monitore de onde vêm os seus ouvintes, quais estados têm maior interesse nas suas composições e o tempo médio de audição de cada faixa.
            </p>
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full animate-pulse">
                Exclusivo para assinantes
              </span>
            </div>
          </div>
        </div>
      )}

      </main>

      {/* MODAL / ADD MUSIC LAYOVER DIALOG */}
      {showAddForm && (
        <div id="add-music-modal-container" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[95vh] overflow-y-auto">
            
            {isUploading && (
              <div className="absolute inset-0 z-50 bg-slate-950/95 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-heading font-black tracking-wide text-white uppercase">Sincronizando com Firebase Storage e R2</h4>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Sua música está sendo processada físicamente, analisando o hash SHA-256 contra repetições e vinculando seus repertórios com segurança...
                  </p>
                </div>
                <div className="w-48 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-orange-400 font-bold">{uploadProgress}% concluído</span>
              </div>
            )}

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-heading font-black text-lg uppercase tracking-tight text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-orange-500" /> Cadastrar Composições
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase font-mono"
              >
                Fechar
              </button>
            </div>

            {/* Sub-header text indicating simplified single-screen registry */}
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-left">
              <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-wider mb-0.5">Novo Envio de Composições</h4>
              <p className="text-[11px] text-slate-400">Preencha os metadados básicos, anexe suas guias MP3 e organize seu lançamento em uma única etapa simples.</p>
            </div>

            {formError && (
              <div id="form-error-msg" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMusic} className="space-y-5">
              
              {/* Grid 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Título da Música *</label>
                  <input 
                    id="track-title"
                    type="text" 
                    placeholder="Ex: Coração de Pedra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none font-sans"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Musical (Gênero) *</label>
                  <input 
                    id="track-genre"
                    type="text" 
                    placeholder="Ex: Sertanejo"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none font-sans"
                  />
                </div>
              </div>

              {/* Grid 2: Composer, Singer & Partners */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Compositor (Autor) *</label>
                  <input 
                    id="track-composer"
                    type="text" 
                    placeholder="Ex: Nome do Compositor"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none font-sans"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Intérprete / Cantor *</label>
                  <input 
                    id="track-singer"
                    type="text" 
                    placeholder="Ex: Cantor ou Banda"
                    value={singer}
                    onChange={(e) => setSinger(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none font-sans"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Parceiros (Co-autorias) / Divisões</label>
                  <input 
                    id="track-partners"
                    type="text" 
                    placeholder="Ex: Pedro 50%, João 50%"
                    value={partners}
                    onChange={(e) => setPartners(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none font-sans"
                  />
                </div>
              </div>

              {/* Grid 3: Audio Upload Source */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Arquivo MP3 da Música (Guia)</label>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setAudioOption('file')}
                    className={`text-xs px-3.5 py-2 rounded-xl border font-mono uppercase font-semibold transition cursor-pointer select-none ${
                      audioOption === 'file' 
                        ? 'bg-slate-950 border-orange-500/50 text-orange-400' 
                        : 'bg-slate-950/45 border-slate-880 text-slate-500'
                    }`}
                  >
                    Arquivo Local MP3
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioOption('url')}
                    className={`text-xs px-3.5 py-2 rounded-xl border font-mono uppercase font-semibold transition cursor-pointer select-none ${
                      audioOption === 'url' 
                        ? 'bg-slate-950 border-orange-500/50 text-orange-400' 
                        : 'bg-slate-950/45 border-slate-880 text-slate-500'
                    }`}
                  >
                    Link Externo (URL)
                  </button>
                </div>

                {audioOption === 'file' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-slate-850 hover:border-orange-500/40 rounded-2xl p-6 text-center bg-slate-950/40 transition cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept=".mp3,audio/mpeg"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const filesArr = Array.from(e.target.files) as File[];
                            
                            // Formato aceito: somente MP3. Validar tipo MIME se existir ou a extensão
                            const invalidFormat = filesArr.some(f => {
                              const fileExt = '.' + f.name.split('.').pop()?.toLowerCase();
                              const mimeLower = f.type.toLowerCase();
                              const isMp3Mime = mimeLower === 'audio/mpeg' || mimeLower === 'audio/mp3' || mimeLower === 'audio/x-mpeg' || mimeLower === 'audio/x-mp3' || mimeLower === 'audio/mpeg3';
                              const isMp3Ext = fileExt === '.mp3';
                              return !isMp3Mime && !isMp3Ext;
                            });

                            if (invalidFormat) {
                              setFormError('Todos os arquivos enviados devem estar no formato MP3!');
                              return;
                            }

                            // Limite técnico máximo: 6 MB
                            const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;
                            const invalidSize = filesArr.some(f => f.size > MAX_AUDIO_SIZE_BYTES);
                            if (invalidSize) {
                              setFormError('Este arquivo possui mais de 6 MB. Converta a música para MP3 em 96 ou 128 kbps e tente novamente.');
                              return;
                            }

                            setFormError('');
                            setAudioFiles(filesArr);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <UploadCloud className="w-10 h-10 text-orange-500/60 group-hover:text-orange-500 mx-auto mb-2 transition" />
                      <span className="block text-xs font-bold text-white uppercase font-sans">Selecione uma ou múltipla guia MP3</span>
                      <span className="block text-[10px] text-slate-500 mt-1 font-mono">Arraste arquivos ou clique para buscar</span>
                    </div>

                    {/* Orientations Block */}
                    <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-2 text-left text-xs text-slate-300">
                      <p className="font-sans leading-relaxed text-slate-350">
                        “Para carregamento mais rápido no celular e no carro, recomendamos arquivos MP3 entre 2 MB e 5 MB.”
                      </p>
                      <p className="font-sans font-bold text-orange-400">
                        “Arquivos de até 6 MB também são aceitos.”
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        “Arquivos leves carregam mais rápido e ajudam a reduzir o consumo de dados móveis durante a reprodução.”
                      </p>
                      <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px] font-mono text-slate-400">
                        <div>• Formato aceito: <span className="text-slate-200 font-bold">somente MP3</span></div>
                        <div>• Tamanho recomendado: <span className="text-slate-200 font-bold">entre 2 MB e 5 MB</span></div>
                        <div>• Limite técnico máximo: <span className="text-slate-200 font-bold">6 MB</span></div>
                        <div>• Qualidade recomendada: <span className="text-slate-200 font-bold">96 kbps ou 128 kbps</span></div>
                      </div>
                    </div>

                    {audioFiles.length > 0 && (
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-1.5">
                        <span className="text-[9.5px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block mb-1">Arquivos selecionados ({audioFiles.length}):</span>
                        <div className="max-h-32 overflow-y-auto space-y-1 divide-y divide-slate-900/50 pr-1">
                          {audioFiles.map((f, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] py-1 text-slate-300 font-mono">
                              <span className="truncate max-w-[280px]">🎧 {f.name}</span>
                              <span className="text-[9px] text-slate-500 select-none">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input 
                      type="url" 
                      placeholder="https://exemplo.com/musica.mp3"
                      value={customAudioUrl}
                      onChange={(e) => setCustomAudioUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Grid 4: Lyrics & Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Ficha Técnica da Música</label>
                  <textarea 
                    placeholder="Detalhes adicionais, tom, arranjo, instrumentos utilizados..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition font-sans"
                  ></textarea>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Letra Completa</label>
                  <textarea 
                    placeholder="Cole aqui a letra completa para que os ouvintes possam acompanhar."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition font-sans"
                  ></textarea>
                </div>
              </div>

              {/* Grid 5: Privacy/Status */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-1.5">Status / Visibilidade da Música</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setNewTrackStatus('active')}
                    className={`p-3 rounded-xl border text-left transition select-none cursor-pointer ${
                      newTrackStatus === 'active' 
                        ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase flex items-center gap-1.5 font-mono mb-1">
                      <span className={`w-2 h-2 rounded-full ${newTrackStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      Ativo / Público Livre
                    </span>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">Disponível no catálogo geral público e visível imediatamente.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTrackStatus('inactive')}
                    className={`p-3 rounded-xl border text-left transition select-none cursor-pointer ${
                      newTrackStatus === 'inactive' 
                        ? 'bg-rose-950/25 border-[#f43f5e]/50 text-[#f43f5e]' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase flex items-center gap-1.5 font-mono mb-1">
                      <span className={`w-2 h-2 rounded-full ${newTrackStatus === 'inactive' ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                      Inativo / Privado Oculto
                    </span>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">Fica com acesso privado restrito, ocultada dos canais públicos.</p>
                  </button>
                </div>
              </div>

              {/* NEW SECTION: ORGANIZAÇÃO */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4 text-left">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-wider">
                    ORGANIZAÇÃO
                  </h4>
                  <p className="text-[11px] text-slate-300 font-bold uppercase font-sans mt-0.5">
                    ONDE VOCÊ DESEJA ORGANIZAR ESTA MÚSICA?
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. TODAS AS MÚSICAS */}
                  <button 
                    type="button"
                    onClick={() => {
                      setOrganizationOption('all_songs');
                      setSelectedRepertoireIds([]);
                    }}
                    className={`p-3 border rounded-xl cursor-pointer transition text-left select-none outline-none focus:outline-none ${
                      organizationOption === 'all_songs' 
                        ? 'bg-[#0f172a] border-orange-500/60 text-white shadow-md' 
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase text-slate-200">1. TODAS AS MÚSICAS</div>
                    <div className="text-[10px] text-slate-500 mt-1">“Salvar normalmente no meu acervo.”</div>
                  </button>

                  {/* 2. REPERTÓRIO EXISTENTE */}
                  <button 
                    type="button"
                    onClick={() => {
                      if (dashboardRepertoires.length === 0) {
                        setFormError('Você ainda não possui nenhum repertório cadastrado. Escolha a opção "Criar Novo Repertório" para montar o primeiro.');
                      } else {
                        setFormError('');
                        setOrganizationOption('existing_repertoire');
                      }
                    }}
                    className={`p-3 border rounded-xl cursor-pointer transition text-left select-none outline-none focus:outline-none ${
                      organizationOption === 'existing_repertoire' 
                        ? 'bg-[#0f172a] border-orange-500/60 text-white shadow-md' 
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase text-slate-200">2. REPERTÓRIO EXISTENTE</div>
                    <div className="text-[10px] text-slate-500 mt-1">“Adicionar a um repertório já criado.”</div>
                  </button>

                  {/* 3. CRIAR NOVO REPERTÓRIO */}
                  <button 
                    type="button"
                    onClick={() => {
                      setFormError('');
                      setOrganizationOption('new_repertoire');
                    }}
                    className={`p-3 border rounded-xl cursor-pointer transition text-left select-none outline-none focus:outline-none ${
                      organizationOption === 'new_repertoire' 
                        ? 'bg-[#0f172a] border-orange-500/60 text-white shadow-md' 
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs uppercase text-slate-200">3. CRIAR NOVO REPERTÓRIO</div>
                    <div className="text-[10px] text-slate-500 mt-1">“Criar um novo repertório para esta música.”</div>
                  </button>
                </div>

                {/* Conditional fields based on selection */}
                {organizationOption === 'existing_repertoire' && (
                  <div className="mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2 animate-fadeIn">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Selecione o Repertório Existente:</label>
                    <select
                      value={selectedRepertoireIds[0] || ""}
                      onChange={(e) => {
                        setSelectedRepertoireIds(e.target.value ? [e.target.value] : []);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg outline-none text-zinc-350 focus:border-orange-500 font-sans"
                    >
                      <option value="">-- Selecione o Repertório (Ex: Românticas, Animadas...) --</option>
                      {dashboardRepertoires.map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {organizationOption === 'new_repertoire' && (
                  <div className="mt-2 bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-3 animate-fadeIn">
                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase">Nome do Repertório *</label>
                      <input 
                        type="text"
                        placeholder="Nome do repertório (Ex: Românticas, Sertanejas...)"
                        value={newRepertoireName}
                        onChange={(e) => setNewRepertoireName(e.target.value)}
                        required={organizationOption === 'new_repertoire'}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:border-orange-500 outline-none text-white font-sans"
                      />
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-mono text-zinc-400 uppercase">Descrição Opcional</label>
                      <input 
                        type="text"
                        placeholder="Ex: Músicas românticas para show acústico"
                        value={newRepertoireDesc}
                        onChange={(e) => setNewRepertoireDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:border-orange-500 outline-none text-white font-sans"
                      />
                    </div>

                    <div className="pt-2 flex justify-start">
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-lg text-[11px] font-heading font-black uppercase text-slate-950 transition cursor-pointer select-none font-bold"
                      >
                        {isUploading ? "PROCESSANDO..." : "Criar e adicionar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition cursor-pointer"
                >
                  Cancelar
                </button>
                
                {organizationOption !== 'new_repertoire' && (
                  <button 
                    id="submit-new-track"
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 cursor-pointer select-none transition-transform active:scale-98 font-bold flex items-center gap-1.5 border-0 focus:outline-none"
                  >
                    {isUploading ? (
                      <>Sincronizando...</>
                    ) : (
                      <>Salvar composição</>
                    )}
                  </button>
                )}
              </div>

            </form>

            {/* Hidden wrapper containing redundant steps to avoid original file code structure breaking */}
            {false && (
              <div className="hidden opacity-0">
              {uploadStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider mb-1">Passo 1: Identificação Básica</h4>
                    <p className="text-[11px] text-slate-400">Insira as informações autorais. Se enviar múltiplos arquivos no Passo 2, estes metadados servirão como modelo padrão.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Título da Música {audioFiles.length <= 1 && '*'}</label>
                      <input 
                        type="text" 
                        placeholder={audioFiles.length > 1 ? "Opcional (Usa nome de arquivo)" : "Ex: Coração de Pedra"}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required={audioFiles.length <= 1}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Musical (Gênero)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Sertanejo Universitário"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Compositor (Autor) *</label>
                      <input 
                        type="text" 
                        placeholder="Nome do compositor"
                        value={composer || profile.name}
                        onChange={(e) => setComposer(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Intérprete / Cantor *</label>
                      <input 
                        type="text" 
                        placeholder="Cantor ou banda principal"
                        value={singer || profile.name}
                        onChange={(e) => setSinger(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Co-autorias / Divisões</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Pedro 50%, João 25%"
                        value={partners}
                        onChange={(e) => setPartners(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        if (audioFiles.length <= 1 && !title.trim()) {
                          setFormError('O título da música é obrigatório para cadastros singulares.');
                        } else {
                          setFormError('');
                          setUploadStep(2);
                        }
                      }}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1 cursor-pointer transition select-none"
                    >
                      Avançar para Áudio <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 2: MP3 FILE SOURCE */}
              {uploadStep === 2 && (
                <div className="space-y-4 animate-fadeIn text-left">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-1">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider">Passo 2: Arquivo de Som (MP3 Máx 6 MB)</h4>
                    <p className="text-[11px] text-slate-400">Arraste um ou mais arquivos. Nosso banco utiliza hashing criptográfico para rejeitar arquivos binários duplicados.</p>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => setAudioOption('file')}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-mono uppercase font-semibold transition ${
                        audioOption === 'file' 
                          ? 'bg-slate-950 border-orange-500/50 text-orange-400' 
                          : 'bg-slate-950/45 border-slate-800 text-slate-500'
                      }`}
                    >
                      Arquivo Local MP3
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudioOption('url')}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-mono uppercase font-semibold transition ${
                        audioOption === 'url' 
                          ? 'bg-slate-950 border-orange-500/50 text-orange-400' 
                          : 'bg-slate-950/45 border-slate-800 text-slate-500'
                      }`}
                    >
                      Link Externo (URL)
                    </button>
                  </div>

                  {audioOption === 'file' ? (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-slate-800 hover:border-orange-500/40 rounded-2xl p-6 text-center bg-slate-950/40 transition cursor-pointer relative group">
                        <input 
                          type="file" 
                          accept=".mp3,audio/mpeg"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const filesArr = Array.from(e.target.files) as File[];
                              
                              // Validate MP3 format (ext or mime type)
                              const invalidFormat = filesArr.some(f => {
                                const fileExt = '.' + f.name.split('.').pop()?.toLowerCase();
                                const mimeLower = f.type.toLowerCase();
                                const isMp3Mime = mimeLower === 'audio/mpeg' || mimeLower === 'audio/mp3' || mimeLower === 'audio/x-mpeg' || mimeLower === 'audio/x-mp3' || mimeLower === 'audio/mpeg3';
                                const isMp3Ext = fileExt === '.mp3';
                                return !isMp3Mime && !isMp3Ext;
                              });

                              if (invalidFormat) {
                                setFormError('Todos os arquivos enviados devem estar no formato MP3!');
                                return;
                              }

                              // Limite técnico máximo: 6 MB
                              const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;
                              const invalidSize = filesArr.some(f => f.size > MAX_AUDIO_SIZE_BYTES);
                              if (invalidSize) {
                                setFormError('Este arquivo possui mais de 6 MB. Converta a música para MP3 em 96 ou 128 kbps e tente novamente.');
                                return;
                              }

                              setFormError('');
                              setAudioFiles(filesArr);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <UploadCloud className="w-10 h-10 text-orange-500/60 group-hover:text-orange-500 mx-auto mb-2.5 transition" />
                        <span className="block text-xs font-bold text-white uppercase font-sans">Selecione uma ou várias guias MP3</span>
                        <span className="block text-[10px] text-slate-500 mt-1 font-mono">Arraste arquivos ou clique para buscar</span>
                      </div>

                      {/* Orientations Block */}
                      <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-2 text-left text-xs text-slate-300">
                        <p className="font-sans leading-relaxed text-slate-350">
                          “Para carregamento mais rápido no celular e no carro, recomendamos arquivos MP3 entre 2 MB e 5 MB.”
                        </p>
                        <p className="font-sans font-bold text-orange-400">
                          “Arquivos de até 6 MB também são aceitos.”
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          “Arquivos leves carregam mais rápido e ajudam a reduzir o consumo de dados móveis durante a reprodução.”
                        </p>
                        <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5px] font-mono text-slate-400">
                          <div>• Formato aceito: <span className="text-slate-200 font-bold">somente MP3</span></div>
                          <div>• Tamanho recomendado: <span className="text-slate-200 font-bold">entre 2 MB e 5 MB</span></div>
                          <div>• Limite técnico máximo: <span className="text-slate-200 font-bold">6 MB</span></div>
                          <div>• Qualidade recomendada: <span className="text-slate-200 font-bold">96 kbps ou 128 kbps</span></div>
                        </div>
                      </div>

                      {audioFiles.length > 0 && (
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-1.5">
                          <span className="text-[9.5px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block mb-1">Arquivos selecionados ({audioFiles.length}):</span>
                          <div className="max-h-32 overflow-y-auto space-y-1 divide-y divide-slate-900/50 pr-1">
                            {audioFiles.map((f, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] py-1 text-slate-300 font-mono">
                                <span className="truncate max-w-[340px]">🎧 {f.name}</span>
                                <span className="text-[10px] text-slate-500 select-none">({(f.size / (1024 * 1024)).toFixed(2)} MB)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Endereço da música (Stream URL)</label>
                      <input 
                        type="url" 
                        placeholder="https://exemplo.com/musica.mp3"
                        value={customAudioUrl}
                        onChange={(e) => setCustomAudioUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850/40">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(1)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (audioOption === 'file' && audioFiles.length === 0) {
                          setFormError('Faça upload de pelo menos uma guia MP3 para prosseguir.');
                        } else if (audioOption === 'url' && !customAudioUrl.trim()) {
                          setFormError('Insira uma URL pública estruturada para a música.');
                        } else {
                          setFormError('');
                          setUploadStep(3);
                        }
                      }}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1 cursor-pointer transition select-none"
                    >
                      Avançar para Letras <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 3: LYRICS & TECH DETAILS */}
              {uploadStep === 3 && (
                <div className="space-y-4 animate-fadeIn text-left">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider mb-1">Passo 3: Letra & Inspiração</h4>
                    <p className="text-[11px] text-slate-400">Ofereça letras detalhadas para que possíveis compradores possam acompanhar a métrica e a poesia.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Descrição criativa (Ficha Técnica / Gênese da composição)</label>
                    <textarea 
                      placeholder="Ex: Escrita em parceria após assistir ao pôr do sol na beira do rio. Clima acústico romântico..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Letra Completa</label>
                    <textarea 
                      placeholder="Espaço reservado para a letra integral da obra..."
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850/40">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(2)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormError('');
                        setUploadStep(4);
                      }}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1 cursor-pointer transition select-none"
                    >
                      Avançar para Destino <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 4: MUSIC ORGANIZATION OPTIONS (THE INTENT AND DECISION OF SAVE DESTINY) */}
              {uploadStep === 4 && (
                <div className="space-y-4 animate-fadeIn text-left">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl mb-2">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider mb-1">Passo 4: Organização do Catálogo</h4>
                    <p className="text-[11.5px] text-orange-400 font-semibold font-mono uppercase">Onde você deseja organizar esta(s) música(s)?</p>
                  </div>

                  <div className="space-y-3">
                    {/* Option 1: Save only on All Songs (General Catalog) */}
                    <div 
                      onClick={() => setOrganizationOption('all_songs')}
                      className={`p-4 border border-slate-850 hover:border-orange-500/45 rounded-2xl cursor-pointer transition flex items-start gap-3.5 select-none ${
                        organizationOption === 'all_songs' 
                          ? 'bg-[#0f172a] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.04)] text-white' 
                          : 'bg-slate-950/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <Folders className={`w-5 h-5 shrink-0 mt-0.5 ${organizationOption === 'all_songs' ? 'text-orange-400' : 'text-slate-500'}`} />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide">Salvar como Música Avulsa (Não entra em nenhuma pasta/repertório)</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Sua música será arquivada e listada no catálogo principal, mas não fará parte de nenhum repertório ou pasta.</p>
                      </div>
                    </div>

                    {/* Option 2: Add to existing repertoire */}
                    <div 
                      onClick={() => {
                        if (dashboardRepertoires.length === 0) {
                          setFormError('Você ainda não possui nenhum repertório cadastrado. Selecione outra opção ou crie um novo abaixo.');
                        } else {
                          setFormError('');
                          setOrganizationOption('existing_repertoire');
                        }
                      }}
                      className={`p-4 border border-slate-850 hover:border-orange-500/45 rounded-2xl cursor-pointer transition flex items-start gap-3.5 select-none ${
                        organizationOption === 'existing_repertoire' 
                          ? 'bg-[#0f172a] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.04)] text-white' 
                          : 'bg-slate-950/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <ListChecks className={`w-5 h-5 shrink-0 mt-0.5 ${organizationOption === 'existing_repertoire' ? 'text-orange-400' : 'text-slate-500'}`} />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide">Escolher uma Pasta/Repertório existente</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Associe estas gravações diretamente em um repertório existente.</p>
                        
                        {organizationOption === 'existing_repertoire' && dashboardRepertoires.length > 0 && (
                          <div className="mt-4 bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block mb-1">Selecione uma ou mais pastas:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {dashboardRepertoires.map(rep => {
                                const isChecked = selectedRepertoireIds.includes(rep.id);
                                return (
                                  <label key={rep.id} className="flex items-center gap-2 text-xs py-1 px-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:border-zinc-700 cursor-pointer select-none">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSelectedRepertoireIds(prev => prev.filter(id => id !== rep.id));
                                        } else {
                                          setSelectedRepertoireIds(prev => [...prev, rep.id]);
                                        }
                                      }}
                                      className="accent-orange-500"
                                    />
                                    <span className="truncate">{rep.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option 3: Create new Repertoire */}
                    <div 
                      onClick={() => setOrganizationOption('new_repertoire')}
                      className={`p-4 border border-slate-850 hover:border-orange-500/45 rounded-2xl cursor-pointer transition flex items-start gap-3.5 select-none ${
                        organizationOption === 'new_repertoire' 
                          ? 'bg-[#0f172a] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.04)] text-white' 
                          : 'bg-slate-950/50 border-slate-800 text-slate-300'
                      }`}
                    >
                      <FolderPlus className={`w-5 h-5 shrink-0 mt-0.5 ${organizationOption === 'new_repertoire' ? 'text-orange-400' : 'text-slate-500'}`} />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide">Criar uma nova Pasta/Repertório</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Cria simultaneamente um novo repertório público ou privado e associa a música a ele.</p>

                        {organizationOption === 'new_repertoire' && (
                          <div className="mt-4 bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block">Dados do Novo Repertório:</span>
                            
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-400 uppercase">Nome do Repertório *</label>
                                <input 
                                  type="text"
                                  placeholder="Ex: Trabalho Sertanejo Romântico"
                                  value={newRepertoireName}
                                  onChange={(e) => setNewRepertoireName(e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:border-orange-500 outline-none text-white font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-400 uppercase">Descrição Curta</label>
                                <input 
                                  type="text"
                                  placeholder="Ex: Repertório oficial de trabalho enviado para produtores da Som Livre."
                                  value={newRepertoireDesc}
                                  onChange={(e) => setNewRepertoireDesc(e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:border-orange-500 outline-none text-white font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Classificação</label>
                                  <select
                                    value={newRepertoireType}
                                    onChange={(e: any) => setNewRepertoireType(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg outline-none text-zinc-350 font-sans focus:border-orange-500"
                                  >
                                    <option value="repertoire">Repertório</option>
                                    <option value="playlist">Seleção</option>
                                    <option value="collection">Pasta Particular</option>
                                    <option value="project">Projeto</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase">Privacidade</label>
                                  <select
                                    value={newRepertoireVisibility}
                                    onChange={(e: any) => setNewRepertoireVisibility(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg outline-none text-zinc-350 font-sans focus:border-orange-500"
                                  >
                                    <option value="public">Público (Visível no Link)</option>
                                    <option value="private">Privado (Invisível no Link Geral)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850/40">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(3)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (organizationOption === 'new_repertoire' && !newRepertoireName.trim()) {
                          setFormError('Por favor, defina um nome para o novo de repertório.');
                        } else if (organizationOption === 'existing_repertoire' && selectedRepertoireIds.length === 0) {
                          setFormError('Por favor, selecione pelo menos uma pasta/repertório na lista.');
                        } else {
                          setFormError('');
                          setUploadStep(5);
                        }
                      }}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1 cursor-pointer transition select-none"
                    >
                      Avançar para Visual <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 5: VISIBILITY & COVER */}
              {uploadStep === 5 && (
                <div className="space-y-4 animate-fadeIn text-left">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider mb-1">Passo 5: Capa de Arte & Privacidade</h4>
                    <p className="text-[11px] text-slate-400">Escolha como a música será indexada publicamente e configure a capa.</p>
                  </div>

                  {/* Visibility choices */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-1.5">Quem pode ouvir na web?</label>
                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setNewTrackStatus('active')}
                        className={`p-3.5 rounded-xl border text-left transition select-none cursor-pointer ${
                          newTrackStatus === 'active' 
                            ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <h4 className="text-[11.5px] font-bold uppercase flex items-center gap-1.5 font-mono">
                          <Globe className="w-4 h-4 text-emerald-400" /> Público / Livre
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">Indexado em sua vitrine principal no catálogo público.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTrackStatus('inactive')}
                        className={`p-3.5 rounded-xl border text-left transition select-none cursor-pointer ${
                          newTrackStatus === 'inactive' 
                            ? 'bg-rose-950/25 border-[#f43f5e]/50 text-[#f43f5e]' 
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <h4 className="text-[11.5px] font-bold uppercase flex items-center gap-1.5 font-mono">
                          <Lock className="w-4 h-4 text-rose-450" /> Privado / Oculto
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">Apenas você visualiza no painel principal, ideal para rascunhos.</p>
                      </button>
                    </div>
                  </div>

                  {/* Cover options */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block leading-none">Imagens da Música (Capa de Álbum)</label>
                    <div className="flex items-center gap-3">
                      {['preset', 'file', 'url'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCoverOption(opt as any)}
                          className={`text-xs px-3.5 py-1.5 rounded-xl border font-mono uppercase transition font-bold ${
                            coverOption === opt 
                              ? 'bg-slate-950 border-orange-500/50 text-orange-400' 
                              : 'bg-slate-950/50 border-slate-800 text-slate-500'
                          }`}
                        >
                          {opt === 'preset' ? 'Gerar Aleatório' : opt === 'file' ? 'Arquivo' : 'Link Web'}
                        </button>
                      ))}
                    </div>

                    {coverOption === 'file' && (
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => e.target.files && setCoverFile(e.target.files[0])}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-slate-950 file:text-orange-400 hover:file:bg-slate-850 cursor-pointer"
                      />
                    )}

                    {coverOption === 'url' && (
                      <input 
                        type="url" 
                        placeholder="https://images.unsplash.com/photo-..."
                        value={customCoverUrl}
                        onChange={(e) => setCustomCoverUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850/40">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(4)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormError('');
                        setUploadStep(6);
                      }}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-mono font-bold uppercase text-slate-950 flex items-center gap-1 cursor-pointer transition select-none"
                    >
                      Avançar para Revisão <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 6: FINAL REVIEW AND COMMIT */}
              {uploadStep === 6 && (
                <div className="space-y-4 animate-fadeIn text-left">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                    <h4 className="text-xs font-mono font-bold text-yellow-500 uppercase tracking-wider mb-1">Passo 6: Conferir Dados do Cadastro</h4>
                    <p className="text-[11px] text-slate-400">Excelente! Seus dados foram validados localmente. Confira abaixo o sumário de sincronização antes de publicar.</p>
                  </div>

                  <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-850 space-y-3 font-mono text-[11.5px] text-slate-300">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-900">
                      <span>Total de Guia(s) MP3:</span>
                      <span className="text-white font-extrabold">{audioOption === 'file' ? audioFiles.length : 1} arquivo(s)</span>
                    </div>

                    <div className="pb-1.5 border-b border-slate-900 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase">Nomes a Registrar:</span>
                      <div className="pl-3 space-y-0.5 text-[11px] max-h-20 overflow-y-auto">
                        {audioOption === 'file' ? (
                          audioFiles.map((file, idx) => {
                            const songTitle = audioFiles.length === 1 && title.trim() 
                              ? title.trim() 
                              : file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
                            return (
                              <div key={idx} className="truncate text-yellow-500">
                                #{idx + 1}: {songTitle}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-yellow-500 font-bold">{title}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-1.5 border-b border-slate-900">
                      <div>
                        <span className="text-[9.5px] uppercase text-slate-500 block">Autor / Intérprete:</span>
                        <span className="text-white font-bold">{composer || profile.name} / {singer || profile.name}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase text-slate-500 block">Gênero Tema:</span>
                        <span className="text-white font-bold">{genre || 'Sertanejo'}</span>
                      </div>
                    </div>

                    <div className="pb-1 text-slate-300">
                      <span className="text-[9.5px] uppercase text-slate-500 block">Dísticos de Organização:</span>
                      {organizationOption === 'all_songs' && (
                        <span className="text-emerald-400">✓ Salvar somente no meu acervo principal ("Todas as Músicas")</span>
                      )}
                      {organizationOption === 'existing_repertoire' && (
                        <span className="text-yellow-400">✓ Associar a {selectedRepertoireIds.length} repertório(s) que já criei</span>
                      )}
                      {organizationOption === 'new_repertoire' && (
                        <span className="text-orange-400">✓ Criar novo repertório: "{newRepertoireName}" ({newRepertoireType})</span>
                      )}
                      {organizationOption === 'each_separately' && (
                        <span className="text-yellow-400">✓ Organizar cada arquivo MP3 independentemente</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-850/40">
                    <button 
                      type="button" 
                      onClick={() => setUploadStep(5)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold uppercase text-slate-400 transition"
                    >
                      Voltar
                    </button>
                    
                    <button 
                      id="submit-new-track"
                      type="submit"
                      disabled={isUploading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 cursor-pointer select-none transition-transform active:scale-98 font-bold flex items-center gap-1.5 border-0 focus:outline-none"
                    >
                      {isUploading ? (
                        <>Sincronizando...</>
                      ) : (
                        <>Sincronizar com SomDrive</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* QUICK REPERTOIRE ASSOCIATION MODAL */}
      {showRepActionModal && selectedTrackForRepAction && (
        <div id="repertoire-action-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
                <Folders className="w-5 h-5 text-orange-500 animate-pulse" /> Organização de Repertórios
              </h3>
              <button 
                onClick={() => {
                  setShowRepActionModal(false);
                  setSelectedTrackForRepAction(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-mono font-bold uppercase"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850/80">
              <span className="text-[9px] font-mono text-slate-500 uppercase block leading-none mb-1">Música Selecionada:</span>
              <h4 className="text-sm font-heading font-black text-white">{selectedTrackForRepAction.title}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Autor: {selectedTrackForRepAction.composer || 'Sem registro'} • Estilo: {selectedTrackForRepAction.genre || 'Geral'}</p>
            </div>

            <form onSubmit={handleSaveRepAction} className="space-y-5">
              
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block">Selecione os repertórios destino abaixo:</label>
                
                {dashboardRepertoires.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl bg-slate-950 border border-slate-850">
                    <p className="text-xs text-slate-400">Você ainda não tem nenhum repertório ou pasta criada no SomDrive.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {dashboardRepertoires.map((rep) => {
                      const isChecked = !!activeTrackRepCheckboxes[rep.id];
                      return (
                        <div 
                          key={rep.id} 
                          onClick={() => {
                            setActiveTrackRepCheckboxes(prev => ({
                              ...prev,
                              [rep.id]: !isChecked
                            }));
                          }}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition select-none ${
                            isChecked 
                              ? 'bg-[#0f172a] border-orange-500/50 text-white' 
                              : 'bg-slate-950/40 border-slate-850 text-slate-350 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Folders className="w-4 h-4 text-slate-500 shrink-0" />
                            <div>
                              <span className="text-xs font-bold font-sans block">{rep.name}</span>
                              <span className="text-[9.5px] text-slate-500 font-mono tracking-wider block uppercase">{rep.type || 'repertoire'} • {rep.trackIds?.length || 0} música(s)</span>
                            </div>
                          </div>
                          
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by row onClick
                            className="accent-orange-500 shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggle new repertoire generation on-the-fly nested workflow */}
              <div className="border-t border-slate-850 pt-4 text-left">
                <button
                  type="button"
                  onClick={() => {
                    // Toggle form visibility
                    if (newRepertoireName) {
                      setNewRepertoireName('');
                    } else {
                      setNewRepertoireName('Repertório de Trabalho ' + (dashboardRepertoires.length + 1));
                    }
                  }}
                  className="text-[11px] font-mono font-bold uppercase text-orange-400 hover:text-orange-300 transition flex items-center gap-1 cursor-pointer select-none"
                >
                  <FolderPlus className="w-4 h-4" />
                  {newRepertoireName ? '[- Cancela criação de nova pasta]' : '[+ Criar uma nova pasta e associar já]'}
                </button>

                {newRepertoireName && (
                  <div className="mt-4 p-4 bg-slate-950/90 rounded-2xl border border-slate-850 space-y-3.5 animate-fadeIn">
                    <span className="text-[9px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block mb-1">Dados da Nova Pasta / Playlist:</span>
                    
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase">Nome da Pasta *</label>
                        <input 
                          type="text"
                          placeholder="Ex: Trabalho Comercial"
                          value={newRepertoireName}
                          onChange={(e) => setNewRepertoireName(e.target.value)}
                          required
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-850 rounded-lg focus:border-orange-500 outline-none text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-400 uppercase">Descrição Curta</label>
                        <input 
                          type="text"
                          placeholder="Ex: Pasta rápida de audição para produtores."
                          value={newRepertoireDesc}
                          onChange={(e) => setNewRepertoireDesc(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-850 rounded-lg focus:border-orange-500 outline-none text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase">Tipo</label>
                          <select
                            value={newRepertoireType}
                            onChange={(e: any) => setNewRepertoireType(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-850 rounded-lg outline-none text-zinc-350 focus:border-orange-500"
                          >
                            <option value="repertoire">Repertório</option>
                            <option value="playlist">Seleção</option>
                            <option value="collection">Pasta Particular</option>
                            <option value="project">Projeto</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-400 uppercase">Privacidade</label>
                          <select
                            value={newRepertoireVisibility}
                            onChange={(e: any) => setNewRepertoireVisibility(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-850 rounded-lg outline-none text-zinc-350 focus:border-orange-500"
                          >
                            <option value="public">Público (Visível no Link)</option>
                            <option value="private">Privado (Link Oculto/Privado)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850/80">
                <button 
                  type="button"
                  onClick={() => {
                    setShowRepActionModal(false);
                    setSelectedTrackForRepAction(null);
                  }}
                  className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase font-mono transition rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-950 shadow-lg cursor-pointer"
                >
                  {isUploading ? 'Salvando...' : 'Salvar Organização'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL / EDIT MUSIC LAYOVER DIALOG */}
      {showEditForm && editingTrack && (
        <div id="edit-music-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto">
            
            {isUploading && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-heading font-black tracking-wide text-white uppercase">Sincronizando Alterações</h4>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Salvando as modificações da sua música com segurança em nossos bancos corporativos e sincronizando seus dados públicos...
                  </p>
                </div>
                <div className="w-48 bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-orange-400 font-bold">{uploadProgress}% concluído</span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-orange-400" /> Editar Detalhes da Música
              </h3>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingTrack(null);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase"
              >
                Fechar
              </button>
            </div>

            {formError && (
              <div id="edit-form-error-msg" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Row 1: Title & Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Título da Música *</label>
                  <input 
                    id="edit-track-title"
                    type="text" 
                    placeholder="Ex: Coração de Pedra"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Musical (Genre)</label>
                  <input 
                    id="edit-track-genre"
                    type="text" 
                    placeholder="Ex: Sertanejo Universitário"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>
              </div>

              {/* Row 2: Composer, Singer & Partners */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome do Compositor (Autor)</label>
                  <input 
                    id="edit-track-composer"
                    type="text" 
                    placeholder="Nome do compositor"
                    value={editComposer}
                    onChange={(e) => setEditComposer(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome do Intérprete / Cantor</label>
                  <input 
                    id="edit-track-singer"
                    type="text" 
                    placeholder="Cantor ou banda principal"
                    value={editSinger}
                    onChange={(e) => setEditSinger(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Parceiros / Divisões Co-autorias</label>
                  <input 
                    id="edit-track-partners"
                    type="text" 
                    placeholder="Ex: Pedro 55%, João 45%"
                    value={editPartners}
                    onChange={(e) => setEditPartners(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>
              </div>

              {/* Destination Repertoire selecting */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Destino da Música (Mover para Repertório)</label>
                <select
                  value={editRepertoireId}
                  onChange={(e) => setEditRepertoireId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none cursor-pointer"
                >
                  <option value="all_songs">Todas as músicas (Lista Geral Pública)</option>
                  {dashboardRepertoires.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      📁 {rep.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Descrição da Música (Ficha criativa / Detalhes)</label>
                <textarea 
                  placeholder="Ex: Escrita após assistir o pôr do sol na beira do rio. Ritmo romântico com arranjo de cordas de aço e violoncelo."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition"
                ></textarea>
              </div>

              {/* Lyrics text box */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Letra da Música (Opcional)</label>
                <textarea 
                  placeholder="Cole aqui a letra completa da música para os seus ouvintes e intérpretes acompanharem."
                  value={editLyrics}
                  onChange={(e) => setEditLyrics(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                ></textarea>
              </div>

              {/* Substituição do Áudio */}
              <div className="pt-2 pb-1 border-t border-slate-850/60 space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-1">Substituir Arquivo de Áudio (Opcional)</label>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-orange-500/50 transition relative">
                  <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewAudioFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-500" />
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-300 font-bold font-sans">
                      {newAudioFile ? newAudioFile.name : 'Clique ou arraste um novo áudio aqui'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {newAudioFile ? `${(newAudioFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Deixe em branco para manter o arquivo atual'}
                    </p>
                  </div>
                  {newAudioFile && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setNewAudioFile(null);
                      }}
                      className="px-3 py-1.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold rounded-lg hover:bg-rose-950/80 transition relative z-10 cursor-pointer"
                    >
                      Remover seleção
                    </button>
                  )}
                </div>
              </div>

              {/* Visibilidade do Catálogo */}
              <div className="pt-2 pb-1 border-t border-slate-850/60">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-2">Visibilidade no Catálogo Público</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditTrackStatus('active')}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer select-none ${
                      editTrackStatus === 'active'
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${editTrackStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span className="text-xs font-bold uppercase tracking-wider">Ativa / Visível</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-sans leading-relaxed">Seus ouvintes poderão visualizar e tocar no seu link público.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditTrackStatus('inactive')}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer select-none ${
                      editTrackStatus === 'inactive'
                        ? 'bg-rose-950/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${editTrackStatus === 'inactive' ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
                      <span className="text-xs font-bold uppercase tracking-wider">Inativa / Oculta</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-sans leading-relaxed">Oculta do seu catálogo principal público. Fica reservada privada.</p>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingTrack(null);
                    setFormError('');
                  }}
                  className="px-4 py-3 bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase transition rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  id="submit-edit-track"
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 cursor-pointer select-none transition-transform active:scale-98 font-bold"
                >
                  Salvar Alterações
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* OVERLAY: LIMIT REACHED UPGRADE MESSAGE */}
      {showLimitPrompt && (
        <div id="limit-reached-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border-2 border-orange-500/35 rounded-3xl w-full max-w-md p-6 md:p-8 text-center space-y-6 shadow-2xl relative">
            <div className="w-16 h-16 bg-orange-950/55 border border-orange-500 text-orange-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8 animate-pulse text-yellow-400" />
            </div>

            <div className="space-y-2">
              <h4 className="font-heading font-black text-xl uppercase tracking-wide text-white">
                Limite de Plano Atingido
              </h4>
              <p className="text-sm font-semibold text-orange-400">
                Você atingiu o limite do seu plano. Faça upgrade para enviar mais músicas.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Você enviou <strong className="text-orange-400">{tracks.length} de {limitCount} músicas</strong> permitidas no plano <strong className="text-orange-400 uppercase">{profile.plan}</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setShowLimitPrompt(false);
                  setShowPlans(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 text-xs uppercase font-heading font-black tracking-widest rounded-xl transition cursor-pointer font-bold shadow-lg shadow-orange-500/10"
              >
                Fazer Upgrade Agora 🚀
              </button>
              <button 
                onClick={() => setShowLimitPrompt(false)}
                className="w-full py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider transition rounded-xl cursor-pointer"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: FULL SUBSCRIPTION PLANS SCREEN */}
      {showPlans && (
        <PlansScreen 
          currentUser={profile} 
          onClose={() => setShowPlans(false)} 
          onRefreshProfile={refreshData}
        />
      )}

      {/* OVERLAY: EDIT PROFILE / PERSONALIZAR PERFIL MODAL */}
      {showProfileModal && (
        <div id="edit-profile-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto">
            
            {isSavingProfile && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-heading font-black tracking-wide text-white uppercase">Sincronizando Perfil</h4>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Armazenando seus dados artísticos, endereço de contato e biografia no banco corporativo SomDrive...
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-400" /> Personalizar Meu Perfil
                </h3>
                <p className="text-xs text-slate-400">Configure sua identidade musical, links de redes e contato para os contratantes.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase btn-close-modal"
              >
                Fechar
              </button>
            </div>

            {profError && (
              <div id="profile-form-error-msg" className="p-3 bg-red-955 border border-red-500/40 text-red-200 text-xs font-mono rounded-xl text-center">
                {profError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Profile Avatar / Photo Section */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">1. Foto do Perfil ou Logomarca</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar preview */}
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {profAvatarFile ? (
                      <img 
                        src={URL.createObjectURL(profAvatarFile)} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : profAvatarUrl ? (
                      <img 
                        src={profAvatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Disc className="w-8 h-8 text-[#d4af37] animate-spin-slow" />
                    )}
                  </div>
                  
                  {/* Upload controls */}
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label 
                        htmlFor="avatar-file-upload"
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-mono font-bold text-slate-205 cursor-pointer flex items-center gap-2 transition"
                      >
                        <UploadCloud className="w-4 h-4 text-orange-400" />
                        Escolher Foto
                      </label>
                      <input 
                        id="avatar-file-upload"
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setProfAvatarFile(e.target.files?.[0] || null)}
                        className="hidden" 
                      />
                      
                      {profAvatarFile && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 truncate max-w-[180px]">
                          ✓ {profAvatarFile.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 block">Ou cole um Link URL direto para sua foto:</span>
                      <input 
                        type="url" 
                        placeholder="https://exemplo.com/suafoto.jpg"
                        value={profAvatarUrl}
                        onChange={(e) => setProfAvatarUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs placeholder-slate-600 focus:border-orange-500 outline-none text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome Artístico / Compositor *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Mateus Costa"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">E-mail Comercial (Editável) *</label>
                  <input 
                    type="email" 
                    placeholder="Ex: contato@compositor.com.br"
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-mono"
                  />
                </div>
              </div>

              {/* Grid: WhatsApp & Instagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">WhatsApp para Contato / Negociação</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 5562999999999"
                    value={profWhatsapp}
                    onChange={(e) => setProfWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-mono"
                  />
                  <span className="text-[9px] text-slate-500 font-mono italic block">Com DDD e código do país (somente números. ex: 5562900000000)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Usuário do Instagram (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: @mateuscoficial"
                    value={profInstagram}
                    onChange={(e) => setProfInstagram(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-mono"
                  />
                </div>
              </div>

              {/* Grid: Genre & City / State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Gênero Principal</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Sertanejo Universitário"
                    value={profGenre}
                    onChange={(e) => setProfGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Goiânia"
                    value={profCity}
                    onChange={(e) => setProfCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estado (UF)</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    placeholder="Ex: GO"
                    value={profState}
                    onChange={(e) => setProfState(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Description bio / Histórico */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Sobre o Compositor e Suas Músicas (Biografia)</label>
                <textarea 
                  placeholder="Ex: Escrevo composições focadas em música sertaneja romântica e arrocha há mais de 8 anos. Meu catálogo possui guias completas com voz refinada e ótima estrutura de refrão prontos para gravação por duplas experientes ou novos talentos."
                  value={profBio}
                  onChange={(e) => setProfBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition leading-relaxed resize-none"
                ></textarea>
                <p className="text-[9.5px] text-slate-500 font-mono">Esse texto é exibido publicamente na aba "Sobre o compositor" para os visitantes.</p>
              </div>

              {/* Custom Catalog Texts Section */}
              <div className="border border-slate-800/80 bg-slate-900/30 p-4.5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-850/60 pb-2.5">
                  <div className="w-6.5 h-6.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-[11px] min-[360px]:text-[11.5px] font-mono tracking-wider font-extrabold text-white uppercase leading-none">Personalizar Rótulos e Textos</h4>
                    <p className="text-[9.5px] text-slate-500 mt-0.5">Altere os termos e títulos exibidos na sua página pública de compositor.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Badge Text */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Texto do Selo Superior</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Catálogo Verificado"
                      value={profCustomBadgeText}
                      onChange={(e) => setProfCustomBadgeText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Notice text bar */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Faixa de Aviso Secundário</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Repositório musical privado..."
                      value={profCustomNoticeText}
                      onChange={(e) => setProfCustomNoticeText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Contact button label */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Botão de Contato</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Contato"
                      value={profCustomContactLabel}
                      onChange={(e) => setProfCustomContactLabel(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Share button label */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Botão Compartilhar</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Compartilhar"
                      value={profCustomShareLabel}
                      onChange={(e) => setProfCustomShareLabel(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Right side badge title */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Cartão Lateral - Título</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Autor Verificado"
                      value={profCustomRightBadgeTitle}
                      onChange={(e) => setProfCustomRightBadgeTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Right side badge status */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Cartão Lateral - Status</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Seguro"
                      value={profCustomRightBadgeStatus}
                      onChange={(e) => setProfCustomRightBadgeStatus(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Right side badge description */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Cartão Lateral - Descrição das Obras</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Obras registradas e 100% protegidas legalmente."
                      value={profCustomRightBadgeDescription}
                      onChange={(e) => setProfCustomRightBadgeDescription(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Songs list title */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Título da Tabela de Músicas</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Composições disponíveis"
                      value={profCustomSongsListTitle}
                      onChange={(e) => setProfCustomSongsListTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>

                  {/* Songs list subtitle */}
                  <div className="space-y-1">
                    <label className="text-[9px] min-[360px]:text-[9.5px] font-mono tracking-wider font-bold text-slate-400 uppercase block">Instrução da Tabela de Músicas</label>
                    <input 
                      type="text" 
                      placeholder="Padrão: Para ouvir, clique no botão play..."
                      value={profCustomSongsListSubtitle}
                      onChange={(e) => setProfCustomSongsListSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs focus:border-emerald-500 outline-none text-white transition font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4.5 py-3 bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase transition rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  id="submit-profile-customizations"
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-yellow-500 hover:from-emerald-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/10 cursor-pointer select-none transition hover:scale-102"
                >
                  Confirmar e Salvar Perfil
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CREATE / EDIT REPERTOIRE MODAL */}
      {showCreateRep && (
        <div id="create-repertoire-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-heading font-black text-lg uppercase text-white tracking-tight flex items-center gap-2">
                <Folders className="w-5 h-5 text-orange-400" />
                {editingRepertoire ? 'Editar Repertório / Pasta' : 'Criar Novo Repertório / Pasta'}
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreateRep(false);
                  setEditingRepertoire(null);
                  setNewRepName('');
                  setNewRepDesc('');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepertoire} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Nome do Repertório / Pasta *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Show de Boteco, Acústico 2026..."
                  required
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Descrição do Repertório</label>
                <textarea 
                  placeholder="Escreva uma breve descrição ou objetivo desta pasta..."
                  rows={3}
                  value={newRepDesc}
                  onChange={(e) => setNewRepDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-sans resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Visibilidade do Repertório</label>
                <select 
                  value={newRepVisibility}
                  onChange={(e) => setNewRepVisibility(e.target.value as 'public' | 'private')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-sans"
                >
                  <option value="public" className="bg-slate-950 text-white">Público (Aparece no catálogo de compartilhamentos)</option>
                  <option value="private" className="bg-slate-950 text-white">Privado (Apenas você e quem tiver o link consegue ver)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button"
                  disabled={isSavingRepertoire}
                  onClick={() => {
                    setShowCreateRep(false);
                    setEditingRepertoire(null);
                    setNewRepName('');
                    setNewRepDesc('');
                  }}
                  className={`px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase transition rounded-xl cursor-pointer ${
                    isSavingRepertoire ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingRepertoire}
                  className={`px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 select-none transition hover:scale-102 font-bold ${
                    isSavingRepertoire ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isSavingRepertoire ? 'Gravando no Firestore...' : 'Confirmar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REPERTOIRE TRACKS (ABRIR) MODAL */}
      {viewingRepertoireTracks && (
        <div id="view-repertoire-tracks-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto">
            
            {(() => {
              // 1. Resolve tracks belonging to this repertoire using the hybrid logic
              const displayIds = isOrganizingFolderTracks 
                ? organizedFolderTrackIds 
                : (viewingRepertoireTracks.orderedTrackIds || viewingRepertoireTracks.trackIds || []);
              
              const matchedSongs = tracks.filter(t => t.repertoireId === viewingRepertoireTracks.id || displayIds.includes(t.trackId));
              
              // 2. Arrange/order them according to the ordered list
              const orderedSongs: Track[] = [];
              const matchedMap = new Map<string, Track>(matchedSongs.map(t => [t.trackId, t]));
              
              displayIds.forEach(id => {
                const track = matchedMap.get(id);
                if (track) {
                  orderedSongs.push(track);
                  matchedMap.delete(id);
                }
              });
              
              matchedMap.forEach((track: Track) => {
                orderedSongs.push(track);
              });

              // Calculate stats
              const totalSongsCount = orderedSongs.length;
              const activeSongsCount = orderedSongs.filter(t => (t.status || 'active') === 'active').length;
              const inactiveSongsCount = totalSongsCount - activeSongsCount;
              const totalPlays = orderedSongs.reduce((sum, t) => sum + (t.plays || t.playsCount || 0), 0);

              return (
                <>
                  {/* Folder Summary Header */}
                  <div className="flex flex-col border-b border-slate-800 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="font-heading font-black text-lg uppercase text-white tracking-tight flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-orange-400" />
                          {viewingRepertoireTracks.name}
                        </h3>
                        {viewingRepertoireTracks.description && (
                          <p className="text-xs text-slate-400 mt-1">
                            {viewingRepertoireTracks.description}
                          </p>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setViewingRepertoireTracks(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Stats summary grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                      <div className="text-left p-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                        <span className="block text-[9px] text-slate-500 font-mono uppercase">Músicas</span>
                        <span className="text-sm font-black text-white font-mono">{totalSongsCount}</span>
                      </div>
                      <div className="text-left p-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                        <span className="block text-[9px] text-emerald-500/80 font-mono uppercase">Ativas</span>
                        <span className="text-sm font-black text-[#1ed760] font-mono">{activeSongsCount}</span>
                      </div>
                      <div className="text-left p-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                        <span className="block text-[9px] text-rose-500/80 font-mono uppercase">Inativas</span>
                        <span className="text-sm font-black text-rose-400 font-mono">{inactiveSongsCount}</span>
                      </div>
                      <div className="text-left p-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                        <span className="block text-[9px] text-orange-500/80 font-mono uppercase">Plays da Pasta</span>
                        <span className="text-sm font-black text-orange-400 font-mono">{totalPlays}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 px-1 border-t border-slate-850/65 pt-3">
                      <p className="text-[10px] text-slate-400 font-mono">
                        Total de plays das músicas desta pasta: <strong className="text-white">{totalPlays}</strong>
                      </p>

                      {orderedSongs.length > 1 && (
                        !isOrganizingFolderTracks ? (
                          <button
                            type="button"
                            onClick={handleStartOrganizing}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-[10px] font-mono uppercase text-orange-400 font-black tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                            title="Organizar a ordem das faixas nesta pasta"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                            ORGANIZAR FAIXAS
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOrganizingFolderTracks(false);
                                const prevOrdered = viewingRepertoireTracks.orderedTrackIds || viewingRepertoireTracks.trackIds || [];
                                const matchedSongs = tracks.filter(t => t.repertoireId === viewingRepertoireTracks.id || prevOrdered.includes(t.trackId));
                                const prevIds = Array.from(new Set(matchedSongs.map(t => t.trackId)));
                                setOrganizedFolderTrackIds(prevIds);
                              }}
                              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-mono uppercase text-slate-400 font-bold transition cursor-pointer"
                            >
                              CANCELAR
                            </button>
                            <button
                              type="button"
                              disabled={isSavingTrackOrder}
                              onClick={handleSaveTrackOrder}
                              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-slate-950 rounded-xl text-[10px] font-mono uppercase font-black tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {isSavingTrackOrder ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  SALVANDO...
                                </>
                              ) : (
                                'SALVAR ORDEM'
                              )}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {trackOrderError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-xl text-center">
                      {trackOrderError}
                    </div>
                  )}

                  {modalMessage && (
                    <div className="p-3 bg-slate-950 border border-orange-500/30 text-orange-400 text-xs font-mono rounded-xl text-center flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {modalMessage}
                    </div>
                  )}

                  {/* Songs list with details */}
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                    {orderedSongs.length === 0 ? (
                      <div className="text-center py-12 bg-slate-955 rounded-2xl border border-slate-850">
                        <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs font-mono">Esta pasta ainda não possui nenhuma música vinculada.</p>
                        <p className="text-slate-500 text-[10px] max-w-xs mx-auto mt-1">
                          Use o botão Editar em alguma música da sua lista geral para movê-la para cá.
                        </p>
                      </div>
                    ) : (
                      orderedSongs.map((track, trackIndex) => {
                        const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
                        const isPublicActive = (track.status || 'active') === 'active';
                        const trackPlays = track.plays || track.playsCount || 0;
                        const trackSinger = track.singer || track.performer || '';
                        
                        return (
                          <div 
                            key={track.trackId}
                            className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition hover:bg-slate-900/60 text-left"
                          >
                            {/* Play button, Title, Composer, Singer/Performer */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isOrganizingFolderTracks && (
                                <div className="flex flex-col gap-1 shrink-0 mr-1.5">
                                  <button
                                    type="button"
                                    disabled={trackIndex === 0}
                                    onClick={() => handleMoveTrackUp(trackIndex)}
                                    className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[#1ed760] disabled:opacity-25 disabled:text-slate-700 transition cursor-pointer"
                                    title="Mover para cima"
                                    aria-label="Mover para cima"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={trackIndex === orderedSongs.length - 1}
                                    onClick={() => handleMoveTrackDown(trackIndex)}
                                    className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[#1ed760] disabled:opacity-25 disabled:text-slate-700 transition cursor-pointer"
                                    title="Mover para baixo"
                                    aria-label="Mover para baixo"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Play Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTrack(track, orderedSongs);
                                }}
                                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition border ${
                                  isCurrentlyPlaying
                                    ? 'bg-[#1ed760] text-slate-950 border-[#1ed760]/40 shadow-lg shadow-[#1ed760]/10'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-[#1ed760]'
                                } cursor-pointer`}
                              >
                                {isCurrentlyPlaying && isPlaying ? (
                                  <div className="flex items-end gap-0.5 h-3">
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce h-3 block" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce h-2 block" style={{ animationDelay: '0.3s' }}></span>
                                    <span className="w-1 bg-slate-950 rounded-full animate-bounce h-3 block" style={{ animationDelay: '0.2s' }}></span>
                                  </div>
                                ) : (
                                  <Play className="w-4 h-4 fill-current stroke-none pl-0.5" />
                                )}
                              </button>
                              
                              {/* Title & Creators */}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-heading font-black text-sm text-white uppercase tracking-tight line-clamp-1">{track.title}</h5>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                  <span className="text-slate-400 text-[10px] font-mono">
                                    Compositor: <span className="text-slate-300 font-sans font-medium">{track.composer || 'N/A'}</span>
                                  </span>
                                  {trackSinger && (
                                    <>
                                      <span className="text-slate-600 text-[10px] font-mono">•</span>
                                      <span className="text-slate-400 text-[10px] font-mono">
                                        Intérprete: <span className="text-slate-300 font-sans font-medium">{trackSinger}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Plays, Status and Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-900/60 pt-3 sm:pt-0 sm:border-none">
                              {/* Plays count & Status label */}
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase">Plays</span>
                                  <span className="text-xs font-bold text-white font-mono">{trackPlays}</span>
                                </div>

                                <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                  isPublicActive ? 'bg-emerald-950/20 border-emerald-500/20 text-[#1ed760]' : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                                }`}>
                                  {isPublicActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5">
                                {/* Edit */}
                                <button 
                                  onClick={(e) => {
                                    handleStartEdit(track, e);
                                  }}
                                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
                                  title="Editar música"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-orange-400" />
                                </button>

                                {/* Remove from folder */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromRepertoire(track, viewingRepertoireTracks);
                                  }}
                                  className="p-2 text-slate-405 hover:text-rose-400 rounded-xl hover:bg-slate-900 border border-transparent hover:border-rose-950/30 transition cursor-pointer"
                                  title="Remover desta pasta"
                                >
                                  <Link2Off className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                                </button>

                                {/* Delete definitely */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMusicFromPasta(track);
                                  }}
                                  className="p-2 text-slate-405 hover:text-red-500 rounded-xl hover:bg-slate-900 border border-transparent hover:border-red-950/40 transition cursor-pointer"
                                  title="Excluir definitivamente"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer buttons */}
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button"
                      onClick={() => setViewingRepertoireTracks(null)}
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase transition rounded-xl cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 border border-[#1ed760]/30 shadow-2xl p-4 rounded-2xl flex items-center gap-3 max-w-sm">
          <div className="w-2 h-2 rounded-full bg-[#1ed760] animate-ping"></div>
          <p className="text-xs font-mono text-white font-bold">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
