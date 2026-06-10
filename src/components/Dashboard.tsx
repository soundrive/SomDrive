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
  Check
} from 'lucide-react';
import { Artist, Music as Track, Analytics } from '../types';
import { dbService } from '../lib/db';
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

  // Custom Executive Sharing Card Image upload states & actions
  const [isUploadingCardImage, setIsUploadingCardImage] = useState(false);
  const [cardImageUploadProgress, setCardImageUploadProgress] = useState(0);
  const [cardImageError, setCardImageError] = useState('');
  const cardImageInputRef = useRef<HTMLInputElement>(null);

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setCardImageError('A imagem excede o tamanho máximo de 10 MB.');
      return;
    }

    // Validate format (only jpg/png/webp)
    const mimeLower = file.type.toLowerCase();
    const isImage = mimeLower.startsWith('image/');
    if (!isImage) {
      setCardImageError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG ou WEBP).');
      return;
    }

    setIsUploadingCardImage(true);
    setCardImageUploadProgress(10);
    setCardImageError('');

    try {
      setCardImageUploadProgress(30);
      // Upload using Firebase storage
      const uploadedUrl = await dbService.uploadFile(profile.userId, file, 'cover', (prog) => {
        setCardImageUploadProgress(Math.min(90, 30 + Math.round(prog * 0.6)));
      });

      setCardImageUploadProgress(95);
      
      // Update the profile in local reference and remote Firestore database!
      const updatedProfile = dbService.updateArtistProfile(profile.userId, {
        customCardImageUrl: uploadedUrl
      });

      setProfile(updatedProfile);
      setCardImageUploadProgress(100);
      setToastMessage("Sua foto do Cartão Executivo foi atualizada com sucesso!");
      
      // Clear input value
      if (cardImageInputRef.current) cardImageInputRef.current.value = '';
    } catch (err: any) {
      console.error("Error uploading custom card image:", err);
      setCardImageError('Erro ao enviar imagem. Verifique sua conexão e tente novamente.');
    } finally {
      setIsUploadingCardImage(false);
      setTimeout(() => setCardImageUploadProgress(0), 4000);
    }
  };

  const handleRemoveCustomCardImage = async () => {
    if (confirm("Deseja realmente remover sua imagem personalizada e voltar ao vinil de design padrão?")) {
      setIsUploadingCardImage(true);
      try {
        const updatedProfile = dbService.updateArtistProfile(profile.userId, {
          customCardImageUrl: "" // Empty string clears it
        });
        setProfile(updatedProfile);
        setToastMessage("Cartão executivo redefinido para o padrão com sucesso!");
      } catch (err) {
        console.error("Error clearing custom card image:", err);
      } finally {
        setIsUploadingCardImage(false);
      }
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

  const handleCopyLink = () => {
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
    const slugOrId = profile.name ? slugifyStr(profile.name) : profile.userId;
    const pageUrl = `https://soundrive.com.br/artista/${slugOrId}`;
    navigator.clipboard.writeText(pageUrl);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
  };

  const handleShareWhatsApp = () => {
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
    const slugOrId = profile.name ? slugifyStr(profile.name) : profile.userId;
    const pageUrl = `https://soundrive.com.br/artista/${slugOrId}`;
    const messageText = `🎧 Ouça meu catálogo musical no Soundrive.\n\nAqui estão minhas composições disponíveis para audição:\n${pageUrl}`;
    const urlEncoded = encodeURIComponent(messageText);
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

    if (tracks.length >= limitCount) {
      setFormError('Você atingiu o limite do seu plano. Faça upgrade para enviar mais músicas.');
      setShowAddForm(false);
      setShowLimitPrompt(true);
      return;
    }

    if (audioOption === 'file') {
      if (!audioFile) {
        setFormError('Por favor, selecione um arquivo de áudio MP3 para enviar.');
        return;
      }
      const maxSizeBytes = 20 * 1024 * 1024; // 20 MB

      const fileExt = '.' + audioFile.name.split('.').pop()?.toLowerCase();
      const mimeLower = audioFile.type.toLowerCase();
      const isMp3Mime = mimeLower === 'audio/mpeg' || mimeLower === 'audio/mp3' || mimeLower === 'audio/x-mpeg' || mimeLower === 'audio/x-mp3' || mimeLower === 'audio/mpeg3';
      const isMp3Ext = fileExt === '.mp3';

      // Validação estrita de MP3
      if (!isMp3Mime && !isMp3Ext) {
        setFormError('Este arquivo não é um MP3 válido. Converta sua música para MP3 e tente novamente.');
        return;
      }

      // Validação de tamanho <= 20MB
      if (audioFile.size > maxSizeBytes) {
        setFormError('Este MP3 ultrapassa o limite de 20 MB. Reduza o áudio para MP3 em 96 kbps ou 128 kbps e tente novamente.');
        return;
      }
    }

    if (!title.trim()) {
      setFormError('O título da música é obrigatório.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const uniqueId = `track-${Math.floor(Math.random() * 89999) + 10000}`;

    try {
      // Determine cover URL using Firebase Storage if local file exists
      let finalCover = PRESET_COVERS[Math.floor(Math.random() * PRESET_COVERS.length)];
      if (coverFile) {
        setUploadProgress(25);
        finalCover = await dbService.uploadFile(profile.userId, coverFile, 'cover', (p) => setUploadProgress(prev => Math.max(prev, p)));
      } else if (coverOption === 'url' && customCoverUrl.trim()) {
        finalCover = customCoverUrl.trim();
      }

      setUploadProgress(50);

      // Determine audio URL and tracking variables using Cloudflare R2 if local file exists
      let finalAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      let r2StoragePath = "";
      let r2MimeType = "audio/mpeg";
      let r2FileSize = 0;
      let r2OriginalName = "";
      let r2StorageProvider = "preset_demo";
      let computedHashHex = "";
      let calculatedAudioFileId = "";

      if (audioOption === 'file' && audioFile) {
        setUploadProgress(55);
        r2OriginalName = audioFile.name;
        r2MimeType = audioFile.type || "audio/mpeg";
        r2FileSize = audioFile.size;
        r2StorageProvider = "cloudflare_r2";

        // Calculate File Hash using browser performance SHA-256
        try {
          computedHashHex = await computeSHA256(audioFile);
          console.log("Calculated MP3 hash:", computedHashHex);
        } catch (hashErr) {
          console.error("SHA-255 calculation failed, uploading without: ", hashErr);
        }

        setUploadProgress(60);

        // Deduplication discovery flow
        let existingAudioFile = null;
        if (computedHashHex) {
          existingAudioFile = await dbService.findAudioFileByHash(computedHashHex);
        }

        if (existingAudioFile) {
          console.log("Physical audio duplicate detected in storage! Reusing existing stream URL:", existingAudioFile.audioUrl);
          finalAudio = existingAudioFile.audioUrl;
          r2StoragePath = existingAudioFile.storagePath;
          calculatedAudioFileId = existingAudioFile.id;
          
          // Safely update file reuse count
          await dbService.incrementAudioFileUsage(existingAudioFile.id);
          setUploadProgress(90);
        } else {
          // Upload new unique binary file to Cloudflare R2
          const uploadResult = await uploadAudioToR2(
            profile.userId,
            uniqueId,
            audioFile,
            (percent) => {
              const mappedProgress = Math.round(60 + (percent * 0.3));
              setUploadProgress(mappedProgress);
            }
          );
          finalAudio = uploadResult.publicAudioUrl;
          r2StoragePath = uploadResult.storagePath;

          // Save newly uploaded physical audio file metadata descriptor
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
            usageCount: 1
          };
          await dbService.createAudioFile(calculatedAudioFileId, newAudioFileObject);
        }
      } else if (audioOption === 'url' && customAudioUrl.trim()) {
        finalAudio = customAudioUrl.trim();
        r2OriginalName = "custom_url_link.mp3";
        r2StoragePath = "custom-external";
        r2MimeType = "audio/mpeg";
        r2FileSize = 0;
        r2StorageProvider = "external_link";
        calculatedAudioFileId = `file-ext-${Math.floor(Math.random() * 89999) + 10000}`;
      } else {
        // Rotate roster of high quality fallback MP3 files
        const index = (tracks.length % 5) + 1;
        finalAudio = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index}.mp3`;
        r2OriginalName = `SoundHelix-Song-${index}.mp3`;
        r2StoragePath = `preset/helix-${index}.mp3`;
        r2MimeType = "audio/mpeg";
        r2FileSize = 0;
        r2StorageProvider = "preset_demo";
        calculatedAudioFileId = `file-preset-${index}`;
      }

      setUploadProgress(92);

      try {
        await dbService.addMusic(profile.userId, {
          trackId: uniqueId,
          artistId: profile.userId,
          title: title.trim(),
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
          audioHash: computedHashHex
        });
      } catch (firestoreErrObj: any) {
        console.error("erro ao salvar no Firestore:", firestoreErrObj);
        throw new Error("step:firestore_save_failed");
      }

      setUploadProgress(95);

      // Immediately run on-demand cloud sync
      await dbService.syncArtistData(profile.userId);

      setUploadProgress(100);

      // Reset Form State
      setTitle('');
      setDesc('');
      setLyrics('');
      setPartners('');
      setAudioFile(null);
      setCoverFile(null);
      setCustomAudioUrl('');
      setCustomCoverUrl('');
      setShowAddForm(false);
      refreshData();
    } catch (err: any) {
      console.error("Upload workflow failed: ", err);
      const errMsg = err.message || "";
      
      // Extract proxy error if present
      let extractedProxyError = "";
      if (errMsg.includes("proxy_error:")) {
        const proxyParts = errMsg.split("proxy_error:");
        // Decode and strip colon
        extractedProxyError = decodeURIComponent(proxyParts[1].split(":")[0]).trim();
      }

      if (errMsg.startsWith("step:presigned_url_fetch_failed") || errMsg.startsWith("step:presigned_url_generation_failed")) {
        let text = "Falha ao gerar URL de upload no Cloudflare R2.";
        if (extractedProxyError) {
          text += ` (R2 Error: ${extractedProxyError})`;
        }
        setFormError(text);
      } else if (errMsg.startsWith("step:r2_upload_put_failed_status_real")) {
        // Extract real error details
        const parts = errMsg.split(":");
        const status = parts[2] || "Desconhecido";
        const statusText = parts[3] || "Error";
        const responseText = parts.slice(4).join(":");
        
        let displayError = `Falha ao enviar MP3 para R2: ${status} - ${statusText}`;
        if (responseText && responseText !== "Sem resposta textual") {
          if (responseText.includes("SignatureDoesNotMatch")) {
            displayError += " (Erro: SignatureDoesNotMatch — Os parâmetros ou cabeçalhos assinados divergem)";
          } else if (responseText.includes("AccessDenied")) {
            displayError += " (Erro: AccessDenied — Credenciais do R2 não possuem permissões de gravação adequadas)";
          } else {
            const cleanText = responseText.replace(/<[^>]*>/g, '').substring(0, 100).trim();
            if (cleanText) {
              displayError += ` (${cleanText})`;
            }
          }
        }
        setFormError(displayError);
      } else if (errMsg.startsWith("step:r2_upload_put_failed_status") || errMsg.startsWith("step:r2_upload_put_failed_network")) {
        let text = "Falha ao enviar MP3 para R2: Erro de Rede ou Conexão.";
        if (extractedProxyError) {
          text += ` (R2 Error: ${extractedProxyError})`;
        }
        setFormError(text);
      } else if (errMsg.startsWith("step:firestore_save_failed")) {
        setFormError("Falha ao salvar os dados da música no Firestore.");
      } else {
        setFormError(errMsg || "Erro inesperado ao registrar a música.");
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
    setUploadProgress(50);

    try {
      setUploadProgress(80);
      const updatedTrack = await dbService.updateMusic(profile.userId, editingTrack.trackId, {
        title: editTitle.trim(),
        composer: editComposer.trim(),
        singer: editSinger.trim(),
        performer: editSinger.trim(),
        partners: editPartners.trim(),
        genre: editGenre.trim(),
        description: editDesc.trim(),
        lyrics: editLyrics.trim(),
        status: editTrackStatus
      });

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
            <p className="text-[10px] font-mono mt-0.5 text-yellow-400">Soundrive</p>
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
            <h3 className="text-2xl md:text-3xl font-heading font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Olá, {profile.name}!
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Aqui você controla seu acervo e acompanha cliques nas suas faixas. Seu link público está ativo e pronto para receber visitas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              id="edit-profile-btn"
              onClick={handleOpenProfileModal}
              className="px-4.5 py-3 bg-gradient-to-r from-orange-600/10 to-yellow-500/10 hover:from-orange-600/20 hover:to-yellow-500/20 border border-orange-500/30 hover:border-orange-500/50 text-[#d4af37] hover:text-white rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition hover:scale-102"
              title="Personalizar seu perfil de compositor"
            >
              <User className="w-4 h-4 text-orange-400" /> Personalizar Perfil
            </button>

            <button 
              id="view-catalog-btn"
              onClick={() => onNavigate('public', { id: profile.userId })}
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
              {profile.plan === 'free' && 'Você está no Soundrive Free (3 Músicas)'}
              {profile.plan === 'pro' && 'Você está no Soundrive Pro (15 Músicas)'}
              {profile.plan === 'premium' && 'Você está no Soundrive Premium (50 Músicas)'}
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

        {/* PREMIUM SHARING CARD PREVIEW PANEL */}
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-black text-lg md:text-xl uppercase tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" /> Cartão de Compartilhamento Executivo
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Apresentação impecável parecida com Spotify, Apple Music e Linktree no WhatsApp, Facebook e Instagram de forma automática.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-950/50 text-emerald-405 border border-emerald-500/20 text-[10px] font-mono rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Ativo no Link
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Visual Card Image Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/50 border border-slate-850/80 p-4 rounded-xl relative group overflow-hidden">
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-slate-450 rounded tracking-wider uppercase">
                Prévia do Cartão de Divulgação
              </div>
              <div className="w-full max-w-xl aspect-[1.91/1] overflow-hidden rounded-lg border border-slate-800/80 shadow-2xl relative transition duration-305 group-hover:border-orange-500/20">
                <img 
                  src={`/api/og-artista?id=${profile.userId}`}
                  alt="Cartão Soundrive" 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-slate-500">
                <span>Resolução: 1200 x 630 px</span>
                <span>•</span>
                <span>Formato: Imagem PNG de Alta Definição</span>
              </div>

              {/* Custom Cover Upload Control inside Sharing Card */}
              <div className="mt-4 w-full border-t border-slate-900 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-900/60">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200">Personalizar Imagem do Cartão</p>
                  <p className="text-[10px] text-slate-450 font-sans">Substitua a gravura do disco por uma foto sua ou capa de sua escolha.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={cardImageInputRef}
                    accept="image/*"
                    onChange={handleCardImageUpload}
                    className="hidden"
                  />
                  
                  {profile.customCardImageUrl && (
                    <button
                      onClick={handleRemoveCustomCardImage}
                      type="button"
                      disabled={isUploadingCardImage}
                      className="px-3 py-1.5 bg-rose-950/40 border border-rose-900/40 hover:border-rose-500 text-rose-400 rounded-lg text-[10px] font-mono uppercase font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      Remover Foto
                    </button>
                  )}

                  <button
                    onClick={() => cardImageInputRef.current?.click()}
                    type="button"
                    disabled={isUploadingCardImage}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600/10 to-yellow-500/10 hover:from-orange-600/20 hover:to-yellow-500/20 border border-orange-500/30 hover:border-orange-550 text-orange-400 hover:text-white rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {isUploadingCardImage ? `Subindo...` : profile.customCardImageUrl ? 'Substituir Foto' : 'Enviar Foto'}
                  </button>
                </div>
              </div>

              {/* Progress and status display feedback */}
              {cardImageUploadProgress > 0 && (
                <div className="w-full mt-2.5 space-y-1 animate-fade-in px-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold text-orange-450">
                    <span>Enviando nova imagem customizada...</span>
                    <span>{cardImageUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-200" style={{ width: `${cardImageUploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {cardImageError && (
                <p className="w-full text-left mt-2.5 text-[10px] font-mono text-red-400 font-bold px-1">{cardImageError}</p>
              )}
            </div>

            {/* Information & Description Area */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/20 border border-slate-850/60 p-5 rounded-xl space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Como funciona?</p>
                <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-orange-950/60 text-orange-400 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-orange-500/20">1</div>
                    <p>O algoritmo do WhatsApp, Facebook ou Instagram varre seu link e descobre os metadados de compartilhamento ocultos.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-orange-950/60 text-orange-400 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-orange-500/20">2</div>
                    <p>Ele cria instantaneamente um balão de pré-visualização contendo o vinil interativo, selo verificado e botão de escuta rápida.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 bg-orange-950/60 text-orange-400 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-orange-500/20">3</div>
                    <p>Você gera credibilidade instantânea, sem revelar URLs complexas ou IDs técnicos.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850/60 space-y-3">
                <h5 className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">Opções de Divulgação</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 rounded-lg text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition hover:from-orange-500 hover:to-yellow-400 active:scale-95 font-bold"
                  >
                    <Copy className="w-4 h-4" /> {copiedAlert ? "Copiado!" : "Copiar Link"}
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-emerald-400 rounded-lg text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 font-bold"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" /> WhatsApp
                  </button>
                </div>
                <a 
                  href={`/api/og/artista/${profile.userId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-[10px] font-mono text-orange-400 hover:text-orange-350 hover:underline pt-1 transition"
                >
                  Abrir imagem OG em nova guia ↗
                </a>
              </div>
            </div>
          </div>
        </div>

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
        {tracks.length === 0 ? (
          <div id="empty-songs" className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-850 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-slate-955 rounded-full flex items-center justify-center mx-auto text-orange-500 border border-slate-800 shadow-xl shadow-orange-550/5">
              <Music className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-lg uppercase text-slate-200">Nenhuma música cadastrada ainda.</h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">Adicione sua primeira composição para montar seu catálogo Soundrive.</p>
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
            {tracks.filter(t => {
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
            {tracks.filter(t => {
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
                const slugOrId = profile.name ? slugifyStr(profile.name) : profile.userId;
                const songUrl = `https://soundrive.com.br/artista/${slugOrId}?play=${trackVal.trackId}`;
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
                        onClick={(e) => handleStartEdit(track, e)}
                        className="p-1.5 bg-slate-955 border border-slate-800 text-slate-400 hover:text-orange-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
                        title="Editar detalhes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={(e) => handleDeleteMusic(track.trackId, e)}
                        className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg cursor-pointer flex items-center justify-center transition"
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

      </main>

      {/* MODAL / ADD MUSIC LAYOVER DIALOG */}
      {showAddForm && (
        <div id="add-music-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative my-10 max-h-[90vh] overflow-y-auto">
            
            {isUploading && (
              <div className="absolute inset-0 z-30 bg-slate-950/95 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-heading font-black tracking-wide text-white uppercase">Sincronizando com Firebase Storage</h4>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Fazendo upload seguro das suas faixas de áudio e capa para o Firebase Storage corporativo de alta velocidade...
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
                <Music className="w-5 h-5 text-orange-400" /> Cadastrar Composições
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold uppercase"
              >
                Fechar
              </button>
            </div>

            {formError && (
              <div id="form-error-msg" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMusic} className="space-y-4">
              
              {/* Row 1: Title & Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Título da Música *</label>
                  <input 
                    id="new-track-title"
                    type="text" 
                    placeholder="Ex: Coração de Pedra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Musical (Genre)</label>
                  <input 
                    id="new-track-genre"
                    type="text" 
                    placeholder="Ex: Sertanejo Universitário"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>
              </div>

              {/* Row 2: Composer, Singer & Partners */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome do Compositor (Autor)</label>
                  <input 
                    id="new-track-composer"
                    type="text" 
                    placeholder="Nome do compositor"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome do Intérprete / Cantor</label>
                  <input 
                    id="new-track-singer"
                    type="text" 
                    placeholder="Cantor ou banda principal"
                    value={singer}
                    onChange={(e) => setSinger(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Parceiros / Divisões Co-autorias</label>
                  <input 
                    id="new-track-partners"
                    type="text" 
                    placeholder="Ex: Pedro 50%, João 25%"
                    value={partners}
                    onChange={(e) => setPartners(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-850 p-4 bg-slate-950 rounded-2xl space-y-3">
                <h5 className="text-[11px] font-mono font-bold tracking-widest text-yellow-400 uppercase">1. Arquivo de Áudio da Música (Apenas MP3)</h5>
                
                <div className="border border-slate-850 p-4.5 rounded-2xl bg-slate-950/60 space-y-4 text-left">
                  {/* Clear orientation panel for composer before uploading */}
                  <div className="p-4 bg-slate-900 border border-slate-850/60 rounded-xl space-y-2.5">
                    <h4 className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-1.5 leading-snug">
                      <Music className="w-4 h-4 text-orange-500 shrink-0" />
                      Envie sua música em MP3
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Para tocar rápido no celular e no carro, envie um arquivo MP3 leve, de preferência entre 96 kbps e 128 kbps.
                    </p>
                    <div className="border-t border-slate-800/40 pt-2.5 mt-2">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-400 text-[10px] font-mono uppercase tracking-wider leading-relaxed">
                        <li className="flex items-center gap-1"><span className="text-orange-500 font-bold">•</span> Tamanho recomendado: <span className="text-zinc-200">até 5 MB</span></li>
                        <li className="flex items-center gap-1"><span className="text-orange-500 font-bold">•</span> Formatos aceitos: <span className="text-zinc-200">apenas .mp3</span></li>
                        <li className="flex items-center gap-1"><span className="text-orange-500 font-bold">•</span> Tamanho máximo: <span className="text-zinc-200">20 MB</span></li>
                        <li className="flex items-center gap-1 text-[9px] text-red-400 font-semibold"><span className="text-red-450 font-bold">•</span> Não aceitar WAV, FLAC, M4A, AAC, OGG ou áudio pesado</li>
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Drag & Drop Upload Zone */}
                  <div 
                    onClick={() => {
                      document.getElementById('hidden-audio-input')?.click();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-orange-500', 'bg-orange-500/10', 'scale-[1.01]');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/10', 'scale-[1.01]');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-orange-500', 'bg-orange-500/10', 'scale-[1.01]');
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        setAudioFile(file);
                      }
                    }}
                    className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 p-6 rounded-xl text-center space-y-3 cursor-pointer relative bg-slate-900/10 hover:bg-slate-900/20 transition-all duration-200 group flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-orange-400 transition-colors animate-pulse duration-[3000ms]" strokeWidth={1.5} />
                    
                    <div className="space-y-1 select-none">
                      <p className="text-xs text-slate-200 font-bold">
                        Arraste seu MP3 aqui ou clique para selecionar.
                      </p>
                      <p className="text-[11px] text-slate-405 leading-normal">
                        Recomendado: MP3 de até 5 MB para carregar rápido no 4G.
                      </p>
                      <p className="text-[10px] font-mono uppercase text-slate-500 font-extrabold tracking-wider pt-0.5">
                        Máximo permitido: 20 MB.
                      </p>
                    </div>

                    <input 
                      id="hidden-audio-input"
                      type="file" 
                      accept=".mp3,audio/mpeg,audio/mp3" 
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="hidden" 
                    />
                    
                    {audioFile && (
                      <div className="p-2 px-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-2 mt-2 max-w-sm animate-fade-in">
                        <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <p className="text-xs text-emerald-400 font-mono font-bold truncate">
                          Selecionado: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Upload Controls simplified to Notes Only Mode */}
              <div className="pt-2 border-t border-slate-850 p-4 bg-slate-950 rounded-2xl space-y-3">
                <h5 className="text-[11px] font-mono font-bold tracking-widest text-orange-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" /> 2. Capa da Música: Notas Musicais Ativadas
                </h5>
                <div className="flex items-center gap-2.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <Music className="w-5 h-5 text-orange-500 shrink-0" />
                  <span>
                    O design de <strong>Notas Musicais e Ondas Sonoras Líticas</strong> está ativo por padrão! Não é necessário enviar capas de fotos. Seus ouvintes verão lindos discos interativos animados.
                  </span>
                </div>
              </div>

              {/* Description bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Descrição da Música (Ficha criativa / Detalhes)</label>
                <textarea 
                  placeholder="Ex: Escrita após assistir o pôr do sol na beira do rio. Ritmo romântico com arranjo de cordas de aço e violoncelo."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition"
                ></textarea>
              </div>

              {/* Lyrics text box */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Letra da Música (Opcional)</label>
                <textarea 
                  placeholder="Cole aqui a letra completa da música para os seus ouvintes e intérpretes acompanharem."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-sans"
                ></textarea>
              </div>

              {/* Visibilidade do Catálogo */}
              <div className="pt-2 pb-1 border-t border-slate-850/60">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block mb-2">Visibilidade inicial no Catálogo Público</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTrackStatus('active')}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer select-none ${
                      newTrackStatus === 'active'
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${newTrackStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span className="text-xs font-bold uppercase tracking-wider">Ativa / Visível</span>
                    </div>
                    <p className="text-[10px] text-slate-450 font-sans leading-relaxed">Seus ouvintes poderão visualizar e tocar no seu link público.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTrackStatus('inactive')}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer select-none ${
                      newTrackStatus === 'inactive'
                        ? 'bg-rose-950/20 border-rose-500/50 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${newTrackStatus === 'inactive' ? 'bg-rose-500' : 'bg-slate-500'}`}></span>
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
                    setShowAddForm(false);
                    setFormError('');
                  }}
                  className="px-4 py-3 bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase transition rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  id="submit-new-track"
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-orange-500/10 cursor-pointer select-none transition-transform active:scale-98 font-bold"
                >
                  Salvar Música no Soundrive
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
                    Armazenando seus dados artísticos, endereço de contato e biografia no banco corporativo Soundrive...
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

    </div>
  );
}
