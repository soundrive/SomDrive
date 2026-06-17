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
  FolderOpen
} from 'lucide-react';
import { Artist, Music as Track, Analytics, ShareCardSettings, Repertoire } from '../types';
import { dbService } from '../lib/db';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
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
  const generalSongs = tracks.filter(t => !t.repertoireId || t.publicationDestination === 'general');
  const [analytics, setAnalytics] = useState<Analytics>({ artistId: currentUser.userId, viewsCount: 0, whatsappClicks: 0 });
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  
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
    }, (err) => {
      console.error("Error subscribing to repertoires snapshot in Dashboard:", err);
      setRepertoiresError("Não foi possível carregar os repertórios.");
      setLoadingRepertoires(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const [newRepName, setNewRepName] = useState('');
  const [newRepDesc, setNewRepDesc] = useState('');
  const [newRepVisibility, setNewRepVisibility] = useState<'active' | 'private'>('active');
  const [newRepType, setNewRepType] = useState<'repertoire' | 'playlist' | 'collection'>('repertoire');
  const [showCreateRep, setShowCreateRep] = useState(false);
  const [repCopiedId, setRepCopiedId] = useState<string | null>(null);
  const [editingRepertoire, setEditingRepertoire] = useState<Repertoire | null>(null);
  const [viewingRepertoireTracks, setViewingRepertoireTracks] = useState<Repertoire | null>(null);
  const [managingRepTrackId, setManagingRepTrackId] = useState<string | null>(null); // Repertoire ID for checkboxes modal

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
  const [newRepertoireVisibility, setNewRepertoireVisibility] = useState<'active' | 'private'>('active');
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

  const getPlanTracksLimit = (plan: 'free' | 'pro' | 'premium') => {
    if (plan === 'pro') return 15;
    if (plan === 'premium') return 50;
    return profile.musicLimit || 3;
  };
  const limitCount = getPlanTracksLimit(profile.plan);

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
    
    // Increment WhatsApp counter
    dbService.incrementAnalyticsView(profile.userId, false, true);
    
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
      const createNewRepertoireInFirestore = async (name: string, desc: string, type: 'repertoire' | 'playlist' | 'collection' | 'project', visibility: 'active' | 'private', initialTrackIds: string[] = []) => {
        const repId = `rep_${Date.now().toString(36) + Math.random().toString(36).substring(2, 7)}`;
        const baseSlug = name
          .toString()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        const randomSuffix = Math.floor(Math.random() * 89999) + 10000;
        const computedSlug = `${baseSlug || "repertorio"}-${randomSuffix}`;
        const newRep: Repertoire = {
          id: repId,
          ownerUid: profile.userId,
          name: name.trim(),
          description: desc.trim(),
          type: type,
          trackIds: initialTrackIds,
          orderedTrackIds: initialTrackIds,
          visibility: visibility,
          slug: computedSlug,
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
                'active'
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
          visibility: existingRep?.visibility || newRepertoireVisibility || 'active',
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
    setNewRepertoireVisibility('active');
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
    setUploadProgress(40);

    try {
      setUploadProgress(70);
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
        publicationDestination: editRepertoireId === 'all_songs' ? 'general' : 'repertoire'
      });

      setUploadProgress(85);
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
      refreshData();
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

    try {
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

      const baseSlug = slugifyStr(newRepName);
      const randomSuffix = Math.floor(Math.random() * 89999) + 10000;
      const computedSlug = `${baseSlug || "repertorio"}-${randomSuffix}`;

      if (editingRepertoire) {
        const updatedRep: Repertoire = {
          ...editingRepertoire,
          name: newRepName.trim(),
          description: newRepDesc.trim(),
          visibility: newRepVisibility,
          slug: editingRepertoire.slug || computedSlug,
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
          slug: computedSlug,
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
    }
  };

  const handleSyncRepertoire = async (rep: Repertoire) => {
    setIsSyncingRepertoire(rep.id);
    try {
      await dbService.saveRepertoire(rep);
      setToastMessage?.("Repertório sincronizado com o Firestore com sucesso!");
    } catch (err) {
      console.error("Error syncing ghost repertoire:", err);
      setToastMessage?.("Erro ao sincronizar repertório.");
    } finally {
      setIsSyncingRepertoire(null);
    }
  };

  // Find most played track
  const topTrack = tracks.length > 0
    ? [...tracks].sort((a, b) => b.playsCount - a.playsCount)[0]
    : null;

  const totalPlays = tracks.reduce((sum, t) => sum + t.playsCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-32">
      
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

          <button 
            onClick={() => setShowPlans(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer select-none group"
            title="Ver planos e limites"
          >
            <span className={`w-2 h-2 rounded-full ${profile.plan === 'premium' ? 'bg-yellow-500 animate-pulse' : profile.plan === 'pro' ? 'bg-orange-500 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-300 group-hover:text-white">
              Plano: {profile.plan === 'premium' ? 'Premium 🌟' : profile.plan === 'pro' ? 'Pro ⭐' : 'Free'}
            </span>
          </button>

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
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Cliques no play</p>
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
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Visitas únicas</p>
            </div>
            <div className="p-2 md:p-3 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-lg md:rounded-xl self-start sm:self-center">
              <Eye className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          {/* Metric 4: WhatsApp clicks */}
          <div className="bg-slate-900 border border-slate-850 p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">WhatsApp</p>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight font-mono text-emerald-400">{analytics.whatsappClicks}</h4>
              <p className="text-[9px] font-sans text-slate-450 hidden sm:block">Contatos</p>
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
              {profile.plan === 'pro' && 'Você está no SomDrive Pro (15 Músicas)'}
              {profile.plan === 'premium' && 'Você está no SomDrive Premium (50 Músicas)'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {profile.plan === 'free' && 'Sua conta gratuita permite até 3 músicas em seu catálogo privado. Faça upgrade para expandir seu limite para até 50 faixas.'}
              {profile.plan === 'pro' && 'Seu plano Pro está ativo! Agora você pode cadastrar e compartilhar até 15 músicas em MP3 de alta conversão.'}
              {profile.plan === 'premium' && 'Seu plano Premium está ativo! Aproveite o limite expandido de até 50 músicas cadastradas em seu portfólio.'}
            </p>
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
                setNewRepertoireVisibility('active');
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
                setNewRepVisibility('active');
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

            const unsyncedRepertoires = (() => {
              try {
                const localKeyReps = `somdrive_repertoires_${currentUser.userId}`;
                const cachedRepsRaw = localStorage.getItem(localKeyReps);
                if (!cachedRepsRaw) return [];
                const cachedReps: Repertoire[] = JSON.parse(cachedRepsRaw);
                return cachedReps.filter(cached => 
                  !dashboardRepertoires.some(real => real.id === cached.id)
                );
              } catch {
                return [];
              }
            })();

            const combinedRepertoires = [
              ...dashboardRepertoires.map(r => ({ ...r, isSynced: true })),
              ...unsyncedRepertoires.map(r => ({ ...r, isSynced: false }))
            ];

            if (combinedRepertoires.length === 0) {
              return (
                <div className="text-center py-16 bg-slate-900/10 rounded-3xl border border-slate-850 p-6">
                  <Folders className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h4 className="text-base font-bold text-slate-300 uppercase">Nenhum repertório criado</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">Você ainda não tem nenhum repertório cadastrado. Envie músicas e organize-as em pastas públicas ou privadas!</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combinedRepertoires.map((rep) => {
                  const repTracksCount = rep.trackIds?.length || 0;
                  const slugToUse = rep.slug || rep.id;
                  const shareUrl = `${window.location.origin}/catalogo/${profile.slug || profile.userId}/repertorio/${slugToUse}`;
                  const isPrivate = rep.visibility === 'private';
                  const isCopied = repCopiedId === rep.id;
                  
                  return (
                    <div 
                      key={rep.id}
                      className={`bg-slate-900/60 rounded-2xl border p-5 flex flex-col justify-between hover:border-slate-700 transition space-y-4 shadow-xl ${
                        rep.isSynced ? 'border-slate-850' : 'border-amber-500/30'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          {rep.isSynced ? (
                            <span className={`text-[9px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border uppercase ${
                              isPrivate ? 'bg-rose-950/20 border-rose-500/20 text-rose-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {isPrivate ? 'Privado' : 'Público'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded border uppercase bg-amber-950/40 border-amber-500/30 text-amber-400 animate-pulse">
                              Não Sincronizado (Local)
                            </span>
                          )}
                          
                          <span className="text-[10px] text-slate-400 font-mono">
                            {repTracksCount} {repTracksCount === 1 ? 'música' : 'músicas'}
                          </span>
                        </div>

                        <h4 className="font-heading font-black text-sm text-white uppercase tracking-tight line-clamp-1">
                          📁 {rep.name}
                        </h4>
                        
                        <p className="text-slate-400 text-xs font-sans line-clamp-2 min-h-[32px]">
                          {rep.description || 'Sem descrição.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-850">
                        {/* If unsynced, display CTA to sync, otherwise show actions */}
                        {!rep.isSynced ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleSyncRepertoire(rep)}
                              disabled={isSyncingRepertoire === rep.id}
                              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 text-xs font-black uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md font-bold"
                            >
                              {isSyncingRepertoire === rep.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                              <span>Salvar no Firestore</span>
                            </button>
                            <p className="text-[10px] text-amber-500 font-mono text-center leading-normal">
                              Esta pasta existe só neste navegador. Salve no Firestore para compartilhar!
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingRepertoireTracks(rep);
                              }}
                              className="flex-1 py-1.5 text-xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer bg-orange-600 hover:bg-orange-500 text-slate-950 px-3 font-mono"
                              title="Abrir Repertório"
                            >
                              <FolderClosed className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Abrir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                setRepCopiedId(rep.id);
                                setTimeout(() => setRepCopiedId(null), 2000);
                              }}
                              className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-mono ${
                                isCopied ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                              }`}
                              title="Copiar Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{isCopied ? 'Copiado!' : 'Copiar Link'}</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRepertoire(rep);
                              setNewRepName(rep.name);
                              setNewRepDesc(rep.description || '');
                              setNewRepVisibility(rep.visibility || 'active');
                              setShowCreateRep(true);
                            }}
                            className="flex-1 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold uppercase font-mono"
                            title="Editar Repertório"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            disabled={!rep.isSynced}
                            onClick={() => {
                              if (!rep.isSynced) {
                                setToastMessage?.("Sincronize o repertório no Firestore antes de compartilhar.");
                                return;
                              }
                              const greetingText = `Confira o meu repertório "${rep.name}" do SomDrive: ${shareUrl}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(greetingText)}`, '_blank');
                            }}
                            className={`p-1.5 border rounded-xl transition flex items-center justify-center ${
                              rep.isSynced
                                ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/20 text-emerald-400 cursor-pointer'
                                : 'bg-slate-905 border-slate-850 text-slate-600 cursor-not-allowed opacity-40'
                            }`}
                            title={rep.isSynced ? "Compartilhar no WhatsApp" : "Sincronize para compartilhar"}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Tem certeza que deseja excluir o repertório "${rep.name}"? As músicas não serão apagadas, apenas a pasta.`)) {
                                if (rep.isSynced) {
                                  await dbService.deleteRepertoire(rep.id, profile.userId);
                                } else {
                                  // Local deletion for unsynced item
                                  try {
                                    const localKeyReps = `somdrive_repertoires_${currentUser.userId}`;
                                    const cachedRepsRaw = localStorage.getItem(localKeyReps);
                                    if (cachedRepsRaw) {
                                      let cachedReps: Repertoire[] = JSON.parse(cachedRepsRaw);
                                      cachedReps = cachedReps.filter(cached => cached.id !== rep.id);
                                      localStorage.setItem(localKeyReps, JSON.stringify(cachedReps));
                                    }
                                  } catch (err) {
                                    console.error("Local delete error:", err);
                                  }
                                }
                                refreshData();
                              }
                            }}
                            className="p-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-455 rounded-xl transition cursor-pointer flex items-center justify-center"
                            title="Excluir Repertório"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                        <h4 className="text-xs font-bold uppercase tracking-wide">Salvar somente no meu acervo geral ("Todas as Músicas")</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Sua música será arquivada e listada no catálogo principal, mas não fará parte de coleções públicas separadas.</p>
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
                        <h4 className="text-xs font-bold uppercase tracking-wide">Escolher um repertório que já criei</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Associe referências destas gravações nas pastas que já existem. Sem custos extras ou duplicações.</p>
                        
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
                        <h4 className="text-xs font-bold uppercase tracking-wide">Criar um novo repertório e carregar músicas nele</h4>
                        <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Cria simultaneamente uma pasta/repertório específico e vincula estas novas músicas diretamente.</p>

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
                                    <option value="active">Público (Visível no Link)</option>
                                    <option value="private">Privado (Invisível no Link Geral)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option 4: Configure severally (Visible only if bulk upload length > 1) */}
                    {audioFiles.length > 1 && (
                      <div 
                        onClick={() => setOrganizationOption('each_separately')}
                        className={`p-4 border border-slate-850 hover:border-orange-500/45 rounded-2xl cursor-pointer transition flex items-start gap-3.5 select-none ${
                          organizationOption === 'each_separately' 
                            ? 'bg-[#0f172a] border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.04)] text-white' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-300'
                        }`}
                      >
                        <SlidersHorizontal className={`w-5 h-5 shrink-0 mt-0.5 ${organizationOption === 'each_separately' ? 'text-orange-400' : 'text-slate-500'}`} />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide">Escolher o destino de cada música separadamente</h4>
                          <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-1">Configurar individualmente o destino específico de cada um do(s) {audioFiles.length} MP3.</p>

                          {organizationOption === 'each_separately' && (
                            <div className="mt-4 bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-3 text-left" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[9.5px] font-mono tracking-wider font-extrabold text-orange-400 uppercase block">Configurar guias individuais:</span>
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {audioFiles.map(file => {
                                  const spec = trackSpecificOrganization[file.name] || { option: 'all_songs' };
                                  return (
                                    <div key={file.name} className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg space-y-2">
                                      <div className="text-[10px] font-mono font-bold text-white truncate">🎵 {file.name}</div>
                                      <div className="flex gap-2">
                                        {['all_songs', 'existing', 'new'].map((opt) => (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                              setTrackSpecificOrganization(prev => ({
                                                ...prev,
                                                [file.name]: {
                                                  ...spec,
                                                  option: opt as any
                                                }
                                              }));
                                            }}
                                            className={`text-[9px] px-2 py-1 rounded font-mono uppercase transition ${
                                              spec.option === opt 
                                                ? 'bg-orange-500 text-slate-950 font-extrabold' 
                                                : 'bg-slate-950 text-zinc-500'
                                            }`}
                                          >
                                            {opt === 'all_songs' ? 'Todas' : opt === 'existing' ? 'Existente' : 'Novo'}
                                          </button>
                                        ))}
                                      </div>

                                      {spec.option === 'existing' && dashboardRepertoires.length > 0 && (
                                        <select
                                          multiple
                                          value={spec.selectedRepIds || []}
                                          onChange={(e) => {
                                            const opts = Array.from(e.target.selectedOptions, (o: any) => o.value);
                                            setTrackSpecificOrganization(prev => ({
                                              ...prev,
                                              [file.name]: {
                                                ...spec,
                                                selectedRepIds: opts
                                              }
                                            }));
                                          }}
                                          className="w-full text-[10px] bg-slate-950 border border-slate-800 rounded p-1 text-white font-mono"
                                        >
                                          {dashboardRepertoires.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                          ))}
                                        </select>
                                      )}

                                      {spec.option === 'new' && (
                                        <input
                                          type="text"
                                          placeholder="Nome do Novo Repertório"
                                          value={spec.newRepName || ''}
                                          onChange={(e) => {
                                            setTrackSpecificOrganization(prev => ({
                                              ...prev,
                                              [file.name]: {
                                                ...spec,
                                                newRepName: e.target.value
                                              }
                                            }));
                                          }}
                                          className="w-full px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded text-white"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                            <option value="active">Público (Visível no Link)</option>
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
        <div id="edit-music-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
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
                  onChange={(e) => setNewRepVisibility(e.target.value as 'active' | 'private')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-sans"
                >
                  <option value="active" className="bg-slate-950 text-white">Público (Aparece no catálogo de compartilhamentos)</option>
                  <option value="private" className="bg-slate-950 text-white">Privado (Apenas você e quem tiver o link consegue ver)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateRep(false);
                    setEditingRepertoire(null);
                    setNewRepName('');
                    setNewRepDesc('');
                  }}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase transition rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 cursor-pointer select-none transition hover:scale-102 font-bold"
                >
                  Confirmar e Salvar
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
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="text-left">
                <h3 className="font-heading font-black text-lg uppercase text-white tracking-tight flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-orange-400" />
                  {viewingRepertoireTracks.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {viewingRepertoireTracks.description || "Nenhuma descrição informada."}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingRepertoireTracks(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {(() => {
                const repSongs = tracks.filter(t => t.repertoireId === viewingRepertoireTracks.id);
                if (repSongs.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-955 rounded-2xl border border-slate-850">
                      <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-mono">Esta pasta ainda não possui nenhuma música vinculada.</p>
                      <p className="text-slate-500 text-[10px] max-w-xs mx-auto mt-1">
                        Use o botão Editar em alguma música da sua lista geral para movê-la para cá.
                      </p>
                    </div>
                  );
                }
                return repSongs.map((track) => {
                  const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
                  const isPublicActive = (track.status || 'active') === 'active';
                  
                  return (
                    <div 
                      key={track.trackId}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-4 transition hover:bg-slate-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTrack(track, tracks);
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition border ${
                            isCurrentlyPlaying
                              ? 'bg-[#d4af37] text-slate-950 border-[#d4af37]/40 shadow-lg shadow-[#d4af37]/10'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-orange-400'
                          } cursor-pointer`}
                        >
                          {isCurrentlyPlaying ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-1 bg-slate-950 rounded-full animate-pulse h-3 block"></span>
                              <span className="w-1 bg-slate-950 rounded-full animate-pulse h-2 block"></span>
                              <span className="w-1 bg-slate-950 rounded-full animate-pulse h-3 block"></span>
                            </div>
                          ) : (
                            <Play className="w-4 h-4 fill-current stroke-none pl-0.5" />
                          )}
                        </button>
                        
                        <div className="text-left">
                          <h5 className="font-heading font-black text-xs text-white uppercase tracking-tight line-clamp-1">{track.title}</h5>
                          <p className="text-slate-500 text-[10px] font-mono mt-0.5">{track.composer || 'Sem compositor'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded border ${
                          isPublicActive ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                        }`}>
                          {isPublicActive ? 'Ativo' : 'Inativo'}
                        </span>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingRepertoireTracks(null);
                            handleStartEdit(track, e);
                          }}
                          className="p-1 text-slate-405 hover:text-white rounded hover:bg-slate-850 cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="button"
                onClick={() => setViewingRepertoireTracks(null)}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase transition rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
