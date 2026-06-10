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
  Sparkles
} from 'lucide-react';
import { Artist, ShareCardSettings } from '../types';
import { dbService } from '../lib/db';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AdminAreaProps {
  currentUser: Artist;
  onLogout: () => void;
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
}

export default function AdminArea({
  currentUser,
  onLogout,
  onNavigate
}: AdminAreaProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'manual' | 'payments' | 'settings' | 'mercadopago'>('dashboard');
  const [users, setUsers] = useState<Artist[]>([]);
  
  // Mercado Pago automatic subscriptions list states
  const [mpSubscriptions, setMpSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Edit Subscription form states
  const [editSubEmail, setEditSubEmail] = useState('');
  const [editSubPlan, setEditSubPlan] = useState<'free' | 'pro' | 'premium'>('pro');
  const [editSubCycle, setEditSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [editSubStatus, setEditSubStatus] = useState('authorized');
  const [editSubUserId, setEditSubUserId] = useState('');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // PaymentSettings states
  const [paymentSettings, setPaymentSettings] = useState<{
    proMonthlyUrl: string;
    proAnnualUrl: string;
    premiumMonthlyUrl: string;
    premiumAnnualUrl: string;
    updatedAt?: string;
    updatedBy?: string;
  }>({
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

  // Global share card states
  const [shareCardSettings, setShareCardSettings] = useState<ShareCardSettings | null>(null);
  const [isUploadingShareCard, setIsUploadingShareCard] = useState(false);
  const [shareCardUploadProgress, setShareCardUploadProgress] = useState(0);
  const [shareCardError, setShareCardError] = useState<string | null>(null);
  const shareCardFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadShareCardSettings = async () => {
    try {
      const data = await dbService.getShareCardSettings();
      setShareCardSettings(data);
    } catch (e) {
      console.error("Error loading share card settings:", e);
    }
  };

  const handleShareCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setShareCardError("A imagem excede o limite máximo de 10 MB.");
      return;
    }

    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      setShareCardError("Formato de imagem inválido. Use JPEG, PNG ou WEBP.");
      return;
    }

    setShareCardError(null);
    setIsUploadingShareCard(true);
    setShareCardUploadProgress(10);

    try {
      setShareCardUploadProgress(35);
      const response = await fetch("/api/admin/upload-share-card", {
        method: "POST",
        headers: {
          "X-File-Name": encodeURIComponent(file.name),
          "X-File-Type": file.type,
          "X-File-Size": file.size.toString(),
          "X-User-Id": currentUser.userId,
          "X-User-Email": currentUser.email || "",
        },
        body: file,
      });

      setShareCardUploadProgress(75);

      if (response.ok) {
        const data = await response.json();
        const publicImageUrl = data.publicImageUrl;
        
        // Write the settings directly from client side to ensure it is always saved successfully
        // bypassing any server-side Admin SDK credential limitations in the developer container
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
      }
    } catch (e) {
      console.error("Error loading integration status:", e);
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

  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const snap = await getDocs(collection(db, 'mp_subscriptions'));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
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
    setVerifyingId(id);
    try {
      const response = await fetch('/api/mercadopago/verify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Falha ao verificar status.");
      }
      triggerNotification(data.message || "Status sincronizado atualizado com sucesso!");
      loadSubscriptions();
    } catch (err: any) {
      console.error("[Verify Action Error]:", err);
      triggerNotification("Erro ao reconsultar Mercado Pago: " + (err.message || String(err)), true);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSaveSubEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubUserId) {
      triggerNotification("O ID do usuário (UID) é obrigatório.", true);
      return;
    }

    try {
      const limit = editSubPlan === 'premium' ? 50 : (editSubPlan === 'pro' ? 15 : 5);
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

      triggerNotification("Assinatura e plano do usuário sincronizados com sucesso!");
      setSelectedSub(null);
      loadSubscriptions();
    } catch (err: any) {
      console.error("Error saving subscription manual edit:", err);
      triggerNotification("Erro ao atualizar dados: " + (err.message || String(err)), true);
      handleFirestoreError(err, OperationType.WRITE, `mp_subscriptions/${selectedSub?.id}`);
    }
  };

  useEffect(() => {
    loadData();
    loadPaymentSettings();
    loadShareCardSettings();
    loadIntegrationStatus();
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
    
    try {
      // Calculate custom limit based on plan default if not modified
      let finalLimit = selectedUser.musicLimit;
      if (finalLimit === undefined) {
        finalLimit = selectedUser.plan === 'free' ? 5 : (selectedUser.plan === 'pro' ? 15 : 50);
      }

      const updatedFields: Partial<Artist> = {
        plan: selectedUser.plan,
        role: selectedUser.role || 'user',
        paymentStatus: selectedUser.paymentStatus || 'inactive',
        accessType: selectedUser.accessType || 'free',
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

      await dbService.updateUserDataFromAdmin(selectedUser.userId, updatedFields);
      triggerNotification("Alterações salvas com sucesso!");
      setSelectedUser(null);
      loadData();
    } catch {
      triggerNotification("Erro ao salvar alterações.", true);
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

    try {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(manualDuration));

      const updatedFields: Partial<Artist> = {
        plan: manualPlan,
        accessType: 'manual',
        paymentStatus: 'manual',
        musicLimit: Number(manualLimit),
        manualAccessEndsAt: expiresAt.toISOString(),
        subscriptionStartedAt: now.toISOString(),
        subscriptionEndsAt: expiresAt.toISOString(),
        bio: manualNotes ? `${matchedUser.bio || ''} - Nota Admin: ${manualNotes}` : matchedUser.bio
      };

      await dbService.updateUserDataFromAdmin(matchedUser.userId, updatedFields);
      triggerNotification(`Acesso manual de ${manualDuration} dias liberado para ${matchedUser.name}!`);
      setManualEmail('');
      setManualNotes('');
      loadData();
    } catch {
      triggerNotification("Erro ao aplicar liberação manual.", true);
    }
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
      triggerNotification(`Teste grátis de ${trialDuration} dias (Plano ${trialPlan.toUpperCase()}) criado e ativado para ${matchedUser.name}!`);
      setTrialEmail('');
      loadData();
    } catch {
      triggerNotification("Erro ao criar teste grátis.", true);
    }
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
              SOUNDRIVE <span className="text-orange-500 text-xs ml-2 font-mono uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Painel Admin</span>
            </h1>
            <p className="text-slate-400 text-xs hidden md:block">Gerenciamento geral da plataforma Soundrive</p>
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

              {/* Action Cards Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Usuários Cadastrados Recentemente</h3>
                  <button onClick={loadData} className="text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin-slow" /> Atualizar
                  </button>
                </div>
                
                {loading ? (
                  <div className="py-8 text-center text-slate-500 text-sm">Carregando usuários...</div>
                ) : users.length === 0 ? (
                  <div className="py-8 text-center text-slate-550 text-sm">Nenhum usuário cadastrado ainda.</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {users.slice(0, 5).map((u, idx) => (
                      <div key={u.userId || `recent-${idx}`} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={u.avatarUrl || u.photoURL || u.profileImageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-800" />
                          <div>
                            <h4 className="text-sm font-semibold text-white">{u.name}</h4>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] font-mono uppercase bg-slate-800 px-2.5 py-0.5 rounded-full ${u.plan === 'premium' ? 'text-orange-400' : (u.plan === 'pro' ? 'text-amber-400' : 'text-slate-400')}`}>
                            {u.plan}
                          </span>
                          <button 
                            onClick={() => { setSelectedUser(u); setActiveTab('users'); }}
                            className="text-xs bg-slate-800 hover:bg-slate-750 px-3 py-1 rounded-lg transition"
                          >
                            Gerenciar
                          </button>
                        </div>
                      </div>
                    ))}
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
                          const limit = user.musicLimit !== undefined ? user.musicLimit : (user.plan === 'free' ? 5 : (user.plan === 'pro' ? 15 : 50));
                          
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

              <form onSubmit={handleSaveUserEdit} className="space-y-6">
                
                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Informações Gerais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Artista</label>
                    <input
                      type="text"
                      value={selectedUser.name || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={selectedUser.city || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Estado</label>
                    <input
                      type="text"
                      value={selectedUser.state || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                      placeholder="Ex: GO"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">WhatsApp de Contato</label>
                    <input
                      type="text"
                      value={selectedUser.whatsapp || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, whatsapp: e.target.value, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Instagram (@)</label>
                    <input
                      type="text"
                      value={selectedUser.instagram || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, instagram: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nível de Permissão (Role)</label>
                    <select
                      value={selectedUser.role || 'user'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    >
                      <option value="user">User (Comum)</option>
                      <option value="admin">Admin (Administrador Geral)</option>
                    </select>
                  </div>
                </div>

                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase pt-4">Plano e Faturamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Plano Atual</label>
                    <select
                      value={selectedUser.plan}
                      onChange={(e) => {
                        const nextPlan = e.target.value as 'free' | 'pro' | 'premium';
                        const standardLimit = nextPlan === 'free' ? 5 : (nextPlan === 'pro' ? 15 : 50);
                        setSelectedUser({
                          ...selectedUser,
                          plan: nextPlan,
                          musicLimit: standardLimit
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    >
                      <option value="free">Free (Grátis)</option>
                      <option value="pro">Pro (Intermediário)</option>
                      <option value="premium">Premium (Completo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Acesso</label>
                    <select
                      value={selectedUser.accessType || 'free'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, accessType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    >
                      <option value="free">Free</option>
                      <option value="trial">Trial (Teste Grátis)</option>
                      <option value="manual">Manual (Liberado pelo Admin)</option>
                      <option value="mercadopago">MercadoPago (Processo de Vendas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Status de Pagamento (Mercado Pago / Manual)</label>
                    <select
                      value={selectedUser.paymentStatus || 'inactive'}
                      onChange={(e) => setSelectedUser({ ...selectedUser, paymentStatus: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500"
                    >
                      <option value="inactive">Inactive (Inativo)</option>
                      <option value="active">Active (Ativo)</option>
                      <option value="pending">Pending (Pendente)</option>
                      <option value="cancelled">Cancelled (Cancelado)</option>
                      <option value="manual">Manual (Aprovado Manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Limite Manual de Músicas</label>
                    <input
                      type="number"
                      value={selectedUser.musicLimit !== undefined ? selectedUser.musicLimit : 5}
                      onChange={(e) => setSelectedUser({ ...selectedUser, musicLimit: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase pt-4">Datas da Assinatura / Testes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Término do Teste Grátis (Trial Ends At)</label>
                    <input
                      type="datetime-local"
                      value={selectedUser.trialEndsAt ? selectedUser.trialEndsAt.substring(0, 16) : ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, trialEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500 font-mono text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Término do Acesso Manual (Manual Access Ends At)</label>
                    <input
                      type="datetime-local"
                      value={selectedUser.manualAccessEndsAt ? selectedUser.manualAccessEndsAt.substring(0, 16) : ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, manualAccessEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500 font-mono text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Início da Assinatura (Subscription Started At)</label>
                    <input
                      type="datetime-local"
                      value={selectedUser.subscriptionStartedAt ? selectedUser.subscriptionStartedAt.substring(0, 16) : ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, subscriptionStartedAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500 font-mono text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Término da Assinatura (Subscription Ends At)</label>
                    <input
                      type="datetime-local"
                      value={selectedUser.subscriptionEndsAt ? selectedUser.subscriptionEndsAt.substring(0, 16) : ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, subscriptionEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-sm outline-none text-slate-250 focus:border-orange-500 font-mono text-slate-300"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase pt-4">Mercado Pago (Campos preparados para API)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">ID do Pagamento MercadoPago (Payment ID)</label>
                    <input
                      type="text"
                      value={selectedUser.mercadoPagoPaymentId || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, mercadoPagoPaymentId: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs outline-none text-slate-250 focus:border-orange-500 font-mono"
                      placeholder="Ex: mp-pay-736294"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">ID da Assinatura MercadoPago (Subscription ID)</label>
                    <input
                      type="text"
                      value={selectedUser.mercadoPagoSubscriptionId || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, mercadoPagoSubscriptionId: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-xs outline-none text-slate-250 focus:border-orange-500 font-mono"
                      placeholder="Ex: pre_sub_927364"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                  <input
                    type="checkbox"
                    id="edit-isblocked"
                    checked={selectedUser.isBlocked || false}
                    onChange={(e) => setSelectedUser({ ...selectedUser, isBlocked: e.target.checked })}
                    className="h-4 w-4 bg-slate-950 text-orange-500"
                  />
                  <label htmlFor="edit-isblocked" className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer">
                    Bloquear conta do usuário de imediato (Impede login no aplicativo)
                  </label>
                </div>

                <div className="pt-4 flex space-x-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-medium rounded-2xl text-xs outline-none transition text-slate-350"
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
                      Ao término do teste grátis criado, o sistema de segurança reverterá o usuário automaticamente para o plano Free, limitando seu catálogo a 5 faixas musicais.
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
                  O Soundrive agora conta com liberação instantânea e automática de assinaturas via webhooks do Mercado Pago! Configure seus links de pagamento abaixo e o sistema atualizará os planos de forma 100% automatizada. Use a aba <strong>Assinaturas Mercado Pago</strong> na barra lateral para acompanhar o histórico e efetuar ações manuais se necessário.
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
                    
                    {/* SECTION 1: PRO MONTHLY */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">1. Soundrive Pro Mensal</span>
                        <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">R$ 19,90/mês</span>
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

                    {/* SECTION 2: PRO ANNUAL */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">2. Soundrive Pro Anual</span>
                        <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">R$ 199,00/ano</span>
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

                    {/* SECTION 3: PREMIUM MONTHLY */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">3. Soundrive Premium Mensal</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 39,90/mês</span>
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

                    {/* SECTION 4: PREMIUM ANNUAL */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold tracking-wider text-orange-500 uppercase">4. Soundrive Premium Anual</span>
                        <span className="text-[10px] font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">R$ 399,00/ano</span>
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
                    Esta imagem será usada em todo o site como miniatura de rede social no WhatsApp, Facebook e Instagram ao compartilhar catálogos ou links do Soundrive.
                  </p>
                </div>

                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850 space-y-4">
                  {shareCardSettings?.ogImageUrl ? (
                    <div className="space-y-4 animate-fade-in font-sans">
                      <p className="text-[11px] font-mono text-slate-455">Prévia da imagem ativa (Proporção 1200x630px):</p>
                      <div className="max-w-md aspect-[1.91/1] overflow-hidden rounded-xl border border-slate-800 shadow-lg relative bg-slate-900 group">
                        <img 
                          src={shareCardSettings.ogImageUrl} 
                          alt="Imagem Global de Compartilhamento" 
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

              {/* SEARCH FILTERS */}
              <div className="flex items-center bg-slate-950 px-4 py-3 rounded-2xl border border-slate-850">
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

              {loadingSubscriptions ? (
                <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
                  <span>Carregando dados das assinaturas...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-850">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                        <th className="p-4">E-mail do Usuário</th>
                        <th className="p-4">Plano</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Data do Pagamento</th>
                        <th className="p-4">ID Assinatura / Pagamento</th>
                        <th className="p-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {mpSubscriptions.filter(sub => {
                        const mSearch = subscriptionSearch.toLowerCase().trim();
                        if (!mSearch) return true;
                        return (sub.email || '').toLowerCase().includes(mSearch) ||
                               (sub.plan || '').toLowerCase().includes(mSearch) ||
                               (sub.status || '').toLowerCase().includes(mSearch);
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                            Nenhuma assinatura ou pagamento verificado via webhook.
                          </td>
                        </tr>
                      ) : (
                        mpSubscriptions.filter(sub => {
                          const mSearch = subscriptionSearch.toLowerCase().trim();
                          if (!mSearch) return true;
                          return (sub.email || '').toLowerCase().includes(mSearch) ||
                                 (sub.plan || '').toLowerCase().includes(mSearch) ||
                                 (sub.status || '').toLowerCase().includes(mSearch);
                        }).map((sub) => {
                          const isNowActive = sub.status === 'authorized' || sub.status === 'approved' || sub.status === 'active';
                          const planLabel = sub.plan === 'premium' ? 'Premium' : (sub.plan === 'pro' ? 'Pro' : 'Grátis');
                          const cycleLabel = sub.billingCycle === 'annual' || sub.billingCycle === 'yearly' ? 'Anual' : 'Mensal';
                          const paidDate = sub.paidAt ? new Date(sub.paidAt).toLocaleDateString('pt-BR') : '-';

                          return (
                            <tr key={sub.id} className="hover:bg-slate-950/20 transition-colors">
                              <td className="p-4 font-medium text-slate-100 flex flex-col">
                                <span>{sub.email}</span>
                                <span className="text-[10px] text-slate-500 font-mono select-all">UID: {sub.userId || 'Não Associado'}</span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border tracking-wide uppercase ${sub.plan === 'premium' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                  {planLabel} ({cycleLabel})
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] border tracking-wider uppercase ${isNowActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                  ● {sub.status}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300">
                                {paidDate}
                              </td>
                              <td className="p-4 font-mono text-[10px] text-slate-400">
                                <div className="space-y-0.5">
                                  {sub.subscriptionId && <p><span className="text-slate-650">Sub ID:</span> {sub.subscriptionId}</p>}
                                  {sub.paymentId && <p><span className="text-slate-650">Pay ID:</span> {sub.paymentId}</p>}
                                  {!sub.subscriptionId && !sub.paymentId && <p><span className="text-slate-650">Tx ID:</span> {sub.id}</p>}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleVerifySubscription(sub.id)}
                                    disabled={verifyingId !== null}
                                    className="px-3 py-1.5 bg-orange-600/10 hover:bg-orange-600 border border-orange-500/15 hover:border-orange-500 text-orange-400 hover:text-slate-950 font-bold rounded-lg transition text-[11px] disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${verifyingId === sub.id ? 'animate-spin' : ''}`} />
                                    {verifyingId === sub.id ? 'Sincronizando...' : 'Verificar agora'}
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
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 hover:text-white text-[11px] font-bold text-slate-200 rounded-lg transition font-sans cursor-pointer select-none"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

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
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition"
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
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
