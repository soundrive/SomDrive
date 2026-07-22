import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Disc, 
  Ban, 
  ShieldCheck, 
  Search, 
  Filter, 
  Settings, 
  Mail, 
  User, 
  Phone, 
  Instagram, 
  MapPin, 
  ArrowLeft, 
  LogOut, 
  Save, 
  Info, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Sparkles,
  Megaphone,
  Database
} from 'lucide-react';
import { Artist, ShareCardSettings } from '../types';
import AnnouncementsManager from './admin/AnnouncementsManager';
import { dbService } from '../lib/db';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

const parseValToISO = (val: any): string => {
  if (!val) return '';
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val && typeof val === 'object' && typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000).toISOString();
  }
  if (val && typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'string') return val;
  return '';
};

const formatDateBR = (isoString?: string) => {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '---';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '---';
  }
};

interface AdminAreaProps {
  currentUser: Artist;
  onLogout: () => void;
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  logoScale: number;
  onLogoScaleChange: (scale: number) => void;
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
  customLogoUrl: string;
  onCustomLogoUrlChange: (url: string) => void;
}

export default function AdminArea({
  currentUser,
  onLogout,
  onNavigate,
  logoScale,
  onLogoScaleChange,
  showLogo,
  onShowLogoChange,
  customLogoUrl,
  onCustomLogoUrlChange
}: AdminAreaProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'manual' | 'payments' | 'settings' | 'mercadopago' | 'announcements' | 'infra'>('dashboard');
  const [users, setUsers] = useState<Artist[]>([]);
  
  // Appearance logo configurations (scale, visibility, and custom upload URL)
  const [localLogoScale, setLocalLogoScale] = useState<number>(logoScale || 1.0);
  const [localShowLogo, setLocalShowLogo] = useState<boolean>(showLogo !== false);
  const [localCustomLogoUrl, setLocalCustomLogoUrl] = useState<string>(customLogoUrl || '');
  const [isSavingLogoScale, setIsSavingLogoScale] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');

  useEffect(() => {
    if (logoScale !== undefined) {
      setLocalLogoScale(logoScale);
    }
  }, [logoScale]);

  useEffect(() => {
    if (showLogo !== undefined) {
      setLocalShowLogo(showLogo);
    }
  }, [showLogo]);

  useEffect(() => {
    if (customLogoUrl !== undefined) {
      setLocalCustomLogoUrl(customLogoUrl);
    }
  }, [customLogoUrl]);
  
  // Mercado Pago automatic subscriptions list states
  const [mpSubscriptions, setMpSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Edit Subscription form states
  const [editSubEmail, setEditSubEmail] = useState('');
  const [editSubPlan, setEditSubPlan] = useState<'free' | 'essencial' | 'pro' | 'premium'>('pro');
  const [editSubCycle, setEditSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [editSubStatus, setEditSubStatus] = useState('authorized');
  const [editSubUserId, setEditSubUserId] = useState('');
  const [showTechnicalDocs, setShowTechnicalDocs] = useState(false);

  // Manual payment verification panel states
  const [manualPaymentId, setManualPaymentId] = useState('');
  const [selectedForcePlan, setSelectedForcePlan] = useState<'pro_mensal' | 'premium_mensal' | 'pro_anual' | 'premium_anual'>('pro_mensal');
  const [manualVerifying, setManualVerifying] = useState(false);
  const [manualVerifyResult, setManualVerifyResult] = useState<{
    success: boolean;
    paymentId: string;
    status: string;
    planActivated: boolean;
    message: string;
    isApiWarning?: boolean;
  } | null>(null);

  interface InfraMetrics {
    totalSongs: number;
    totalAudioFiles: number;
    totalSpaceUsedBytes: number;
    r2FreeLimitPercent: number;
    largestSong: {
      title: string;
      sizeBytes: number;
      ownerName: string;
      ownerId: string;
    } | null;
    averageSongSizeBytes: number;
    topUserBySpace: {
      userId: string;
      userName: string;
      songsCount: number;
      totalSizeBytes: number;
    } | null;
    planStats: Record<string, { songsCount: number; spaceUsedBytes: number }>;
    orphanFiles: {
      id: string;
      fileName: string;
      fileSize: number;
      createdAt?: string;
    }[];
    usersNearLimit: {
      userId: string;
      name: string;
      plan: string;
      songsCount: number;
      limit: number;
      percentage: number;
    }[];
  }

  const [infraMetrics, setInfraMetrics] = useState<InfraMetrics | null>(null);
  const [loadingInfra, setLoadingInfra] = useState(false);
  const [infraError, setInfraError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // PaymentSettings states
  const [paymentSettings, setPaymentSettings] = useState<{
    essencialMonthlyUrl: string;
    essencialAnnualUrl: string;
    proMonthlyUrl: string;
    proAnnualUrl: string;
    premiumMonthlyUrl: string;
    premiumAnnualUrl: string;
    updatedAt?: string;
    updatedBy?: string;
  }>({
    essencialMonthlyUrl: '',
    essencialAnnualUrl: '',
    proMonthlyUrl: '',
    proAnnualUrl: '',
    premiumMonthlyUrl: '',
    premiumAnnualUrl: '',
  });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'premium'>('all');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  
  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<Artist | null>(null);
  
  // Notification States
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const askConfirmation = (title: string, message: string, callback: () => void | Promise<void>) => {
    setConfirmModal({
      title,
      message,
      onConfirm: async () => {
        try {
          await callback();
        } catch (e) {
          console.error("Error running confirmed action:", e);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Global share card states
  const [shareCardSettings, setShareCardSettings] = useState<ShareCardSettings | null>(null);
  const [isUploadingShareCard, setIsUploadingShareCard] = useState(false);
  const [shareCardUploadProgress, setShareCardUploadProgress] = useState(0);
  const [shareCardError, setShareCardError] = useState<string | null>(null);
  const shareCardFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Custom logo local upload states
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError(null);

    // Limit to 600KB to make sure it easily fits in Firestore's 1MB document limit
    if (file.size > 600 * 1024) {
      setLogoUploadError("A imagem do logotipo excede o limite recomendado de 600 KB para salvamento direto no banco de dados.");
      return;
    }

    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!acceptedTypes.includes(file.type)) {
      setLogoUploadError("Formato de imagem inválido. Use PNG, JPG, SVG, WEBP ou GIF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        setLocalCustomLogoUrl(base64String);
      }
    };
    reader.onerror = () => {
      setLogoUploadError("Erro ao ler o arquivo de imagem do computador.");
    };
    reader.readAsDataURL(file);
  };

  const loadShareCardSettings = async () => {
    try {
      const data = await dbService.getShareCardSettings();
      setShareCardSettings(data);
    } catch (e) {
      console.error("Error loading share card settings:", e);
    }
  };

  const resizeAndOptimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível obter contexto 2D do Canvas."));
          return;
        }

        const targetWidth = 1200;
        const targetHeight = 630;
        const imageAspectRatio = img.width / img.height;
        const targetAspectRatio = targetWidth / targetHeight;

        let drawWidth = img.width;
        let drawHeight = img.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imageAspectRatio > targetAspectRatio) {
          drawWidth = img.height * targetAspectRatio;
          offsetX = (img.width - drawWidth) / 2;
        } else {
          drawHeight = img.width / targetAspectRatio;
          offsetY = (img.height - drawHeight) / 2;
        }

        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Erro ao gerar blob do canvas."));
            }
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Erro ao decodificar a imagem selecionada."));
      };
      img.src = objectUrl;
    });
  };

  const handleShareCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setShareCardError("Formato de imagem inválido. Use JPEG, PNG ou WEBP.");
      return;
    }

    setShareCardError(null);
    setIsUploadingShareCard(true);
    setShareCardUploadProgress(10);

    try {
      setShareCardUploadProgress(25);
      const optimizedBlob = await resizeAndOptimizeImage(file);
      setShareCardUploadProgress(45);

      // We use the optimizedBlob directly to prevent 'new File()' Illegal constructor errors in sandboxed iframes
      console.log("Starting upload of client-side optimized share-card:", {
        size: optimizedBlob.size,
        type: "image/jpeg"
      });

      const response = await fetch("/api/r2-proxy-image-upload", {
        method: "POST",
        headers: {
          "X-File-Name": encodeURIComponent("global-share-card.jpg"),
          "X-File-Type": "image/jpeg",
          "X-File-Size": optimizedBlob.size.toString(),
          "X-User-Id": currentUser.userId,
          "X-User-Email": currentUser.email || "",
        },
        body: optimizedBlob,
      });

      setShareCardUploadProgress(75);

      if (response.ok) {
        const data = await response.json();
        const publicImageUrl = data.publicImageUrl;
        
        if (publicImageUrl) {
          await dbService.updateShareCardSettings(publicImageUrl, currentUser.userId);
        }

        setShareCardUploadProgress(100);
        triggerNotification("Imagem global do cartão atualizada com sucesso!");
        await loadShareCardSettings();
      } else {
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.error || `Falha HTTP ${response.status}`;
        setShareCardError(errMsg);
      }
    } catch (err: any) {
      console.error("Erro ao subir imagem global:", err);
      setShareCardError(err.message || "Erro de rede.");
    } finally {
      setIsUploadingShareCard(false);
      setTimeout(() => setShareCardUploadProgress(0), 1000);
    }
  };

  const handleRemoveShareCard = async () => {
    if (!window.confirm("Deseja realmente remover a imagem global de compartilhamento?")) return;
    try {
      await dbService.deleteShareCardSettings(currentUser.userId);
      triggerNotification("Imagem do cartão de compartilhamento removida!");
      setShareCardSettings(null);
    } catch (e: any) {
      console.error(e);
      triggerNotification("Erro ao remover a imagem do cartão.", true);
    }
  };

  // Integration States
  const [integrationStatus, setIntegrationStatus] = useState<{
    mercadoPagoAccessToken: boolean;
    mercadoPagoPublicKey: boolean;
    mercadoPagoWebhookSecret: boolean;
    appBaseUrl: boolean;
  } | null>(null);

  const loadIntegrationStatus = async () => {
    try {
      const res = await fetch('/api/admin/check-integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrationStatus(data);
      } else {
        setIntegrationStatus({
          mercadoPagoAccessToken: false,
          mercadoPagoPublicKey: false,
          mercadoPagoWebhookSecret: false,
          appBaseUrl: false
        });
      }
    } catch (e) {
      console.warn("Gracefully handled error loading integration status:", e);
      setIntegrationStatus({
        mercadoPagoAccessToken: false,
        mercadoPagoPublicKey: false,
        mercadoPagoWebhookSecret: false,
        appBaseUrl: false
      });
    }
  };

  // Manual release form state
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState<'free' | 'pro' | 'premium'>('pro');
  const [manualDuration, setManualDuration] = useState('30'); // in days
  const [manualLimit, setManualLimit] = useState(15);
  const [manualNotes, setManualNotes] = useState('');

  // Free trial form state
  const [trialEmail, setTrialEmail] = useState('');
  const [trialPlan, setTrialPlan] = useState<'pro' | 'premium'>('pro');
  const [trialDuration, setTrialDuration] = useState('7'); // days
  const [trialLimit, setTrialLimit] = useState(15);

  const loadPaymentSettings = async () => {
    setLoadingPayments(true);
    try {
      const data = await dbService.getPaymentSettings();
      if (data) {
        setPaymentSettings({
          essencialMonthlyUrl: data.essencialMonthlyUrl || '',
          essencialAnnualUrl: data.essencialAnnualUrl || '',
          proMonthlyUrl: data.proMonthlyUrl || '',
          proAnnualUrl: data.proAnnualUrl || '',
          premiumMonthlyUrl: data.premiumMonthlyUrl || '',
          premiumAnnualUrl: data.premiumAnnualUrl || '',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSaveLogoScale = async () => {
    setIsSavingLogoScale(true);
    setLogoSuccessMsg('');
    try {
      await dbService.updateAppearanceSettings({
        logoScale: localLogoScale,
        showLogo: localShowLogo,
        customLogoUrl: localCustomLogoUrl
      }, currentUser.email || 'admin');
      
      onLogoScaleChange(localLogoScale);
      onShowLogoChange(localShowLogo);
      onCustomLogoUrlChange(localCustomLogoUrl);
      
      setLogoSuccessMsg('Configurações de identidade visual salvas com sucesso em todo o site!');
      setTimeout(() => setLogoSuccessMsg(''), 4500);
    } catch (e) {
      console.error("Erro ao salvar configurações de identidade visual:", e);
    } finally {
      setIsSavingLogoScale(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await dbService.getAllUsersForAdmin();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadInfraMetrics = async () => {
    try {
      setLoadingInfra(true);
      setInfraError(null);

      // 1. Fetch songs
      const songsSnap = await getDocs(collection(db, 'songs'));
      const songsList: any[] = [];
      songsSnap.forEach(docSnap => {
        songsList.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 2. Fetch audioFiles
      const audioFilesSnap = await getDocs(collection(db, 'audioFiles'));
      const audioFilesList: any[] = [];
      audioFilesSnap.forEach(docSnap => {
        audioFilesList.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 3. Make sure we have latest users list
      let currentUsers = users;
      if (currentUsers.length === 0) {
        currentUsers = await dbService.getAllUsersForAdmin();
        setUsers(currentUsers);
      }

      const totalSongsCount = songsList.length;
      const totalAudioFilesCount = audioFilesList.length;

      // Calculate total physical space used based on audioFiles (which are R2 files)
      let totalSpaceUsedBytes = 0;
      audioFilesList.forEach(af => {
        totalSpaceUsedBytes += Number(af.fileSize || af.size || 0);
      });

      // R2 free tier limit is 10 GB
      const tenGBInBytes = 10 * 1024 * 1024 * 1024;
      const r2FreeLimitPercent = totalSpaceUsedBytes > 0 ? (totalSpaceUsedBytes / tenGBInBytes) * 100 : 0;

      // Find largest song from songsList
      let maxSizeBytes = 0;
      let largestSongObj: any = null;
      songsList.forEach(s => {
        const size = Number(s.fileSize || 0);
        if (size > maxSizeBytes) {
          maxSizeBytes = size;
          largestSongObj = s;
        }
      });

      let largestSong: { title: string; sizeBytes: number; ownerName: string; ownerId: string } | null = null;
      if (largestSongObj) {
        const ownerId = largestSongObj.ownerId || largestSongObj.userId || '';
        const owner = currentUsers.find(u => u.userId === ownerId);
        largestSong = {
          title: largestSongObj.title || largestSongObj.originalFileName || 'Sem título',
          sizeBytes: maxSizeBytes,
          ownerName: owner ? owner.name : 'Artista Desconhecido',
          ownerId: ownerId
        };
      }

      // Average song size
      const averageSongSizeBytes = totalSongsCount > 0 ? (totalSpaceUsedBytes / totalSongsCount) : 0;

      // Group space by users
      const userSpaceMap: Record<string, { songsCount: number; spaceUsedBytes: number }> = {};
      songsList.forEach(s => {
        const ownerId = s.ownerId || s.userId;
        if (ownerId) {
          if (!userSpaceMap[ownerId]) {
            userSpaceMap[ownerId] = { songsCount: 0, spaceUsedBytes: 0 };
          }
          userSpaceMap[ownerId].songsCount++;
          userSpaceMap[ownerId].spaceUsedBytes += Number(s.fileSize || 0);
        }
      });

      // Top space user
      let topUserBySpace: { userId: string; userName: string; songsCount: number; totalSizeBytes: number } | null = null;
      let maxUserSpace = 0;
      Object.entries(userSpaceMap).forEach(([uid, stats]) => {
        if (stats.spaceUsedBytes > maxUserSpace) {
          maxUserSpace = stats.spaceUsedBytes;
          const userObj = currentUsers.find(u => u.userId === uid);
          topUserBySpace = {
            userId: uid,
            userName: userObj ? userObj.name : 'Artista Desconhecido',
            songsCount: stats.songsCount,
            totalSizeBytes: stats.spaceUsedBytes
          };
        }
      });

      // Space and songs by plan
      const planStats: Record<string, { songsCount: number; spaceUsedBytes: number }> = {
        free: { songsCount: 0, spaceUsedBytes: 0 },
        essencial: { songsCount: 0, spaceUsedBytes: 0 },
        pro: { songsCount: 0, spaceUsedBytes: 0 },
        premium: { songsCount: 0, spaceUsedBytes: 0 }
      };

      songsList.forEach(s => {
        const ownerId = s.ownerId || s.userId;
        const owner = currentUsers.find(u => u.userId === ownerId);
        const plan = (owner?.plan || 'free').toLowerCase();
        const validPlan = ['free', 'essencial', 'pro', 'premium'].includes(plan) ? plan : 'free';
        planStats[validPlan].songsCount++;
        planStats[validPlan].spaceUsedBytes += Number(s.fileSize || 0);
      });

      // Orphan files check / Possible media inconsistencies check
      const referencedAudioFileIds = new Set();
      const referencedStoragePaths = new Set();
      const referencedAudioUrls = new Set();

      songsList.forEach(s => {
        if (s.audioFileId) referencedAudioFileIds.add(String(s.audioFileId).trim());
        if (s.storagePath) {
          const pathStr = String(s.storagePath).trim();
          referencedStoragePaths.add(pathStr);
          referencedStoragePaths.add(decodeURIComponent(pathStr));
        }
        if (s.audioUrl) {
          const urlStr = String(s.audioUrl).trim();
          referencedAudioUrls.add(urlStr);
          referencedAudioUrls.add(decodeURIComponent(urlStr));
        }
      });

      const orphanFiles: { id: string; fileName: string; fileSize: number; createdAt?: string }[] = [];
      audioFilesList.forEach(af => {
        const id = af.id;
        const sPath = af.storagePath || af.path || '';
        const afUrl = af.audioUrl || af.url || '';

        const sPathDecoded = decodeURIComponent(sPath);
        const afUrlDecoded = decodeURIComponent(afUrl);

        const isReferenced = 
          referencedAudioFileIds.has(id) || 
          referencedStoragePaths.has(sPath) || 
          referencedStoragePaths.has(sPathDecoded) ||
          (sPath && Array.from(referencedStoragePaths).some(p => String(p).includes(sPath) || sPath.includes(String(p)))) ||
          (sPathDecoded && Array.from(referencedStoragePaths).some(p => String(p).includes(sPathDecoded) || sPathDecoded.includes(String(p)))) ||
          referencedAudioUrls.has(afUrl) ||
          referencedAudioUrls.has(afUrlDecoded) ||
          (afUrl && Array.from(referencedAudioUrls).some(u => String(u).includes(afUrl) || afUrl.includes(String(u)))) ||
          (afUrlDecoded && Array.from(referencedAudioUrls).some(u => String(u).includes(afUrlDecoded) || afUrlDecoded.includes(String(u))));

        if (!isReferenced) {
          let dateStr: string | undefined = undefined;
          if (af.createdAt) {
            if (af.createdAt.seconds) {
              dateStr = new Date(af.createdAt.seconds * 1000).toISOString();
            } else if (af.createdAt instanceof Date) {
              dateStr = af.createdAt.toISOString();
            } else {
              dateStr = af.createdAt;
            }
          }
          orphanFiles.push({
            id,
            fileName: af.originalFileName || af.fileName || 'Arquivo sem nome',
            fileSize: Number(af.fileSize || af.size || 0),
            createdAt: dateStr
          });
        }
      });

      // Users close to limit
      const usersNearLimit: { userId: string; name: string; plan: string; songsCount: number; limit: number; percentage: number }[] = [];
      currentUsers.forEach(u => {
        const limit = u.musicLimit !== undefined ? u.musicLimit : (u.plan === 'free' ? 3 : (u.plan === 'essencial' ? 10 : (u.plan === 'pro' ? 15 : 50)));
        const songsCount = userSpaceMap[u.userId]?.songsCount || 0;
        const percentage = limit > 0 ? (songsCount / limit) * 100 : 0;
        if (percentage >= 80) {
          usersNearLimit.push({
            userId: u.userId,
            name: u.name,
            plan: u.plan || 'free',
            songsCount,
            limit,
            percentage
          });
        }
      });

      usersNearLimit.sort((a, b) => b.percentage - a.percentage);

      setInfraMetrics({
        totalSongs: totalSongsCount,
        totalAudioFiles: totalAudioFilesCount,
        totalSpaceUsedBytes,
        r2FreeLimitPercent,
        largestSong,
        averageSongSizeBytes,
        topUserBySpace,
        planStats,
        orphanFiles,
        usersNearLimit
      });

    } catch (err: any) {
      console.error("Error loading infra metrics:", err);
      setInfraError(err.message || "Não foi possível carregar as métricas de infraestrutura. Verifique a conexão com o banco de dados.");
    } finally {
      setLoadingInfra(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'infra') {
      loadInfraMetrics();
    }
  }, [activeTab]);

  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const snap = await getDocs(collection(db, 'mp_subscriptions'));
      const list: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.plan && typeof data.plan === 'string') {
          data.plan = data.plan.toLowerCase();
        }
        list.push({ id: doc.id, ...data });
      });
      list.sort((a, b) => {
        const timeA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt || a.paidAt || 0).getTime();
        const timeB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt || b.paidAt || 0).getTime();
        return timeB - timeA;
      });
      setMpSubscriptions(list);
    } catch (err) {
      console.error("Error loading subscriptions:", err);
      handleFirestoreError(err, OperationType.GET, 'mp_subscriptions');
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleVerifySubscription = async (id: string) => {
    try {
      setVerifyingId(id);
      triggerNotification("Processando sincronização com Mercado Pago...", false);
      const res = await fetch('/api/mercadopago-webhook?reprocess=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          data: { id: id }
        })
      });
      const data = await res.json();
      if (data.processed) {
        triggerNotification(`Sincronizado! Plano ${data.plan?.toUpperCase()} ativado para o usuário.`);
        loadSubscriptions();
        loadData();
      } else if (data.ignored) {
        triggerNotification(`Ignorado: ${data.reason || 'Não aprovado ou simulação'}`, true);
      } else {
        triggerNotification(`Divergência: ${data.error || 'Erro inesperado'}`, true);
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Erro ao consultar webhook: ${err.message || String(err)}`, true);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleManualVerifyPayment = async (forcePlanParam?: any) => {
    const rawId = String(manualPaymentId || '').trim();
    if (!rawId) {
      triggerNotification("Por favor, digite um ID de pagamento válido.", true);
      return;
    }

    const finalForcePlan = (typeof forcePlanParam === 'string') ? forcePlanParam : undefined;
    const isForced = !!finalForcePlan;

    try {
      setManualVerifying(true);
      if (!isForced) {
        setManualVerifyResult(null);
      }
      triggerNotification(isForced ? "Ativando plano diretamente no banco de dados..." : "Iniciando verificação manual de pagamento...", false);

      const payload: { action: string; paymentId: string; forcePlan?: string } = {
        action: 'verify_payment',
        paymentId: rawId
      };

      if (finalForcePlan) {
        payload.forcePlan = finalForcePlan;
      }

      const res = await fetch('/api/mercadopago-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      setManualVerifyResult({
        success: !!data.success,
        paymentId: data.paymentId || rawId,
        status: data.status || 'unknown',
        planActivated: !!data.planActivated,
        message: data.message || 'Resultado sem mensagem descritiva.'
      });

      if (data.success) {
        triggerNotification(isForced ? "Plano ativado com sucesso!" : "Pagamento reprocessado e plano ativado com sucesso!");
        loadSubscriptions();
        loadData();
      } else {
        triggerNotification("Verificação finalizada. Verifique os logs ou a mensagem exibida.", true);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setManualVerifyResult({
        success: false,
        paymentId: rawId,
        status: 'error',
        planActivated: false,
        message: `Erro de rede/servidor ao enviar requisição: ${errMsg}`
      });
      triggerNotification("Erro ao conectar com servidor para verificação.", true);
    } finally {
      setManualVerifying(false);
    }
  };

  const handleSaveSubEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubUserId) {
      triggerNotification("O ID do usuário (UID) é obrigatório.", true);
      return;
    }

    askConfirmation(
      "Confirmar Sincronização de Plano",
      `Deseja realmente sincronizar manualmente os dados da assinatura ${selectedSub.id} para o usuário ID "${editSubUserId}"? Isso alterará as permissões de acesso deste usuário imediatamente no banco de dados.`,
      async () => {
        try {
          const limit = editSubPlan === 'premium' ? 50 : (editSubPlan === 'pro' ? 15 : (editSubPlan === 'essencial' ? 10 : 3));
          const isNowActive = editSubStatus === 'authorized' || editSubStatus === 'approved' || editSubStatus === 'active';
          const actualPlan = isNowActive ? editSubPlan : 'free';
          const actualLimit = isNowActive ? limit : 5;
          const paymentStatus = isNowActive ? 'active' : 'inactive';
          
          const activatedAt = new Date();
          const expiresAt = new Date();
          if (editSubCycle === 'yearly') {
            expiresAt.setFullYear(activatedAt.getFullYear() + 1);
          } else {
            expiresAt.setDate(activatedAt.getDate() + 31);
          }

          const activatedStr = activatedAt.toISOString();
          const expiresStr = expiresAt.toISOString();

          const userPayload = {
            plan: actualPlan,
            billingCycle: editSubCycle === 'yearly' ? 'annual' : 'monthly',
            musicLimit: actualLimit,
            subscriptionStatus: isNowActive ? 'ativo' : 'cancelado',
            paymentStatus: paymentStatus,
            accessType: isNowActive ? 'subscriber' : 'free',
            mercadoPagoSubscriptionId: selectedSub.subscriptionId || selectedSub.id,
            mercadoPagoPaymentId: selectedSub.paymentId || selectedSub.id,
            planActivatedAt: isNowActive ? activatedStr : null,
            planExpiresAt: isNowActive ? expiresStr : null,
            subscriptionStartedAt: isNowActive ? activatedStr : null,
            subscriptionEndsAt: isNowActive ? expiresStr : null,
            updatedAt: activatedStr
          };

          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', editSubUserId), userPayload, { merge: true });
          await setDoc(doc(db, 'artists', editSubUserId), userPayload, { merge: true });

          await setDoc(doc(db, 'mp_subscriptions', selectedSub.id), {
            id: selectedSub.id,
            userId: editSubUserId,
            email: editSubEmail,
            plan: actualPlan,
            billingCycle: editSubCycle === 'yearly' ? 'annual' : 'monthly',
            status: editSubStatus,
            paymentId: selectedSub.paymentId || "",
            subscriptionId: selectedSub.subscriptionId || "",
            musicLimit: actualLimit,
            paidAt: activatedStr,
            updatedAt: new Date()
          }, { merge: true });

          await dbService.enforceTracksByPlanValidityAsync(editSubUserId, actualPlan, actualLimit);

          triggerNotification("Assinatura e plano do usuário sincronizados com sucesso!");
          setSelectedSub(null);
          loadSubscriptions();
        } catch (err: any) {
          console.error("Error saving subscription manual edit:", err);
          triggerNotification("Erro ao atualizar dados: " + (err.message || String(err)), true);
          handleFirestoreError(err, OperationType.WRITE, `mp_subscriptions/${selectedSub?.id}`);
        }
      }
    );
  };

  useEffect(() => {
    loadData();
    loadPaymentSettings();
    loadShareCardSettings();
    loadIntegrationStatus();
    loadSubscriptions();
  }, []);

  useEffect(() => {
    if (activeTab === 'mercadopago') {
      loadSubscriptions();
    }
    if (activeTab === 'settings') {
      loadIntegrationStatus();
      loadShareCardSettings();
    }
  }, [activeTab]);

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updatePaymentSettings(paymentSettings, currentUser.email || 'Admin');
      triggerNotification("Links de pagamento atualizados com sucesso!");
      loadPaymentSettings();
    } catch (e) {
      triggerNotification("Erro ao salvar links de pagamento.", true);
    }
  };

  const triggerNotification = (message: string, isError = false) => {
    if (isError) {
      setActionError(message);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(message);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleToggleBlock = async (user: Artist) => {
    const nextBlockStatus = !user.isBlocked;
    try {
      await dbService.updateUserDataFromAdmin(user.userId, { isBlocked: nextBlockStatus });
      triggerNotification(`Usuário ${user.name} foi ${nextBlockStatus ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
      loadData();
      if (selectedUser && selectedUser.userId === user.userId) {
        setSelectedUser({ ...selectedUser, isBlocked: nextBlockStatus });
      }
    } catch {
      triggerNotification("Erro ao atualizar status de bloqueio.", true);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Validation: Expiration date check for trial active plans. Manual plans do not require an expiration date.
    const accessType = selectedUser.accessType || 'free';
    const plan = selectedUser.plan || 'free';

    if (plan !== 'free') {
      if (accessType === 'manual') {
        if (selectedUser.manualAccessEndsAt) {
          if (new Date(selectedUser.manualAccessEndsAt) <= new Date()) {
            triggerNotification("Erro: A data de término do acesso manual precisa ser no futuro.", true);
            return;
          }
        }
      } else if (accessType === 'trial') {
        if (!selectedUser.trialEndsAt) {
          triggerNotification("Erro: Todo plano trial/teste precisa obrigatoriamente ter uma data de término do teste grátis definida.", true);
          return;
        }
        if (new Date(selectedUser.trialEndsAt) <= new Date()) {
          triggerNotification("Erro: A data de término do teste grátis precisa ser no futuro.", true);
          return;
        }
      }
    }

    const originalUser = users.find(u => u.userId === selectedUser.userId);
    let finalLimit = selectedUser.musicLimit;
    if (finalLimit === undefined) {
      finalLimit = selectedUser.plan === 'free' ? 3 : (selectedUser.plan === 'essencial' ? 10 : (selectedUser.plan === 'pro' ? 15 : 50));
    }

    const hasPlanChanged = originalUser && originalUser.plan !== selectedUser.plan;
    const hasLimitChanged = originalUser && Number(originalUser.musicLimit) !== Number(finalLimit);
    const hasStatusChanged = originalUser && (
      originalUser.accessType !== selectedUser.accessType ||
      originalUser.paymentStatus !== selectedUser.paymentStatus
    );

    const executeSave = async () => {
      try {
        console.log(`[PLAN_RELEASE_DEBUG] Executando salvamento de edição de usuário ${selectedUser.userId}. Plano: ${selectedUser.plan}, Limite: ${finalLimit}`);
        const updatedFields: Partial<Artist> = {
          plan: selectedUser.plan,
          role: selectedUser.role || 'user',
          paymentStatus: selectedUser.paymentStatus || 'inactive',
          accessType: selectedUser.accessType || 'free',
          // If upgraded to paid, let's make sure planStatus/subscriptionStatus are active!
          planStatus: selectedUser.plan !== 'free' ? 'active' : 'expired',
          subscriptionStatus: selectedUser.plan !== 'free' ? 'ativo' : 'cancelado',
          musicLimit: Number(finalLimit),
          trialEndsAt: selectedUser.trialEndsAt || null,
          manualAccessEndsAt: selectedUser.manualAccessEndsAt || null,
          subscriptionStartedAt: selectedUser.subscriptionStartedAt || null,
          subscriptionEndsAt: selectedUser.subscriptionEndsAt || null,
          mercadoPagoPaymentId: selectedUser.mercadoPagoPaymentId || null,
          mercadoPagoSubscriptionId: selectedUser.mercadoPagoSubscriptionId || null,
          isBlocked: selectedUser.isBlocked || false,
          name: selectedUser.name,
          city: selectedUser.city,
          state: selectedUser.state,
          whatsapp: selectedUser.whatsapp,
          instagram: selectedUser.instagram,
        };

        console.log(`[PLAN_RELEASE_DEBUG] Campos preparados para salvamento:`, JSON.stringify(updatedFields));
        await dbService.updateUserDataFromAdmin(selectedUser.userId, updatedFields);
        console.log(`[PLAN_RELEASE_DEBUG] Perfil salvo para ${selectedUser.userId}. Rodando reenquadramento...`);
        await dbService.enforceTracksByPlanValidityAsync(selectedUser.userId, updatedFields.plan || 'free', Number(updatedFields.musicLimit));
        console.log(`[PLAN_RELEASE_DEBUG] Reenquadramento finalizado para ${selectedUser.userId}.`);
        triggerNotification("Alterações salvas com sucesso!");
        setSelectedUser(null);
        loadData();
      } catch (err) {
        console.error(`[PLAN_RELEASE_DEBUG] Erro ao salvar alterações para ${selectedUser.userId}:`, err);
        triggerNotification("Erro ao salvar alterações.", true);
      }
    };

    if (hasPlanChanged || hasLimitChanged || hasStatusChanged) {
      const changesList: string[] = [];
      if (hasPlanChanged) {
        changesList.push(`- Plano: "${originalUser.plan?.toUpperCase() || 'FREE'}" ➔ "${selectedUser.plan?.toUpperCase()}"`);
      }
      if (hasLimitChanged) {
        changesList.push(`- Limite de Músicas: ${originalUser.musicLimit || 3} ➔ ${finalLimit}`);
      }
      if (hasStatusChanged) {
        changesList.push(`- Tipo de Acesso: "${originalUser.accessType?.toUpperCase() || 'FREE'}" ➔ "${selectedUser.accessType?.toUpperCase()}"`);
        changesList.push(`- Status de Pagamento: "${originalUser.paymentStatus?.toUpperCase() || 'INACTIVE'}" ➔ "${selectedUser.paymentStatus?.toUpperCase()}"`);
      }

      askConfirmation(
        "Confirmar Alterações Críticas",
        `Deseja realmente salvar as seguintes alterações críticas de faturamento para o usuário ${selectedUser.name || 'Não identificado'}?\n\n` + changesList.join('\n'),
        executeSave
      );
    } else {
      executeSave();
    }
  };

  const handleManualRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      triggerNotification("O e-mail é obrigatório.", true);
      return;
    }

    const emailSearch = manualEmail.trim().toLowerCase();
    const matchedUser = users.find(u => u.email.toLowerCase() === emailSearch);

    if (!matchedUser) {
      triggerNotification("Este usuário não foi encontrado no sistema. Por favor, registre o usuário primeiro ou use o e-mail cadastrado.", true);
      return;
    }

    // Confirm manual release
    askConfirmation(
      "Confirmar Ativação Manual",
      manualDuration === 'unlimited'
        ? `Deseja liberar o acesso permanente ao plano ${manualPlan.toUpperCase()} com limite de ${manualLimit} músicas SEM VENCIMENTO para o usuário ${matchedUser.name}?`
        : `Deseja liberar o acesso ao plano ${manualPlan.toUpperCase()} com limite de ${manualLimit} músicas por ${manualDuration} dias para o usuário ${matchedUser.name}?\n\nIsso gerará um vencimento obrigatório em ${manualDuration} dias.`,
      async () => {
        try {
          console.log(`[PLAN_RELEASE_DEBUG] Iniciando liberação manual para usuário ${matchedUser.userId}. Plano: ${manualPlan}, Limite: ${manualLimit}, Duração: ${manualDuration}.`);
          const now = new Date();
          let expiresAt: Date | null = null;
          if (manualDuration !== 'unlimited') {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + Number(manualDuration));
          }

          const updatedFields: Partial<Artist> = {
            plan: manualPlan,
            accessType: 'manual',
            paymentStatus: 'manual',
            planStatus: 'active',
            subscriptionStatus: 'ativo',
            musicLimit: Number(manualLimit),
            manualAccessEndsAt: expiresAt ? expiresAt.toISOString() : null,
            subscriptionStartedAt: now.toISOString(),
            subscriptionEndsAt: expiresAt ? expiresAt.toISOString() : null,
            bio: manualNotes ? `${matchedUser.bio || ''} - Nota Admin: ${manualNotes}` : matchedUser.bio
          };

          console.log(`[PLAN_RELEASE_DEBUG] Campos de atualização preparados:`, JSON.stringify(updatedFields));
          await dbService.updateUserDataFromAdmin(matchedUser.userId, updatedFields);
          console.log(`[PLAN_RELEASE_DEBUG] Perfil atualizado no Firestore para ${matchedUser.userId}. Executando reenquadramento de faixas...`);
          await dbService.enforceTracksByPlanValidityAsync(matchedUser.userId, manualPlan, Number(manualLimit));
          console.log(`[PLAN_RELEASE_DEBUG] Reenquadramento de faixas finalizado com sucesso para ${matchedUser.userId}.`);
          triggerNotification(
            manualDuration === 'unlimited'
              ? `Acesso manual sem vencimento liberado para ${matchedUser.name}!`
              : `Acesso manual de ${manualDuration} dias liberado para ${matchedUser.name}!`
          );
          setManualEmail('');
          setManualNotes('');
          loadData();
        } catch (err) {
          console.error(`[PLAN_RELEASE_DEBUG] Erro ao aplicar liberação manual para ${matchedUser.userId}:`, err);
          triggerNotification("Erro ao aplicar liberação manual.", true);
        }
      }
    );
  };

  const handleCreateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialEmail.trim()) {
      triggerNotification("O e-mail é obrigatório.", true);
      return;
    }

    const emailSearch = trialEmail.trim().toLowerCase();
    const matchedUser = users.find(u => u.email.toLowerCase() === emailSearch);

    if (!matchedUser) {
      triggerNotification("Este usuário não foi encontrado no sistema. Por favor, registre o usuário primeiro ou use o e-mail cadastrado.", true);
      return;
    }

    // Confirm trial creation
    askConfirmation(
      "Confirmar Criação de Teste Grátis",
      `Deseja criar um período de teste de ${trialDuration} dias no plano ${trialPlan.toUpperCase()} para o usuário ${matchedUser.name}?\n\nIsso gerará um vencimento obrigatório em ${trialDuration} dias.`,
      async () => {
        try {
          const now = new Date();
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + Number(trialDuration));

          const updatedFields: Partial<Artist> = {
            plan: trialPlan,
            accessType: 'trial',
            paymentStatus: 'active',
            musicLimit: Number(trialLimit),
            trialEndsAt: trialEnds.toISOString(),
            subscriptionStartedAt: now.toISOString(),
            subscriptionEndsAt: trialEnds.toISOString(),
          };

          await dbService.updateUserDataFromAdmin(matchedUser.userId, updatedFields);
          await dbService.enforceTracksByPlanValidityAsync(matchedUser.userId, trialPlan, Number(trialLimit));
          triggerNotification(`Teste grátis de ${trialDuration} dias (Plano ${trialPlan.toUpperCase()}) criado e ativado para ${matchedUser.name}!`);
          setTrialEmail('');
          loadData();
        } catch {
          triggerNotification("Erro ao criar teste grátis.", true);
        }
      }
    );
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
    const searchString = `${user.name} ${user.email} ${user.whatsapp || ''} ${user.instagram || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    
    const matchesBlocked = blockedFilter === 'all' || 
      (blockedFilter === 'blocked' && user.isBlocked) || 
      (blockedFilter === 'active' && !user.isBlocked);
    
    return matchesSearch && matchesPlan && matchesBlocked;
  });

  // Analytics Metrics calculations
  const totalUsers = users.length;
  const freeCount = users.filter(u => u.plan === 'free').length;
  const proCount = users.filter(u => u.plan === 'pro').length;
  const premiumCount = users.filter(u => u.plan === 'premium').length;
  const blockedCount = users.filter(u => u.isBlocked).length;
  const totalSongs = dbService.getTotalSongsCount();

  // Find a real associated user in the system, excluding empty or unknown IDs/emails
  const findAssociatedUser = (sub: any) => {
    if (!sub) return null;
    const subUid = (sub.userId || sub.uid || '').trim();
    const subEmail = (sub.email || '').toLowerCase().trim();
    
    if (!subUid || subUid === 'unknown' || subUid === 'null') {
      return null;
    }
    
    // Find by exact user ID or by email
    const found = users.find(u => {
      const uId = (u.userId || u.id || '').trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      if (!uId || uId === 'unknown' || uId === 'null') return false;
      
      // Match by ID first
      if (uId === subUid) return true;
      
      // Match by non-empty email
      if (subEmail && subEmail !== 'unknown' && uEmail === subEmail) return true;
      
      return false;
    });
    return found || null;
  };

  // Helper for origin classification
  const getSubscriptionOrigin = (sub: any, assocUser: any) => {
    const isSignatureError = sub.status === 'SIGNATURE_ERROR' || sub.status === 'signature_error' || (sub.errorMessage && sub.errorMessage.toLowerCase().includes('signature'));
    if (isSignatureError) {
      return { label: 'Erro', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/25' };
    }

    const isNotFound = sub.status === 'NOT_FOUND' || sub.status === 'not_found' || (sub.errorMessage && sub.errorMessage.toLowerCase().includes('not_found'));
    if (isNotFound) {
      return { label: 'Erro', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/25' };
    }

    const isSandbox = 
      (sub.email && sub.email.toLowerCase().includes('sandbox')) || 
      (sub.status && sub.status.toLowerCase().includes('sandbox')) ||
      (sub.userId && sub.userId.toLowerCase().includes('sandbox'));
    if (isSandbox) {
      return { label: 'Sandbox', color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' };
    }

    const isTest = 
      (sub.email && sub.email.toLowerCase().includes('test')) || 
      (sub.status && sub.status.toLowerCase().includes('test')) ||
      (sub.id && sub.id.toLowerCase().includes('test'));
    if (isTest) {
      return { label: 'Teste', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' };
    }

    const hasUnknownUser = 
      !sub.userId || 
      sub.userId === 'unknown' || 
      sub.userId === 'null' || 
      !sub.email || 
      sub.email === 'unknown' || 
      sub.email === 'null' ||
      sub.email.toLowerCase().includes('unknown');

    const isOrphan = !assocUser || hasUnknownUser;
    if (isOrphan) {
      return { label: 'Órfão', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/25' };
    }

    if (assocUser?.accessType === 'manual') {
      return { label: 'Manual', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/25' };
    }

    return { label: 'Mercado Pago', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' };
  };

  // Helper for expiration calculation
  const getExpirationDetails = (sub: any, assocUser: any) => {
    const dateVal = assocUser?.subscriptionEndsAt || assocUser?.planExpiresAt || assocUser?.manualAccessEndsAt || sub.expiresAt || sub.planExpiresAt || sub.subscriptionEndsAt;
    if (!dateVal) {
      return { text: 'Sem vencimento', daysLeft: null, date: null };
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        return { text: 'Não identificado', daysLeft: null, date: null };
      }
      const now = new Date();
      const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = dZero.getTime() - nowZero.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const dateFormatted = d.toLocaleDateString('pt-BR');
      
      if (diffDays < 0) {
        return { text: `${dateFormatted} (Expirado)`, daysLeft: diffDays, date: d };
      } else if (diffDays === 0) {
        return { text: `${dateFormatted} (Expira hoje)`, daysLeft: diffDays, date: d };
      } else {
        return { text: `${dateFormatted} (${diffDays} dias restantes)`, daysLeft: diffDays, date: d };
      }
    } catch {
      return { text: 'Não identificado', daysLeft: null, date: null };
    }
  };

  const pendingActivationPayments = mpSubscriptions.filter(sub => {
    const assocUser = findAssociatedUser(sub);
    const origin = getSubscriptionOrigin(sub, assocUser);
    
    // Only flag as a pending activation alert if it's a real user and real subscription
    if (origin.label !== 'Real' || !assocUser) return false;

    // Must have a valid email and userId, not unknown
    const subUid = sub.userId || sub.uid;
    if (!subUid || subUid === 'unknown' || subUid === 'null' || !sub.email || sub.email === 'unknown' || sub.email === 'null') {
      return false;
    }

    return (sub.status === 'approved' || sub.status === 'active' || sub.status === 'authorized' || sub.status === 'orphan_payment') && 
      sub.planActivated !== true;
  });

  const pendingReversalRefunds = mpSubscriptions.filter(sub => {
    const assocUser = findAssociatedUser(sub);
    const origin = getSubscriptionOrigin(sub, assocUser);
    
    // Only flag as a pending reversal alert if it's a real user and real subscription
    if (origin.label !== 'Real' || !assocUser) return false;

    // Must have a valid email and userId, not unknown
    const subUid = sub.userId || sub.uid;
    if (!subUid || subUid === 'unknown' || subUid === 'null' || !sub.email || sub.email === 'unknown' || sub.email === 'null') {
      return false;
    }

    if (sub.status !== 'refunded' && sub.status !== 'cancelled' && sub.status !== 'charged_back' && sub.status !== 'chargedback') return false;
    
    return assocUser.plan && assocUser.plan !== 'free';
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Visual Header */}
      <header className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-30 px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
            <ShieldCheck className="h-6 w-6 text-slate-900 font-bold" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              SOMDRIVE <span className="text-orange-500 text-xs ml-2 font-mono uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Painel Admin</span>
            </h1>
            <p className="text-slate-400 text-xs hidden md:block">Gerenciamento geral da plataforma SomDrive</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Painel Artista</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Admin Warning Segment */}
      <section className="bg-gradient-to-r from-orange-600/10 via-amber-600/10 to-transparent border-b border-orange-500/15 p-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
          <p className="text-xs md:text-sm text-yellow-500 font-medium">
            "Use esta área para liberar acesso manual, criar testes grátis e controlar planos sem precisar passar pelo Mercado Pago."
          </p>
        </div>
      </section>

      {/* Notification Toasts */}
      {actionSuccess && (
        <div className="fixed bottom-24 right-6 bg-slate-900 border-l-4 border-emerald-500 p-4 rounded-xl shadow-xl z-50 flex items-center space-x-2.5 max-w-sm animate-fade-in text-slate-100">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-xs font-medium">{actionSuccess}</p>
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-24 right-6 bg-slate-900 border-l-4 border-red-500 p-4 rounded-xl shadow-xl z-50 flex items-center space-x-2.5 max-w-sm animate-fade-in text-slate-100">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-xs font-medium">{actionError}</p>
        </div>
      )}

      {/* Primary Layout Controls */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar Drawer */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase px-3">NAVEGAÇÃO</h3>
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard Geral</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('users'); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'users' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4" />
                <span>Gerenciar Usuários</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{totalUsers}</span>
            </button>
            <button
              onClick={() => { setActiveTab('manual'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'manual' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4" />
                <span>Liberações & Testes</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('payments'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'payments' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4" />
                <span>Configurações de Pagamento</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('mercadopago'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'mercadopago' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Assinaturas Mercado Pago</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('infra'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'infra' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4" />
                <span>Infraestrutura e Armazenamento</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('announcements'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'announcements' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <Megaphone className="h-4 w-4" />
                <span>Mural de Avisos / Audições</span>
              </div>
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setSelectedUser(null); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-500 border-l-4 border-orange-500' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <div className="flex items-center space-x-3">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </div>
            </button>
          </nav>
          
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl mt-6 hidden lg:block">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center">
              <Info className="h-3.5 w-3.5 text-orange-500 mr-2" />
              Início Rápido
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O controle de acesso manual permite conceder acesso a planos pagos com datas de expiração customizadas. O sistema realiza reverssão automática de usuários com prazos vencidos.
            </p>
          </div>
        </div>

        {/* Dynamic Panel Canvas */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Statistics Bento Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-xl">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Total de Usuários</span>
                  <div className="flex items-baseline space-x-2 mt-4">
                    <span className="text-3xl font-black text-white">{loading ? '...' : totalUsers}</span>
                    <span className="text-[10px] font-mono text-slate-500">cadastros</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-xl">
                  <span className="text-xs font-semibold text-amber-500 tracking-wider uppercase">Plano Pro</span>
                  <div className="flex items-baseline space-x-2 mt-4">
                    <span className="text-3xl font-black text-white">{loading ? '...' : proCount}</span>
                    <span className="text-[10px] font-mono text-amber-500/70">assinantes</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-xl">
                  <span className="text-xs font-semibold text-orange-500 tracking-wider uppercase">Plano Premium</span>
                  <div className="flex items-baseline space-x-2 mt-4">
                    <span className="text-3xl font-black text-white">{loading ? '...' : premiumCount}</span>
                    <span className="text-[10px] font-mono text-orange-500/70">assinantes</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between shadow-xl">
                  <span className="text-xs font-semibold text-red-500 tracking-wider uppercase">Bloqueados</span>
                  <div className="flex items-baseline space-x-2 mt-4">
                    <span className="text-3xl font-black text-white">{loading ? '...' : blockedCount}</span>
                    <span className="text-[10px] font-mono text-red-400/70">suspensos</span>
                  </div>
                </div>

              </div>

              {/* Sub grid storage + music totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-base font-bold text-white mb-4">Distribuição de Planos</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-slate-600 mr-2"></span>Free ({freeCount})</span>
                        <span>{totalUsers > 0 ? Math.round((freeCount / totalUsers) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-550 rounded-full" style={{ width: `${totalUsers > 0 ? (freeCount / totalUsers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>Pro ({proCount})</span>
                        <span>{totalUsers > 0 ? Math.round((proCount / totalUsers) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalUsers > 0 ? (proCount / totalUsers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>Premium ({premiumCount})</span>
                        <span>{totalUsers > 0 ? Math.round((premiumCount / totalUsers) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalUsers > 0 ? (premiumCount / totalUsers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-tr from-orange-950/40 to-slate-900 border border-orange-500/10 p-6 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Disc className="h-32 w-32 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Músicas do Catálogo</span>
                    <h2 className="text-4xl font-extrabold text-white mt-3">{loading ? '...' : totalSongs}</h2>
                    <p className="text-xs text-slate-400 mt-2">Arquivos MP3 hospedados na nuvem do Firebase Storage.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="mt-6 text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center transition"
                  >
                    Ver listas por artista <ArrowLeft className="h-3.5 w-3.5 rotate-180 ml-1.5" />
                  </button>
                </div>

              </div>

              {/* Usuários Cadastrados Recentemente */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" /> Usuários Cadastrados Recentemente
                    </h3>
                    <p className="text-slate-400 text-xs">Últimos usuários cadastrados de verdade (ordenados por cadastro recente)</p>
                  </div>
                  <button onClick={loadData} className="text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl transition">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" /> Atualizar
                  </button>
                </div>
                
                {loading ? (
                  <div className="py-8 text-center text-slate-500 text-sm">Carregando usuários...</div>
                ) : users.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 text-sm">Nenhum usuário cadastrado ainda.</div>
                ) : (
                  <div className="divide-y divide-slate-800/60 space-y-4 md:space-y-0">
                    {[...users]
                      .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA;
                      })
                      .slice(0, 5)
                      .map((u, idx) => (
                        <div key={u.userId || `recent-${idx}`} className="py-3.5 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={u.avatarUrl || u.photoURL || u.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"} 
                              alt="" 
                              className="h-10 w-10 rounded-xl object-cover border border-slate-800 shrink-0" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500";
                              }}
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate max-w-[200px]" title={u.name}>{u.name}</h4>
                              <p className="text-xs text-slate-400 truncate max-w-[200px]" title={u.email}>{u.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-750 ${
                              u.plan === 'premium' ? 'text-orange-400' : (u.plan === 'pro' ? 'text-amber-400' : 'text-slate-400')
                            }`}>
                              {u.plan || 'free'}
                            </span>
                            
                            <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                              u.accessType === 'trial'
                                ? 'bg-purple-950/40 text-purple-400 border-purple-900/30'
                                : u.accessType === 'manual'
                                  ? 'bg-blue-950/40 text-blue-400 border-blue-900/30'
                                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                            }`}>
                              {u.accessType === 'trial' ? 'trial' : u.accessType === 'manual' ? 'manual' : 'assinante'}
                            </span>
                            
                            <span className="text-xs text-slate-400 font-mono">
                              Cadastrado em: {formatDateBR(u.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <button 
                              onClick={() => { setSelectedUser(u); setActiveTab('users'); }}
                              className="text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-xl transition border border-slate-750 hover:border-slate-700 shadow-md w-full md:w-auto text-center"
                            >
                              Gerenciar
                            </button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && !selectedUser && (
            <div className="space-y-4">
              
              {/* Search and Filters Block */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Pesquise por nome, e-mail, whatsapp, insta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-slate-850 focus:border-orange-500/50 outline-none transition"
                  />
                </div>

                <div className="flex gap-2.5">
                  <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 px-3 py-2 rounded-2xl">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value as any)}
                      className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-slate-950">Todos Planos</option>
                      <option value="free" className="bg-slate-950">Free</option>
                      <option value="pro" className="bg-slate-950">Pro</option>
                      <option value="premium" className="bg-slate-950">Premium</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 px-3 py-2 rounded-2xl">
                    <Ban className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={blockedFilter}
                      onChange={(e) => setBlockedFilter(e.target.value as any)}
                      className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-slate-950">Todos Status</option>
                      <option value="active" className="bg-slate-950">Ativos</option>
                      <option value="blocked" className="bg-slate-950">Bloqueados</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Master List */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                {loading ? (
                  <div className="py-12 text-center text-slate-500">Buscando do Firestore...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">Nenhum usuário corresponde aos filtros definidos.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 uppercase tracking-wider text-[10px]">
                          <th className="p-4">Artista</th>
                          <th className="p-4">Contato</th>
                          <th className="p-4">Plano / Tipo</th>
                          <th className="p-4">Limite Músicas</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-200">
                        {filteredUsers.map((user, idx) => {
                          const isBlocked = user.isBlocked || false;
                          const songsCount = dbService.getArtistMusics(user.userId).length;
                          const limit = user.musicLimit !== undefined ? user.musicLimit : (user.plan === 'free' ? 3 : (user.plan === 'essencial' ? 10 : (user.plan === 'pro' ? 15 : 50)));
                          
                          return (
                            <tr key={user.userId || `user-row-${idx}`} className="hover:bg-slate-850/30 transition">
                              <td className="p-4">
                                <div className="flex items-center space-x-3.5">
                                  <img 
                                    src={user.avatarUrl || user.photoURL || user.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"} 
                                    alt="" 
                                    className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-850"
                                  />
                                  <div>
                                    <div className="font-semibold text-white flex items-center">
                                      {user.name}
                                      {user.role === 'admin' && (
                                        <span className="text-[9px] font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-1.5 py-0.2 rounded ml-1.5 uppercase font-bold">Admin</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-450 mt-0.5">ID: {user.userId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div>{user.email}</div>
                                <div className="text-[10px] text-slate-450 mt-0.5">{user.whatsapp || 'Sem Telefone'}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className={`font-mono uppercase font-semibold text-[10px] ${user.plan === 'premium' ? 'text-orange-400' : (user.plan === 'pro' ? 'text-amber-400' : 'text-slate-400')}`}>
                                    {user.plan}
                                  </span>
                                  <span className="text-[10px] text-slate-450 mt-0.5 capitalize">{user.accessType || 'free'}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-mono text-slate-300">
                                  {songsCount} / <span className="font-medium text-slate-500">{limit}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {isBlocked ? (
                                  <span className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-semibold">Bloqueado</span>
                                ) : (
                                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">Ativo</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => setSelectedUser(user)}
                                    className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition text-slate-200"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleToggleBlock(user)}
                                    className={`px-3 py-1.5 rounded-xl transition ${isBlocked ? 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/20 text-emerald-400' : 'bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-400'}`}
                                  >
                                    {isBlocked ? 'Desbloquear' : 'Bloquear'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2 EDIT STATE: INDIVIDUAL USER EDITING */}
          {activeTab === 'users' && selectedUser && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <img src={selectedUser.avatarUrl || selectedUser.photoURL || selectedUser.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"} alt="" className="h-12 w-12 rounded-full object-cover border border-slate-800" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Editando Perfil: {selectedUser.name}</h3>
                    <p className="text-slate-405 text-xs">{selectedUser.email}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
              </div>

              {/* INFORMAÇÕES DE INFRAESTRUTURA E ARMAZENAMENTO DO USUÁRIO */}
              {(() => {
                const userSongs = dbService.getArtistMusics(selectedUser.userId) || [];
                const userSpaceUsedBytes = userSongs.reduce((acc, song) => acc + Number(song.fileSize || 0), 0);
                const userPlanLimit = selectedUser.musicLimit !== undefined ? selectedUser.musicLimit : (selectedUser.plan === 'free' ? 3 : (selectedUser.plan === 'essencial' ? 10 : (selectedUser.plan === 'pro' ? 15 : 50)));
                const userPercentageSongsUsed = userPlanLimit > 0 ? (userSongs.length / userPlanLimit) * 100 : 0;

                // Encontrar maior música
                let userLargestSong: any = null;
                let maxUserSongSize = 0;
                userSongs.forEach(s => {
                  const size = Number(s.fileSize || 0);
                  if (size > maxUserSongSize) {
                    maxUserSongSize = size;
                    userLargestSong = s;
                  }
                });

                // Último upload
                let lastUploadDateStr = 'Nenhum';
                let maxTime = 0;
                userSongs.forEach(s => {
                  if (s.createdAt) {
                    const t = new Date(s.createdAt).getTime();
                    if (t > maxTime) {
                      maxTime = t;
                      lastUploadDateStr = new Date(s.createdAt).toLocaleString('pt-BR');
                    }
                  }
                });

                // Determinar tipo de acesso
                let accessType = 'Gratuito (Free)';
                if (selectedUser.accessType === 'manual') {
                  accessType = selectedUser.manualAccessEndsAt 
                    ? `Manual / Cortesia (Até ${formatDateBR(parseValToISO(selectedUser.manualAccessEndsAt))})` 
                    : 'Manual / Cortesia (Sem Vencimento ✨)';
                } else if (selectedUser.manualAccessEndsAt) {
                  accessType = 'Manual / Cortesia';
                } else if (selectedUser.mercadoPagoSubscriptionId || selectedUser.mercadoPagoPaymentId || selectedUser.accessType === 'mercadopago') {
                  accessType = 'Assinante Mercado Pago';
                } else if (selectedUser.plan !== 'free') {
                  accessType = 'Outro / Cortesia';
                }

                // Verificar excesso de músicas
                const hasExcessSongs = userSongs.length > userPlanLimit;
                
                // Verificar se plano expirou (se manualAccessEndsAt no passado)
                const isExpired = selectedUser.accessType === 'manual' && selectedUser.manualAccessEndsAt && new Date(parseValToISO(selectedUser.manualAccessEndsAt)).getTime() < Date.now();

                return (
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h4 className="text-xs font-bold tracking-wider text-orange-400 uppercase flex items-center">
                      <Database className="h-4 w-4 mr-1.5 text-orange-500" />
                      Métricas Operacionais e Armazenamento do Usuário (Read-Only)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-white">
                      
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Plano Atual</span>
                        <span className="font-bold text-orange-400 uppercase">{selectedUser.plan || 'free'}</span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Tipo de Acesso</span>
                        <span className="font-bold text-slate-300">{accessType}</span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Status da Conta</span>
                        <span className={`font-bold ${selectedUser.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                          {selectedUser.isBlocked ? 'BLOQUEADA' : 'LIBERADA'}
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Músicas em Catálogo</span>
                        <span className="font-mono font-bold text-white">
                          {userSongs.length} / {userPlanLimit} (limite do plano)
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Espaço Total Utilizado</span>
                        <span className="font-mono font-bold text-white">
                          {(userSpaceUsedBytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">% de Cota Consumida</span>
                        <span className={`font-mono font-bold ${userPercentageSongsUsed >= 100 ? 'text-red-400 font-extrabold' : userPercentageSongsUsed >= 80 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {userPercentageSongsUsed.toFixed(0)}% das músicas
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2 md:col-span-1">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Maior Música Enviada</span>
                        <span className="font-mono block truncate font-semibold" title={userLargestSong ? userLargestSong.title : 'Nenhuma'}>
                          {userLargestSong ? `${userLargestSong.title} (${(maxUserSongSize / (1024 * 1024)).toFixed(2)} MB)` : 'Nenhuma'}
                        </span>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">Último Upload Realizado</span>
                        <span className="font-mono font-bold text-slate-300">
                          {lastUploadDateStr}
                        </span>
                      </div>

                    </div>

                    {/* Alertas específicos de excesso e expiração */}
                    {(hasExcessSongs || isExpired) && (
                      <div className="p-3 bg-red-950/20 border border-red-900/20 text-red-400 text-xs rounded-xl space-y-1.5">
                        <p className="font-bold flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1.5 text-red-500" />
                          Análise de Violação de Cota / Excesso:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                          {isExpired && (
                            <li>
                              O acesso manual expirou em <span className="font-mono font-bold">{new Date(parseValToISO(selectedUser.manualAccessEndsAt)).toLocaleString('pt-BR')}</span>. O usuário foi revertido para o plano Free.
                            </li>
                          )}
                          {hasExcessSongs && (
                            <li>
                              <span className="font-extrabold">Excesso de músicas detectado:</span> O usuário possui {userSongs.length} músicas ativas, ultrapassando o limite permitido de {userPlanLimit} músicas de seu plano atual.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              <form onSubmit={handleSaveUserEdit} className="space-y-6">
                
                {/* 1. DADOS CADASTRAIS DO USUÁRIO */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center">
                    <User className="h-4 w-4 mr-1.5 text-orange-500" />
                    Dados Cadastrais do Usuário
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Artista</label>
                      <input
                        type="text"
                        value={selectedUser.name || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">E-mail do Usuário</label>
                      <input
                        type="text"
                        disabled
                        value={selectedUser.email || ''}
                        className="w-full bg-slate-900/50 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-sm text-slate-400 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={selectedUser.city || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, city: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Estado</label>
                      <input
                        type="text"
                        value={selectedUser.state || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, state: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                        placeholder="Ex: GO"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">WhatsApp de Contato</label>
                      <input
                        type="text"
                        value={selectedUser.whatsapp || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, whatsapp: e.target.value, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Instagram (@)</label>
                      <input
                        type="text"
                        value={selectedUser.instagram || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, instagram: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nível de Permissão (Role)</label>
                      <select
                        value={selectedUser.role || 'user'}
                        onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500"
                      >
                        <option value="user">User (Comum)</option>
                        <option value="admin">Admin (Administrador Geral)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. PLANO MANUAL / CORTESIA */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-orange-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold tracking-wider text-orange-400 uppercase flex items-center">
                      <Sparkles className="h-4 w-4 mr-1.5 text-orange-500" />
                      Plano Manual / Cortesia
                    </h4>
                    <span className="text-[10px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full">
                      Liberação Simples pelo Admin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Plano Escolhido</label>
                      <select
                        value={selectedUser.plan || 'free'}
                        onChange={(e) => {
                          const nextPlan = e.target.value as 'free' | 'essencial' | 'pro' | 'premium';
                          const standardLimit = nextPlan === 'free' ? 3 : (nextPlan === 'essencial' ? 10 : (nextPlan === 'pro' ? 15 : 50));
                          
                          setSelectedUser({
                            ...selectedUser,
                            plan: nextPlan,
                            musicLimit: standardLimit,
                            accessType: nextPlan === 'free' ? 'free' : 'manual',
                            paymentStatus: nextPlan === 'free' ? 'inactive' : 'manual'
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500 font-medium"
                      >
                        <option value="free">Free (Grátis - 3 músicas)</option>
                        <option value="essencial">Essencial (Básico - 10 músicas)</option>
                        <option value="pro">Pro (Intermediário - 15 músicas)</option>
                        <option value="premium">Premium (Completo - 50 músicas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Limite de Músicas no Catálogo</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedUser.musicLimit !== undefined ? selectedUser.musicLimit : (selectedUser.plan === 'free' ? 3 : (selectedUser.plan === 'essencial' ? 10 : (selectedUser.plan === 'pro' ? 15 : 50)))}
                        onChange={(e) => setSelectedUser({ ...selectedUser, musicLimit: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl text-sm outline-none text-slate-200 focus:border-orange-500 font-mono"
                        placeholder="Ex: 20"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Altere para qualquer número desejado (ex: 20 músicas).</span>
                    </div>
                  </div>

                  {/* Opções de Vencimento do Plano Manual */}
                  <div className="pt-2 space-y-3">
                    <label className="block text-xs font-medium text-slate-400">Vencimento do Acesso Manual</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUser({ ...selectedUser, manualAccessEndsAt: null, accessType: selectedUser.plan !== 'free' ? 'manual' : 'free' })}
                        className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 ${!selectedUser.manualAccessEndsAt ? 'bg-orange-500/10 border-orange-500/50 text-orange-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${!selectedUser.manualAccessEndsAt ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                          {!selectedUser.manualAccessEndsAt && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">Sem Vencimento ✨</div>
                          <div className="text-[10px] opacity-80 text-slate-400">Acesso permanente e cortesia sem expiração</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedUser.manualAccessEndsAt) {
                            const nextMonth = new Date();
                            nextMonth.setDate(nextMonth.getDate() + 30);
                            setSelectedUser({ ...selectedUser, manualAccessEndsAt: nextMonth.toISOString(), accessType: selectedUser.plan !== 'free' ? 'manual' : 'free' });
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 ${selectedUser.manualAccessEndsAt ? 'bg-orange-500/10 border-orange-500/50 text-orange-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedUser.manualAccessEndsAt ? 'border-orange-500 bg-orange-500' : 'border-slate-600'}`}>
                          {selectedUser.manualAccessEndsAt && <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">Com Data de Vencimento 📅</div>
                          <div className="text-[10px] opacity-80 text-slate-400">Acesso temporário com data e hora limite</div>
                        </div>
                      </button>
                    </div>

                    {selectedUser.manualAccessEndsAt && (
                      <div className="mt-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                        <label className="block text-xs font-medium text-slate-300">Data e Hora do Vencimento Manual</label>
                        <input
                          type="datetime-local"
                          value={selectedUser.manualAccessEndsAt ? parseValToISO(selectedUser.manualAccessEndsAt).substring(0, 16) : ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, manualAccessEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs outline-none text-slate-200 focus:border-orange-500 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. DADOS MERCADO PAGO - TÉCNICO / TIPO DE ACESSO AVANÇADO */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDocs(!showTechnicalDocs)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider"
                  >
                    <span className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-1.5 text-slate-500" />
                      Dados Mercado Pago (Histórico Técnico)
                    </span>
                    <span className="text-[11px] text-orange-500 underline font-normal">
                      {showTechnicalDocs ? 'Ocultar Detalhes Avançados' : 'Mostrar Detalhes Avançados'}
                    </span>
                  </button>

                  {showTechnicalDocs && (
                    <div className="space-y-4 pt-2 border-t border-slate-850">
                      <p className="text-[11px] text-slate-500">
                        Estes campos são preenchidos e gerenciados automaticamente pelas integrações com o Mercado Pago. Os dados não serão apagados ou perdidos ao conceder um plano manual.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Acesso (Access Type)</label>
                          <select
                            value={selectedUser.accessType || 'free'}
                            onChange={(e) => setSelectedUser({ ...selectedUser, accessType: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 focus:border-orange-500"
                          >
                            <option value="free">Free</option>
                            <option value="trial">Trial (Teste Grátis)</option>
                            <option value="manual">Manual (Liberado pelo Admin)</option>
                            <option value="mercadopago">MercadoPago (Cobrança Recorrente)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Status de Pagamento (Payment Status)</label>
                          <select
                            value={selectedUser.paymentStatus || 'inactive'}
                            onChange={(e) => setSelectedUser({ ...selectedUser, paymentStatus: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 focus:border-orange-500"
                          >
                            <option value="inactive">Inactive (Inativo)</option>
                            <option value="active">Active (Ativo)</option>
                            <option value="pending">Pending (Pendente)</option>
                            <option value="cancelled">Cancelled (Cancelado)</option>
                            <option value="manual">Manual (Aprovado Manual)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Payment ID MercadoPago</label>
                          <input
                            type="text"
                            value={selectedUser.mercadoPagoPaymentId || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, mercadoPagoPaymentId: e.target.value || null })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 font-mono"
                            placeholder="Ex: mp-pay-736294"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Subscription ID MercadoPago</label>
                          <input
                            type="text"
                            value={selectedUser.mercadoPagoSubscriptionId || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, mercadoPagoSubscriptionId: e.target.value || null })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 font-mono"
                            placeholder="Ex: pre_sub_927364"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Início da Assinatura</label>
                          <input
                            type="datetime-local"
                            value={selectedUser.subscriptionStartedAt ? parseValToISO(selectedUser.subscriptionStartedAt).substring(0, 16) : ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, subscriptionStartedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Término da Assinatura Mercado Pago</label>
                          <input
                            type="datetime-local"
                            value={selectedUser.subscriptionEndsAt ? parseValToISO(selectedUser.subscriptionEndsAt).substring(0, 16) : ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, subscriptionEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs outline-none text-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. BLOQUEIO E SEGURANÇA */}
                <div className="flex items-center space-x-3.5 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                  <input
                    type="checkbox"
                    id="edit-isblocked"
                    checked={selectedUser.isBlocked || false}
                    onChange={(e) => setSelectedUser({ ...selectedUser, isBlocked: e.target.checked })}
                    className="h-4 w-4 bg-slate-900 border-slate-800 text-orange-500 rounded"
                  />
                  <label htmlFor="edit-isblocked" className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer">
                    Bloquear conta do usuário de imediato (Impede login no aplicativo)
                  </label>
                </div>

                <div className="pt-4 flex space-x-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-medium rounded-2xl text-xs outline-none transition text-slate-300"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 font-bold text-slate-900 rounded-2xl text-xs outline-none transition hover:from-amber-500 hover:to-orange-400 shrink-0"
                  >
                    Salvar Mudanças
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* TAB 3: ACCESS RELEASES & TRIAL CREATOR */}
          {activeTab === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Manual Access form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Clock className="h-5 w-5 text-amber-500 mr-2" />
                    Liberar Acesso Manual
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Conceda acesso manual imediato por período determinado</p>
                </div>

                <form onSubmit={handleManualRelease} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">E-mail do Usuário Registrado</label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@gmail.com"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Plano Desejado</label>
                      <select
                        value={manualPlan}
                        onChange={(e) => {
                          const plan = e.target.value as any;
                          setManualPlan(plan);
                          setManualLimit(plan === 'pro' ? 15 : 50);
                        }}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-xs outline-none text-slate-300"
                      >
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Duração Acesso</label>
                      <select
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-xs outline-none text-slate-300"
                      >
                        <option value="unlimited">Sem vencimento</option>
                        <option value="7">7 dias</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                        <option value="90">3 meses (90 dias)</option>
                        <option value="180">6 meses (180 dias)</option>
                        <option value="365">1 ano (365 dias)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Limite Manual de Músicas (Customizável)</label>
                    <input
                      type="number"
                      required
                      value={manualLimit}
                      onChange={(e) => setManualLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Notas Administrativas (Interno)</label>
                    <textarea
                      placeholder="Ex: Liberado para teste do parceiro X de Goiânia..."
                      value={manualNotes}
                      rows={3}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-amber-500 text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-tr from-amber-600 to-orange-500 text-slate-900 font-bold rounded-2xl text-xs hover:opacity-95 transition"
                  >
                    Aprovar Acesso Manual
                  </button>
                </form>
              </div>

              {/* Free Trial Form */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Sparkles className="h-5 w-5 text-orange-500 mr-2" />
                    Criar Teste Grátis (Trial Recurrent)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Conclua o setup de testes temporários para novos produtores</p>
                </div>

                <form onSubmit={handleCreateTrial} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">E-mail do Novo Usuário</label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@gmail.com"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-orange-500 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Plano Fornecido</label>
                      <select
                        value={trialPlan}
                        onChange={(e) => {
                          const plan = e.target.value as any;
                          setTrialPlan(plan);
                          setTrialLimit(plan === 'pro' ? 15 : 50);
                        }}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-xs outline-none text-slate-300"
                      >
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Prazo de Resolução</label>
                      <select
                        value={trialDuration}
                        onChange={(e) => setTrialDuration(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-xs outline-none text-slate-300"
                      >
                        <option value="7">7 dias (Recomendado)</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Capacidade de Músicas do Teste</label>
                    <input
                      type="number"
                      required
                      value={trialLimit}
                      onChange={(e) => setTrialLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-orange-500 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="p-4 bg-orange-950/20 border border-orange-500/10 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-wide flex items-center mb-1">
                      <Info className="h-3 w-3 mr-1" /> Nota Importante
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Ao término do teste grátis criado, o sistema de segurança reverterá o usuário automaticamente para o plano Free, limitando seu catálogo a 3 faixas musicais.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-tr from-orange-600 to-amber-500 text-slate-900 font-bold rounded-2xl text-xs hover:opacity-95 transition"
                  >
                    Ativar Teste Grátis
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB: PAYMENT CONFIGURATIONS */}
          {activeTab === 'payments' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <CreditCard className="h-5 w-5 text-orange-500 mr-2" />
                  Configurações de Pagamento (Mercado Pago)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Configure os links de checkout do Mercado Pago para os planos Pro e Premium (Mensal e Anual).
                </p>
              </div>

              {/* Information / Instruction Alert Box */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-255 leading-relaxed">
                  <span className="font-bold block text-white mb-0.5">Integração Automática Ativa:</span>
                  O SomDrive agora conta com liberação instantânea e automática de assinaturas via webhooks do Mercado Pago! Configure seus links de pagamento abaixo e o sistema atualizará os planos de forma 100% automatizada. Use a aba <strong>Assinaturas Mercado Pago</strong> na barra lateral para acompanhar o histórico e efetuar ações manuais se necessário.
                </div>
              </div>

              {loadingPayments ? (
                <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
                  <span>Carregando links de pagamento...</span>
                </div>
              ) : (
                <form onSubmit={handleSavePaymentSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* SECTION 1: ESSENCIAL MONTHLY */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-400 uppercase">1. SomDrive Essencial Mensal</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 9,99/mês</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 10 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="essencial-monthly-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="essencial-monthly-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.essencialMonthlyUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, essencialMonthlyUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION 2: ESSENCIAL ANNUAL */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-400 uppercase">2. SomDrive Essencial Anual</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 99,90/ano</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 10 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="essencial-annual-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="essencial-annual-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.essencialAnnualUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, essencialAnnualUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>
                     
                    {/* SECTION 3: PRO MONTHLY */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">3. SomDrive Pro Mensal</span>
                        <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">R$ 14,99/mês</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 15 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="pro-monthly-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="pro-monthly-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.proMonthlyUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, proMonthlyUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION 4: PRO ANNUAL */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">4. SomDrive Pro Anual</span>
                        <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">R$ 149,90/ano</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 15 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="pro-annual-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="pro-annual-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.proAnnualUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, proAnnualUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION 5: PREMIUM MONTHLY */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">5. SomDrive Premium Mensal</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 29,99/mês</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 50 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="premium-monthly-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="premium-monthly-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.premiumMonthlyUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, premiumMonthlyUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION 6: PREMIUM ANNUAL */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">6. SomDrive Premium Anual</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 299,90/ano</span>
                      </div>
                      <div className="text-slate-400 text-[11px] space-y-1">
                        <p><strong>Limite:</strong> 50 músicas</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-semibold" htmlFor="premium-annual-url">Link de Pagamento (Mercado Pago)</label>
                        <input
                          id="premium-annual-url"
                          type="url"
                          placeholder="https://link.mercadopago.com.br/..."
                          value={paymentSettings.premiumAnnualUrl}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, premiumAnnualUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs focus:border-orange-500 outline-none text-white transition font-mono"
                        />
                      </div>
                    </div>

                  </div>

                  {paymentSettings.updatedAt && (
                    <div className="text-[10px] font-mono text-slate-500 text-right">
                      Última atualização: {new Date(paymentSettings.updatedAt).toLocaleString('pt-BR')} por {paymentSettings.updatedBy}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 rounded-xl font-extrabold text-sm transition uppercase tracking-wider flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Salvar Configurações</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS SCREEN */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <Settings className="h-5 w-5 text-orange-500 mr-2" />
                  Tela de Configurações do Sistema (Status Geral)
                </h3>
                <p className="text-slate-400 text-xs mt-1">Status das conexões internas de infraestrutura, armazenamento e APIs</p>
              </div>

              <div className="divide-y divide-slate-800">
                
                {/* Check 1: Firestore */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Banco de Dados Firestore</h4>
                      <p className="text-[11px] text-slate-450">Coleções mapeadas: <span className="font-mono text-orange-500">artists</span> e <span className="font-mono text-orange-500">users</span></p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <span className="font-mono text-[10px] px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/20 rounded-full">CONECTADO</span>
                  </div>
                </div>

                {/* Check 2: Storage */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Firebase Storage (Mídias)</h4>
                      <p className="text-[11px] text-slate-450 border-orange-500/20 rounded">Canal ativo para arquivos MP3 e Capas JPG/PNG</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <span className="font-mono text-[10px] px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/20 rounded-full">ATIVO E INTEGRADO</span>
                  </div>
                </div>

                {/* Check 3: Auth */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Firebase Authentication</h4>
                      <p className="text-[11px] text-slate-450 font-mono">Regras de segurança ativas no arquivo firestore.rules</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <span className="font-mono text-[10px] px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/20 rounded-full">ATIVO COM REGRAS</span>
                  </div>
                </div>

                {/* Check 4: Mercado Pago */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      integrationStatus?.mercadoPagoAccessToken && integrationStatus?.mercadoPagoPublicKey
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 border border-amber-500/20 text-yellow-400"
                    }`}>
                      {integrationStatus?.mercadoPagoAccessToken && integrationStatus?.mercadoPagoPublicKey ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold text-white">Integração Mercado Pago</h4>
                      <div className="flex flex-col space-y-1 text-[11px] text-slate-440">
                        <span className="flex items-center space-x-1.5">
                          <span>• Mercado Pago:</span>
                          {integrationStatus?.mercadoPagoAccessToken ? (
                            <span className="text-emerald-400 font-semibold font-mono">Configurado</span>
                          ) : (
                            <span className="text-rose-450 font-semibold font-mono">Aguardando MERCADOPAGO_ACCESS_TOKEN</span>
                          )}
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <span>• Webhook:</span>
                          {integrationStatus?.mercadoPagoWebhookSecret ? (
                            <span className="text-emerald-400 font-semibold font-mono">Configurado</span>
                          ) : (
                            <span className="text-rose-450 font-semibold font-mono">Aguardando MERCADOPAGO_WEBHOOK_SECRET</span>
                          )}
                        </span>
                        <span className="flex items-center space-x-1.5">
                          <span>• APP_BASE_URL:</span>
                          {integrationStatus?.appBaseUrl ? (
                            <span className="text-emerald-400 font-semibold font-mono">Configurado</span>
                          ) : (
                            <span className="text-rose-450 font-semibold font-mono">Aguardando APP_BASE_URL</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-2 shrink-0">
                    {integrationStatus?.mercadoPagoAccessToken && integrationStatus?.mercadoPagoPublicKey && integrationStatus?.mercadoPagoWebhookSecret && integrationStatus?.appBaseUrl ? (
                      <span className="font-mono text-[10px] px-2.5 py-1 bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/20 rounded-full">CONFIGURADO</span>
                    ) : (
                      <span className="font-mono text-[10px] px-2.5 py-1 bg-yellow-950 text-yellow-400 font-bold border border-yellow-500/20 rounded-full">AGUARDANDO CREDENCIAIS</span>
                    )}
                  </div>
                </div>

              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 mt-6 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Re-sincronizar banco de dados</h4>
                  <p className="text-[11px] text-slate-400">Clique para forçar uma recarga rápida e sincronização instantânea dos usuários do Firestore.</p>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition flex items-center text-xs shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-orange-500 mr-2" /> Forçar Recarga
                </button>
              </div>

              {/* SEÇÃO: CONFIGURAÇÃO GLOBAL DE COMPARTILHAMENTO (ADMIN) */}
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Sparkles className="h-4 w-4 text-orange-550 mr-2 animate-pulse" />
                    Imagem de Compartilhamento do Site (Global)
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Esta imagem será usada em todo o site como miniatura de rede social no WhatsApp, Facebook e Instagram ao compartilhar catálogos ou links do SomDrive.
                  </p>
                </div>

                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850 space-y-4">
                  {shareCardSettings?.ogImageUrl ? (
                    <div className="space-y-4 animate-fade-in font-sans">
                      <p className="text-[11px] font-mono text-slate-455">Prévia da imagem ativa (Proporção 1200x630px):</p>
                      <div className="max-w-md aspect-[1.91/1] overflow-hidden rounded-xl border border-slate-800 shadow-lg relative bg-slate-900 group">
                        <img 
                          src={shareCardSettings.ogImageUrl.includes('?') ? `${shareCardSettings.ogImageUrl}&v=${shareCardSettings.ogImageVersion || Date.now()}` : `${shareCardSettings.ogImageUrl}?v=${shareCardSettings.ogImageVersion || Date.now()}`} 
                          alt="Layout do Cartão Executivo com Disco de Vinil" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-[10px] bg-slate-900/90 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono">Dimensões ideais: 1200x630</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => shareCardFileInputRef.current?.click()}
                          disabled={isUploadingShareCard}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition text-xs flex items-center cursor-pointer"
                        >
                          {isUploadingShareCard ? "Enviando..." : "Trocar imagem"}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveShareCard}
                          className="px-3.5 py-2 bg-red-950/40 border border-red-900/30 hover:border-red-500 text-red-400 rounded-xl font-bold transition text-xs flex items-center cursor-pointer"
                        >
                          Remover imagem
                        </button>
                        <a
                          href="/api/global-share-card.png"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-orange-400 rounded-xl font-bold transition text-xs flex items-center cursor-pointer"
                        >
                          Ver imagem em nova aba ↗
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/30 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-3.5 animate-fade-in font-sans">
                      <div className="p-3 bg-orange-500/5 text-orange-400 rounded-2xl border border-orange-500/10">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Nenhuma imagem global configurada</p>
                        <p className="text-[11px] text-slate-450 max-w-sm mx-auto">Upload de um arquivo recomendado em formato horizontal (1200x630px, PNG, JPG ou WEBP) para aparecer bonita no WhatsApp.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => shareCardFileInputRef.current?.click()}
                        disabled={isUploadingShareCard}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-slate-950 font-bold transition rounded-xl text-xs flex items-center uppercase tracking-wider cursor-pointer font-heading"
                      >
                        Enviar imagem
                      </button>
                    </div>
                  )}

                  {/* Campo input oculto de seleção */}
                  <input 
                    type="file"
                    ref={shareCardFileInputRef}
                    onChange={handleShareCardUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Feedback de Uploading Progresso */}
                  {isUploadingShareCard && (
                    <div className="space-y-1.5 animate-fade-in p-1 font-mono">
                      <div className="flex justify-between text-[10px] font-bold text-orange-450">
                        <span>Enviando imagem para Cloudflare R2...</span>
                        <span>{shareCardUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-300" style={{ width: `${shareCardUploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {shareCardError && (
                    <div className="p-3 bg-red-950/30 border border-red-900/30 font-mono text-[10px] text-red-400 rounded-xl">
                      {shareCardError}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 leading-relaxed italic font-sans">
                    **Aviso:** Use uma imagem horizontal 1200x630 px para aparecer bonita no WhatsApp.
                  </p>
                </div>
              </div>

              {/* SEÇÃO: CONFIGURAÇÃO DE IDENTIDADE VISUAL - LOGO SIZING */}
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center col-span-full">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2 animate-pulse" />
                    Identidade Visual (Exibir / Trocar Logomarca)
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    Gerencie a visibilidade do logotipo (opção de tirar/ocultar) ou substitua (trocar) a imagem do SomDrive por seu próprio arquivo de logomarca personalizado.
                  </p>
                </div>

                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-5">
                    {/* Switch: Show / Hide Logo */}
                    <div className="bg-slate-905/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs text-slate-300 font-bold block">Exibir Logomarca no Cabeçalho</label>
                          <span className="text-[10px] text-slate-500 block">Ative para mostrar ou desative para tirar completamente a logo do topo de todo o site.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocalShowLogo(!localShowLogo)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${localShowLogo ? 'bg-orange-500' : 'bg-slate-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localShowLogo ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="text-[11px] font-sans">
                        {localShowLogo ? (
                          <span className="text-emerald-450 font-semibold flex items-center">● Logotipo ATIVADO e visível</span>
                        ) : (
                          <span className="text-red-450 font-semibold flex items-center">○ Logotipo INATIVO (ocultado do site)</span>
                        )}
                      </div>
                    </div>

                    {localShowLogo && (
                      <>
                        {/* URL and File upload input to Swap / Change Logo */}
                        <div className="space-y-3">
                          <label className="text-xs text-slate-300 font-semibold flex justify-between items-center block">
                            <span>Imagem do Logotipo Customizado</span>
                            {localCustomLogoUrl ? (
                              <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                                Usando logo customizada
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Usando padrão do sistema</span>
                            )}
                          </label>

                          {/* PC File Upload Section */}
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-900 hover:border-orange-500/50 transition-all duration-200">
                            <input
                              type="file"
                              ref={logoFileInputRef}
                              onChange={handleLogoFileChange}
                              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml"
                              className="hidden"
                              id="logo_file_picker"
                            />
                            
                            {localCustomLogoUrl ? (
                              <div className="flex flex-col items-center gap-2.5 w-full">
                                <div className="p-2 bg-slate-950/65 rounded-lg border border-slate-800 flex items-center justify-center max-w-[220px] h-16 overflow-hidden">
                                  <img 
                                    src={localCustomLogoUrl} 
                                    alt="Pré-visualização do seu Logo" 
                                    className="max-w-full max-h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="text-center">
                                  <span className="text-[10.5px] text-emerald-400 font-semibold block">✓ Logotipo carregado e pronto para salvar</span>
                                  {localCustomLogoUrl.startsWith('data:') ? (
                                    <span className="text-[9px] text-slate-500 block">Salvo diretamente como imagem incorporada no banco de dados</span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 block">Endereço de imagem externa ativo</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center py-2">
                                <Plus className="h-6 w-6 text-slate-500 mb-1" />
                                <span className="text-xs text-slate-300 font-medium">Nenhum logotipo enviado do computador</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                              <button
                                type="button"
                                onClick={() => logoFileInputRef.current?.click()}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer select-none"
                              >
                                {localCustomLogoUrl ? "Substituir arquivo (Trocar)" : "Selecionar arquivo do PC"}
                              </button>
                              
                              {localCustomLogoUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalCustomLogoUrl('');
                                    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
                                  }}
                                  className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-lg text-[11px] font-semibold transition cursor-pointer select-none"
                                >
                                  Remover e usar padrão
                                </button>
                              )}
                            </div>
                            
                            <p className="text-[9.5px] text-slate-500 max-w-xs leading-normal">
                              Formatos aceitos: PNG transparente (recomendado), JPG, SVG ou WEBP. Limite de tamanho: 600 KB.
                            </p>
                          </div>

                          {/* Fallback Manual Link input field */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Ou insira uma URL de imagem externa:</span>
                            <input
                              type="text"
                              value={localCustomLogoUrl}
                              onChange={(e) => setLocalCustomLogoUrl(e.target.value)}
                              placeholder="https://sua-hospedagem.com/logo-transparente.png"
                              className="w-full text-xs bg-slate-900 border border-slate-800 text-white placeholder-slate-600 px-3.5 py-2 rounded-xl focus:outline-none focus:border-orange-500"
                            />
                          </div>

                          {logoUploadError && (
                            <p className="text-[11px] text-red-400 font-semibold bg-red-950/20 p-2.5 rounded-lg border border-red-900/40">
                              ⚠️ {logoUploadError}
                            </p>
                          )}
                        </div>

                        {/* Logo scale Slider config */}
                        <div className="space-y-1">
                          <label className="text-xs text-slate-300 font-semibold flex justify-between">
                            <span>Ajuste fino da Escala (Tamanho)</span>
                            <span className="font-mono text-xs text-yellow-500 font-bold">{Math.round(localLogoScale * 100)}%</span>
                          </label>
                          <p className="text-[11px] text-slate-500">Arraste para adequar os limites horizontais e preencher harmoniosamente o menu.</p>
                        </div>

                        <div className="flex items-center space-x-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/30">
                          <button
                            type="button"
                            onClick={() => setLocalLogoScale(Math.max(0.5, parseFloat((localLogoScale - 0.05).toFixed(2))))}
                            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-colors select-none cursor-pointer"
                            title="Diminuir"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="0.5"
                            max="4.5"
                            step="0.05"
                            value={localLogoScale}
                            onChange={(e) => setLocalLogoScale(parseFloat(e.target.value))}
                            className="flex-grow accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => setLocalLogoScale(Math.min(4.5, parseFloat((localLogoScale + 0.05).toFixed(2))))}
                            className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-colors select-none cursor-pointer"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveLogoScale}
                        disabled={isSavingLogoScale}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-bold transition rounded-xl text-xs flex items-center uppercase tracking-wider cursor-pointer font-heading shadow-md shadow-orange-950/20"
                      >
                        {isSavingLogoScale ? 'Salvando...' : 'Salvar Identidade'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalLogoScale(1.0);
                          setLocalShowLogo(true);
                          setLocalCustomLogoUrl('');
                        }}
                        className="px-3.5 py-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-300 rounded-xl transition text-xs select-none cursor-pointer"
                      >
                        Restaurar Padrão
                      </button>
                    </div>

                    {logoSuccessMsg && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 font-sans text-xs text-emerald-400 rounded-xl animate-fade-in">
                        {logoSuccessMsg}
                      </div>
                    )}
                  </div>

                  {/* Right Side: mock header template */}
                  <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-850 space-y-3 w-full lg:sticky lg:top-4">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Visualização Simulada do Cabeçalho</p>
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between h-24 overflow-hidden relative">
                      <div className="overflow-visible pr-6 min-w-[80px]">
                        <BrandLogo size="sm" scale={localLogoScale} showLogo={localShowLogo} customLogoUrl={localCustomLogoUrl} className="origin-left" />
                        {!localShowLogo && (
                          <span className="text-[11px] text-slate-650 italic leading-none font-sans">Sem logo (espaço livre)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 pr-1 select-none pointer-events-none shrink-0">
                        <span className="text-[8px] sm:text-[9px] font-mono bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">Início</span>
                        <span className="text-[8px] sm:text-[9px] font-mono bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-800 font-bold text-orange-450/80">Painel</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ANNOUNCEMENTS & AUDITIONS MANAGER */}
          {activeTab === 'announcements' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl animate-fade-in text-white">
              <AnnouncementsManager currentUserId={currentUser.userId} />
            </div>
          )}

          {/* TAB: INFRASTRUCTURE & STORAGE OPERATION PANEL */}
          {activeTab === 'infra' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in text-white font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Database className="h-5 w-5 text-orange-500 mr-2" />
                    Infraestrutura e Armazenamento
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Painel operacional de leitura de armazenamento físico, distribuição de cota e alertas de infraestrutura.
                  </p>
                </div>
                <button
                  onClick={loadInfraMetrics}
                  disabled={loadingInfra}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition flex items-center text-xs shrink-0 self-start sm:self-center"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-orange-500 mr-2 ${loadingInfra ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </button>
              </div>

              {loadingInfra ? (
                <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
                  <span>Carregando métricas de armazenamento e arquivos físicos do R2...</span>
                </div>
              ) : infraError ? (
                <div className="p-5 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-400 text-xs space-y-2">
                  <p className="font-bold">⚠️ Falha ao carregar métricas:</p>
                  <p className="font-mono">{infraError}</p>
                </div>
              ) : infraMetrics ? (
                <div className="space-y-6">
                  {/* Bento Grid Principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Músicas em Catálogo</span>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-white">{infraMetrics.totalSongs}</span>
                        <span className="text-[10px] text-slate-500 block">músicas registradas</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Arquivos Físicos R2</span>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-white">{infraMetrics.totalAudioFiles}</span>
                        <span className="text-[10px] text-slate-500 block">arquivos no storage R2</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Espaço Estimado Usado</span>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-white">{(infraMetrics.totalSpaceUsedBytes / (1024 * 1024)).toFixed(2)} MB</span>
                        <span className="text-[10px] text-slate-500 block">armazenamento físico total</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cota Grátis R2 (10GB)</span>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-white">{infraMetrics.r2FreeLimitPercent.toFixed(4)}%</span>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full" style={{ width: `${infraMetrics.r2FreeLimitPercent}%` }}></div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Segunda seção de estatísticas gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-slate-950/30 p-5 border border-slate-850 rounded-2xl space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Média por Música</span>
                      <p className="text-lg font-bold text-white">{(infraMetrics.averageSongSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                      <p className="text-[10px] text-slate-500">tamanho médio de arquivo de áudio</p>
                    </div>

                    <div className="bg-slate-950/30 p-5 border border-slate-850 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Maior Arquivo</span>
                      {infraMetrics.largestSong ? (
                        <>
                          <p className="text-sm font-bold text-white truncate" title={infraMetrics.largestSong.title}>
                            {infraMetrics.largestSong.title}
                          </p>
                          <p className="text-xs text-orange-400 font-semibold">
                            {(infraMetrics.largestSong.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            Artista: {infraMetrics.largestSong.ownerName}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Nenhum arquivo de música encontrado.</p>
                      )}
                    </div>

                    <div className="bg-slate-950/30 p-5 border border-slate-850 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">Maior Consumidor de Espaço</span>
                      {infraMetrics.topUserBySpace ? (
                        <>
                          <p className="text-sm font-bold text-white truncate" title={infraMetrics.topUserBySpace.userName}>
                            {infraMetrics.topUserBySpace.userName}
                          </p>
                          <p className="text-xs text-orange-400 font-semibold">
                            {(infraMetrics.topUserBySpace.totalSizeBytes / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Possui {infraMetrics.topUserBySpace.songsCount} músicas enviadas
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Nenhum usuário com espaço medido.</p>
                      )}
                    </div>

                  </div>

                  {/* Uso de espaço por plano */}
                  <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Espaço de Armazenamento por Plano</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(infraMetrics.planStats).map(([plan, stats]: [string, any]) => {
                        const planLabels: Record<string, string> = {
                          free: 'Free (Grátis)',
                          essencial: 'Essencial (Básico)',
                          pro: 'Pro (Intermediário)',
                          premium: 'Premium (Completo)'
                        };
                        return (
                          <div key={plan} className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-orange-400 uppercase">{planLabels[plan] || plan}</span>
                            <div className="space-y-0.5">
                              <p className="text-sm font-extrabold text-white">{stats.songsCount} músicas</p>
                              <p className="text-xs text-slate-400">{(stats.spaceUsedBytes / (1024 * 1024)).toFixed(2)} MB usados</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Usuários Próximos do Limite */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Usuários Próximos de Limite</span>
                        <span className="text-[9px] text-slate-500 lowercase">(&gt;= 80% do limite do plano)</span>
                      </h4>
                      
                      {infraMetrics.usersNearLimit.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">Nenhum usuário próximo ou acima do limite do plano atual.</p>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {infraMetrics.usersNearLimit.map(user => (
                            <div key={user.userId} className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-white truncate max-w-[180px]">{user.name}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-semibold">{user.plan} (limite: {user.limit})</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-white">{user.songsCount} / {user.limit} músicas</p>
                                <p className={`text-[10px] font-bold ${user.percentage >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
                                  {user.percentage.toFixed(0)}% de uso
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Alerta de Possíveis Inconsistências de Mídia */}
                    <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
                          Possíveis Inconsistências de Mídia no R2
                        </h4>
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                          {infraMetrics.orphanFiles.length} detectadas
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Arquivos físicos presentes na coleção <code>audioFiles</code> que não estão vinculados a nenhuma música ativa cadastrada na coleção <code>songs</code>.
                        </p>
                        <p className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 font-semibold">
                          ⚠️ Não apagar automaticamente. Verificação manual obrigatória.
                        </p>
                      </div>

                      {infraMetrics.orphanFiles.length === 0 ? (
                        <div className="p-4 bg-emerald-950/15 border border-emerald-900/20 text-emerald-400 text-xs text-center rounded-xl">
                          Excelente! Não há nenhuma inconsistência de mídia identificada no seu armazenamento.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {infraMetrics.orphanFiles.map(file => (
                            <div key={file.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                              <div className="truncate max-w-[240px]">
                                <p className="font-semibold text-white truncate" title={file.fileName}>{file.fileName}</p>
                                <p className="text-[9px] font-mono text-slate-500 truncate select-all">Hash / ID: {file.id}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-amber-400">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                {file.createdAt && (
                                  <p className="text-[9px] text-slate-500">
                                    Enviado em: {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB: MERCADO PAGO SUBSCRIPTIONS VIEW */}
          {activeTab === 'mercadopago' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <ShieldCheck className="h-5 w-5 text-orange-500 mr-2" />
                    Assinaturas Mercado Pago
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Lista de transações e assinaturas automatizadas processadas via Webhook do Mercado Pago.
                  </p>
                </div>
                <button
                  onClick={loadSubscriptions}
                  disabled={loadingSubscriptions}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold transition flex items-center text-xs shrink-0 self-start sm:self-center"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-orange-500 mr-2 ${loadingSubscriptions ? 'animate-spin' : ''}`} />
                  Recarregar
                </button>
              </div>

              {/* PANELS LIST SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                {/* 1. SEARCH SECTION */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Pesquisar pagamentos já registrados
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Filtrar transações e histórico que já foram processadas ou salvas localmente no banco de dados.
                  </p>
                  <div className="flex items-center bg-slate-950 px-4 py-3 rounded-xl border border-slate-850 mt-1">
                    <Search className="h-4 w-4 text-slate-500 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar por e-mail, plano ou status..."
                      value={subscriptionSearch}
                      onChange={(e) => setSubscriptionSearch(e.target.value)}
                      className="w-full bg-transparent border-none text-slate-200 text-xs focus:ring-0 outline-none placeholder:text-slate-500"
                    />
                    {subscriptionSearch && (
                      <button onClick={() => setSubscriptionSearch('')} className="text-xs text-slate-500 hover:text-white px-1">
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. MANUAL VERIFICATION SECTION */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Verificar pagamento manualmente
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Insira o ID real de pagamento do Mercado Pago para forçar uma conciliação administrativa e liberação de planos.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="ID do pagamento Mercado Pago"
                      value={manualPaymentId}
                      onChange={(e) => setManualPaymentId(e.target.value)}
                      className="flex-1 bg-slate-950 px-4 py-3 rounded-xl border border-slate-850 text-slate-200 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <button
                      onClick={() => askConfirmation(
                        "Confirmar Consulta de Pagamento",
                        `Deseja realmente iniciar a verificação manual do pagamento ID "${manualPaymentId}" diretamente no Mercado Pago?`,
                        () => handleManualVerifyPayment()
                      )}
                      disabled={manualVerifying}
                      className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-slate-955 hover:text-slate-950 font-bold rounded-xl transition text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {manualVerifying ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <span>VERIFICAR AGORA</span>
                      )}
                    </button>
                  </div>

                  {/* Manual verification result display */}
                  {manualVerifyResult && (
                    <div className={`p-4 rounded-xl text-xs font-sans border animate-fade-in ${
                      manualVerifyResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : manualVerifyResult.status === 'user_found'
                          ? 'bg-amber-500/10 border-amber-500/20 text-text-amber-300'
                          : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`} style={{ color: manualVerifyResult.status === 'user_found' ? '#fcd34d' : undefined }}>
                      <div className="font-bold flex items-center justify-between mb-1.5">
                        <span className="uppercase tracking-wider">
                          Resultado da Verificação: {manualVerifyResult.success ? 'SUCESSO' : manualVerifyResult.status === 'user_found' ? 'USUÁRIO LOCALIZADO' : 'ERRO / ALERTA'}
                        </span>
                        <button 
                          onClick={() => setManualVerifyResult(null)} 
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer select-none ml-2"
                        >
                          Limpar resultado
                        </button>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{manualVerifyResult.message}</p>
                      
                      {manualVerifyResult.status === 'user_found' && (
                        <div className="mt-3.5 p-3 bg-slate-950/85 rounded-xl border border-slate-800 space-y-3">
                          <p className="text-[11px] font-semibold text-slate-200">Selecione o plano para ativação direta:</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              value={selectedForcePlan}
                              onChange={(e: any) => setSelectedForcePlan(e.target.value)}
                              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg outline-none flex-1 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="essencial_mensal">SomDrive ESSENCIAL - Mensal (R$ 9,99)</option>
                              <option value="essencial_anual">SomDrive ESSENCIAL - Anual (R$ 99,90)</option>
                              <option value="pro_mensal">SomDrive PRO - Mensal (R$ 14,99)</option>
                              <option value="pro_anual">SomDrive PRO - Anual (R$ 149,90)</option>
                              <option value="premium_mensal">SomDrive PREMIUM - Mensal (R$ 29,99)</option>
                              <option value="premium_anual">SomDrive PREMIUM - Anual (R$ 299,90)</option>
                            </select>
                            <button
                              onClick={() => askConfirmation(
                                "Confirmar Ativação Forçada",
                                `Deseja realmente ativar diretamente o plano "${selectedForcePlan.toUpperCase().replace('_', ' ')}" para este usuário? Isso criará um registro de faturamento ativo no sistema.`,
                                () => handleManualVerifyPayment(selectedForcePlan)
                              )}
                              disabled={manualVerifying}
                              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold rounded-lg transition text-xs shrink-0 cursor-pointer select-none"
                            >
                              {manualVerifying ? 'ATIVANDO...' : 'FORÇAR ATIVAÇÃO'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-850/40 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-400">ID Fornecido:</span> {manualVerifyResult.paymentId}
                        </div>
                        <div>
                          <span className="text-slate-400">Status API:</span> <span className={`uppercase font-bold ${manualVerifyResult.success ? 'text-emerald-400' : manualVerifyResult.status === 'user_found' ? 'text-amber-400' : 'text-amber-500'}`}>{manualVerifyResult.status}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Plano Ativado no Firestore:</span> {manualVerifyResult.planActivated ? <span className="text-emerald-400 font-bold">SIM ✅</span> : <span className="text-slate-500 font-bold">NÃO ❌</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>



              {loadingSubscriptions ? (
                <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
                  <span>Carregando dados das assinaturas...</span>
                </div>
              ) : (() => {
                const filteredSubs = mpSubscriptions.filter(sub => {
                  const mSearch = subscriptionSearch.toLowerCase().trim();
                  if (!mSearch) return true;
                  return (sub.email || '').toLowerCase().includes(mSearch) ||
                         (sub.plan || '').toLowerCase().includes(mSearch) ||
                         (sub.status || '').toLowerCase().includes(mSearch);
                });

                const realSubs = filteredSubs.filter(sub => {
                  const assocUser = findAssociatedUser(sub);
                  const origin = getSubscriptionOrigin(sub, assocUser);
                  return origin.label === 'Mercado Pago' || origin.label === 'Manual';
                });

                const techSubs = filteredSubs.filter(sub => {
                  const assocUser = findAssociatedUser(sub);
                  const origin = getSubscriptionOrigin(sub, assocUser);
                  return origin.label !== 'Mercado Pago' && origin.label !== 'Manual';
                });

                const expBadge = (exp: any) => {
                  if (exp.daysLeft === null) {
                    return <span className="text-slate-500 italic text-[11px]">Sem vencimento</span>;
                  }
                  if (exp.daysLeft < 0) {
                    return (
                      <div className="flex flex-col">
                        <span className="text-rose-400 font-semibold text-xs">{exp.text.split(' ')[0]}</span>
                        <span className="text-[9px] text-rose-500 font-medium">Expirado</span>
                      </div>
                    );
                  }
                  if (exp.daysLeft <= 5) {
                    return (
                      <div className="flex flex-col">
                        <span className="text-amber-400 font-semibold text-xs">{exp.text.split(' ')[0]}</span>
                        <span className="text-[9px] text-amber-500 font-bold">Expira em {exp.daysLeft}d</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col">
                      <span className="text-emerald-400 font-semibold text-xs">{exp.text.split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-400">{exp.daysLeft} dias</span>
                    </div>
                  );
                };

                const renderSubscriptionList = (subs: any[]) => {
                  if (subs.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        Nenhum registro encontrado para esta categoria.
                      </div>
                    );
                  }
                  return (
                    <>
                      {/* MOBILE LIST: Visible only on small screens */}
                      <div className="block md:hidden space-y-4 p-4">
                        {subs.map((sub) => {
                          const assocUser = findAssociatedUser(sub);
                          const origin = getSubscriptionOrigin(sub, assocUser);
                          const exp = getExpirationDetails(sub, assocUser);
                          const isNowActive = sub.status === 'authorized' || sub.status === 'approved' || sub.status === 'active';
                          const planLabel = sub.plan === 'premium' ? 'Premium' : (sub.plan === 'pro' ? 'Pro' : (sub.plan === 'essencial' ? 'Essencial' : 'Grátis'));
                          const cycleLabel = sub.billingCycle === 'annual' || sub.billingCycle === 'yearly' ? 'Anual' : 'Mensal';
                          const paidDate = sub.paidAt ? new Date(sub.paidAt).toLocaleDateString('pt-BR') : '-';

                          return (
                            <div key={sub.id} className="bg-slate-900/40 border border-slate-850/70 rounded-2xl p-4 space-y-3 shadow-md text-left">
                              <div className="flex items-start justify-between gap-2 border-b border-slate-850 pb-2">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-100 truncate">{sub.email}</span>
                                  <span className="text-[9px] text-slate-500 font-mono select-all truncate">UID: {sub.userId || 'Não Associado'}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border tracking-wide uppercase shrink-0 ${origin.color}`}>
                                  {origin.label}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Plano</span>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[9px] uppercase mt-0.5 ${sub.plan === 'premium' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                                    {planLabel} ({cycleLabel})
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Status MP</span>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[9px] uppercase mt-0.5 ${sub.status === 'refunded' ? 'bg-amber-600/15 text-amber-500' : isNowActive ? 'bg-emerald-500/10 text-emerald-450' : 'bg-red-500/10 text-red-400'}`}>
                                    {sub.status === 'refunded' ? 'REEMBOLSADO' : sub.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Data Pagamento</span>
                                  <span className="text-slate-300 font-medium block mt-0.5">{paidDate}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block">Vencimento</span>
                                  <span className="block mt-0.5 text-slate-300">{exp.text}</span>
                                </div>
                              </div>

                              <div className="text-[9px] text-slate-500 font-mono bg-slate-950/40 p-2 rounded-xl space-y-0.5 select-all">
                                {sub.subscriptionId && <p>Sub ID: {sub.subscriptionId}</p>}
                                {sub.paymentId && <p>Pay ID: {sub.paymentId}</p>}
                                {!sub.subscriptionId && !sub.paymentId && <p>Tx ID: {sub.id}</p>}
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-slate-850/60 justify-end">
                                <button
                                  onClick={() => askConfirmation(
                                    "Confirmar Verificação de Assinatura",
                                    `Deseja realmente sincronizar os dados da assinatura "${sub.id}" diretamente com a API do Mercado Pago para atualizar o faturamento no sistema?`,
                                    () => handleVerifySubscription(sub.id)
                                  )}
                                  disabled={verifyingId !== null}
                                  className="px-2.5 py-1.5 bg-orange-600/10 hover:bg-orange-600 border border-orange-500/15 hover:border-orange-500 text-orange-400 hover:text-slate-950 font-bold rounded-lg transition text-[10px] disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                                >
                                  <RefreshCw className={`h-2.5 w-2.5 ${verifyingId === sub.id ? 'animate-spin' : ''}`} />
                                  Verificar
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    setEditSubEmail(sub.email || '');
                                    setEditSubPlan(sub.plan || 'pro');
                                    setEditSubCycle(sub.billingCycle === 'annual' || sub.billingCycle === 'yearly' ? 'yearly' : 'monthly');
                                    setEditSubStatus(sub.status || 'authorized');
                                    setEditSubUserId(sub.userId === 'unknown' ? '' : (sub.userId || ''));
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-755 hover:text-white text-[10px] font-bold text-slate-200 rounded-lg transition font-sans cursor-pointer select-none"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* DESKTOP TABLE: Visible on medium screens and up */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed">
                          <thead>
                            <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 text-[10px] font-extrabold tracking-wider uppercase">
                              <th className="p-4 w-[22%]">E-mail / UID</th>
                              <th className="p-4 w-[15%]">Plano</th>
                              <th className="p-4 w-[12%]">Status MP</th>
                              <th className="p-4 w-[11%]">Pagamento</th>
                              <th className="p-4 w-[15%]">Vencimento</th>
                              <th className="p-4 w-[10%]">Origem</th>
                              <th className="p-4 w-[15%] text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/60 text-xs">
                            {subs.map((sub) => {
                              const assocUser = findAssociatedUser(sub);
                              const origin = getSubscriptionOrigin(sub, assocUser);
                              const exp = getExpirationDetails(sub, assocUser);
                              const isNowActive = sub.status === 'authorized' || sub.status === 'approved' || sub.status === 'active';
                              const planLabel = sub.plan === 'premium' ? 'Premium' : (sub.plan === 'pro' ? 'Pro' : (sub.plan === 'essencial' ? 'Essencial' : 'Grátis'));
                              const cycleLabel = sub.billingCycle === 'annual' || sub.billingCycle === 'yearly' ? 'Anual' : 'Mensal';
                              const paidDate = sub.paidAt ? new Date(sub.paidAt).toLocaleDateString('pt-BR') : '-';

                              return (
                                <tr key={sub.id} className="hover:bg-slate-950/25 transition-colors">
                                  <td className="p-4 font-medium text-slate-100 flex flex-col justify-center min-w-0 text-left">
                                    <span className="truncate" title={sub.email}>{sub.email}</span>
                                    <span className="text-[9px] text-slate-500 font-mono select-all truncate mt-0.5">UID: {sub.userId || 'Não Associado'}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border tracking-wide uppercase ${sub.plan === 'premium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                      {planLabel} ({cycleLabel})
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] border tracking-wider uppercase ${sub.status === 'refunded' ? 'bg-amber-600/15 border-amber-500/25 text-amber-500' : isNowActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                      ● {sub.status === 'refunded' ? 'REEMBOLSADO' : sub.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-300">
                                    {paidDate}
                                  </td>
                                  <td className="p-4">
                                    {expBadge(exp)}
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-extrabold text-[9px] border tracking-wider uppercase ${origin.color}`}>
                                      {origin.label}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => askConfirmation(
                                          "Confirmar Verificação de Assinatura",
                                          `Deseja realmente sincronizar os dados da assinatura "${sub.id}" diretamente com a API do Mercado Pago para atualizar o faturamento no sistema?`,
                                          () => handleVerifySubscription(sub.id)
                                        )}
                                        disabled={verifyingId !== null}
                                        className="p-1.5 bg-orange-600/10 hover:bg-orange-600 border border-orange-500/15 hover:border-orange-500 text-orange-400 hover:text-slate-950 rounded-lg transition disabled:opacity-50 flex items-center justify-center cursor-pointer select-none"
                                        title="Verificar agora"
                                      >
                                        <RefreshCw className={`h-3 w-3 ${verifyingId === sub.id ? 'animate-spin' : ''}`} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedSub(sub);
                                          setEditSubEmail(sub.email || '');
                                          setEditSubPlan(sub.plan || 'pro');
                                          setEditSubCycle(sub.billingCycle === 'annual' || sub.billingCycle === 'yearly' ? 'yearly' : 'monthly');
                                          setEditSubStatus(sub.status || 'authorized');
                                          setEditSubUserId(sub.userId === 'unknown' ? '' : (sub.userId || ''));
                                        }}
                                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-755 hover:text-white text-[11px] font-bold text-slate-200 rounded-lg transition font-sans cursor-pointer select-none"
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                };

                return (
                  <div className="space-y-6">
                    {/* REAL SUBSCRIPTIONS CONTAINER */}
                    <div className="bg-slate-900/10 border border-slate-850/70 rounded-3xl overflow-hidden shadow-lg">
                      <div className="px-6 py-4 bg-slate-950/45 border-b border-slate-850 flex items-center justify-between gap-4 flex-wrap">
                        <div className="text-left">
                          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Assinaturas Reais / Ativas</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">Lista limpa com assinantes reais e faturamentos válidos vinculados</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-wider">
                          {realSubs.length} Assinantes
                        </span>
                      </div>
                      {renderSubscriptionList(realSubs)}
                    </div>

                    {/* COLLAPSIBLE TECHNICAL/SANDBOX SUBSCRIPTIONS CONTAINER */}
                    <div className="bg-slate-900/10 border border-slate-850/70 rounded-3xl overflow-hidden shadow-lg">
                      <button
                        onClick={() => setShowTechnicalDocs(!showTechnicalDocs)}
                        className="w-full px-6 py-4 bg-slate-950/25 hover:bg-slate-900/30 border-b border-slate-850 flex items-center justify-between hover:text-white transition text-left cursor-pointer select-none"
                      >
                        <div className="flex flex-col min-w-0 mr-4 text-left">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-slate-500 shrink-0" />
                            <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider">Registros Técnicos / Órfãos / Erros / Sandbox</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Contém simulações, sandbox, registros com erro de assinatura ou órfãos sem UID cadastrado</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono rounded-full">
                            {techSubs.length} registros
                          </span>
                          <span className="text-orange-400 font-extrabold text-xs uppercase tracking-wider select-none">
                            {showTechnicalDocs ? 'Ocultar ▲' : 'Expandir ▼'}
                          </span>
                        </div>
                      </button>
                      {showTechnicalDocs && renderSubscriptionList(techSubs)}
                    </div>
                  </div>
                );
              })()}

              {/* MANUAL ACTION INFORMATION MODAL */}
              {selectedSub && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-slate-200 text-left font-sans"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-base text-white">Sincronização Manual</h4>
                        <p className="text-[10px] text-slate-400 font-mono">ID MP: {selectedSub.id}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSub(null)}
                        className="text-slate-400 hover:text-white font-mono text-lg"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSaveSubEdit} className="space-y-4">
                      {/* USER EMAIL */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-semibold">E-mail do Assinante</label>
                        <input
                          type="email"
                          required
                          value={editSubEmail}
                          onChange={(e) => setEditSubEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-955 border border-slate-850 hover:border-slate-750 focus:border-orange-500 outline-none rounded-xl text-xs text-white"
                        />
                      </div>

                      {/* USER ID (UID) */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                          <span>User ID (Firebase UID)</span>
                          <span className="text-[9px] text-orange-500 font-normal">Necessário para liberar plano</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Digite o UID do usuário"
                          value={editSubUserId}
                          onChange={(e) => setEditSubUserId(e.target.value.trim())}
                          className="w-full px-3 py-2 bg-slate-955 border border-slate-850 hover:border-slate-750 focus:border-orange-500 outline-none rounded-xl text-xs text-white font-mono"
                        />
                        <p className="text-[10px] text-slate-500">Dica: Procure o UID na aba <strong>Gerenciar Usuários</strong>.</p>
                      </div>

                      {/* PLAN KEY */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-300 font-semibold">Plano</label>
                          <select
                            value={editSubPlan}
                            onChange={(e: any) => setEditSubPlan(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-955 border border-slate-850 hover:border-slate-750 focus:border-orange-500 outline-none rounded-xl text-xs text-white"
                          >
                            <option value="essencial">Essencial (10 músicas)</option>
                            <option value="pro">Pro (15 músicas)</option>
                            <option value="premium">Premium (50 músicas)</option>
                            <option value="free">Free (3 músicas)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-300 font-semibold">Faturamento</label>
                          <select
                            value={editSubCycle}
                            onChange={(e: any) => setEditSubCycle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-955 border border-slate-850 hover:border-slate-750 focus:border-orange-500 outline-none rounded-xl text-xs text-white"
                          >
                            <option value="monthly">Mensal</option>
                            <option value="yearly">Anual</option>
                          </select>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-semibold">Status do Mercado Pago</label>
                        <select
                          value={editSubStatus}
                          onChange={(e) => setEditSubStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-955 border border-slate-850 hover:border-slate-750 focus:border-orange-500 outline-none rounded-xl text-xs text-white"
                        >
                          <option value="authorized">authorized (Ativa e Autorizada)</option>
                          <option value="approved">approved (Aprovado)</option>
                          <option value="pending">pending (Pendente)</option>
                          <option value="cancelled">cancelled (Cancelada/Inativa)</option>
                        </select>
                      </div>

                      <div className="flex gap-3 justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 text-xs font-bold rounded-xl transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition uppercase tracking-wider"
                        >
                          Sincronizar Plano
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* GLOBAL CONFIRMATION MODAL */}
              {confirmModal && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-slate-200 text-left font-sans"
                  >
                    <div className="flex items-center gap-3 text-amber-500 border-b border-slate-800 pb-3">
                      <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                      <h4 className="font-bold text-base text-white">{confirmModal.title}</h4>
                    </div>
                    
                    <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap font-sans">
                      {confirmModal.message}
                    </p>

                    <div className="flex gap-3 justify-end pt-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setConfirmModal(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer select-none"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={confirmModal.onConfirm}
                        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl transition uppercase tracking-wider cursor-pointer select-none"
                      >
                        Confirmar Ação
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
