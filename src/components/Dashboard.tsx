import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Disc, 
  Trash2, 
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
  UploadCloud
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
  
  // Storage Upload state block
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New track form states
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState(currentUser.name);
  const [singer, setSinger] = useState(currentUser.name);
  const [genre, setGenre] = useState('');
  const [desc, setDesc] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [coverOption, setCoverOption] = useState('gradient'); // gradient or custom url
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [audioOption, setAudioOption] = useState('default'); // default demo or custom URL or file
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [formError, setFormError] = useState('');
  
  // File handlers for browser object url injection
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Load tracks & analytics
  const refreshData = () => {
    const artistData = dbService.getArtist(currentUser.userId) || currentUser;
    setProfile(artistData);
    setTracks(dbService.getArtistMusics(currentUser.userId));
    setAnalytics(dbService.getAnalytics(currentUser.userId));
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
    return 5;
  };
  const limitCount = getPlanTracksLimit(profile.plan);

  const handleCopyLink = () => {
    const pageUrl = `${window.location.origin}/artista/${profile.userId}`;
    navigator.clipboard.writeText(pageUrl);
    setCopiedAlert(true);
    setTimeout(() => setCopiedAlert(false), 2000);
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

  const handleAddMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (tracks.length >= limitCount) {
      setFormError(`Limite atingido! O plano ${profile.plan.toUpperCase()} permite até ${limitCount} músicas.`);
      setShowAddForm(false);
      setShowLimitPrompt(true);
      return;
    }

    const maxSizeMB = profile.plan === 'free' ? 20 : 30;
    if (audioOption === 'file' && audioFile) {
      const sizeInMB = audioFile.size / (1024 * 1024);
      if (sizeInMB > maxSizeMB) {
        setFormError(`O arquivo de áudio excede o limite permitido para o seu plano (${maxSizeMB} MB). Faça upgrade para enviar arquivos maiores.`);
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

      // Determine audio URL using Firebase Storage if local file exists
      let finalAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      if (audioOption === 'file' && audioFile) {
        setUploadProgress(65);
        finalAudio = await dbService.uploadFile(profile.userId, audioFile, 'audio', (p) => setUploadProgress(prev => Math.max(prev, p)));
      } else if (audioOption === 'url' && customAudioUrl.trim()) {
        finalAudio = customAudioUrl.trim();
      } else {
        // Rotate roster of high quality fallback MP3 files
        const index = (tracks.length % 5) + 1;
        finalAudio = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index}.mp3`;
      }

      setUploadProgress(85);

      dbService.addMusic(profile.userId, {
        trackId: uniqueId,
        artistId: profile.userId,
        title: title.trim(),
        composer: composer.trim() || profile.name,
        singer: singer.trim() || profile.name,
        genre: genre.trim() || profile.genre || 'Sertanejo',
        description: desc.trim() || 'Faixa exclusiva em exibição para ouvintes.',
        audioUrl: finalAudio,
        coverUrl: finalCover,
        lyrics: lyrics.trim()
      });

      setUploadProgress(95);

      // Immediately run on-demand cloud sync
      await dbService.syncArtistData(profile.userId);

      setUploadProgress(100);

      // Reset Form State
      setTitle('');
      setDesc('');
      setLyrics('');
      setAudioFile(null);
      setCoverFile(null);
      setCustomAudioUrl('');
      setCustomCoverUrl('');
      setShowAddForm(false);
      refreshData();
    } catch (err: any) {
      console.error("Upload workflow failed: ", err);
      setFormError('Falha ao registrar música no Firebase. Certifique-se de que os seus arquivos de som ou imagem são válidos.');
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
          {(profile.role === 'admin' || profile.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com') && (
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
              <Copy className="w-4 h-4" /> {copiedAlert ? "Copiado! ✓" : "Copiar Link de Divulgação"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Metric 1: Tracks count */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Músicas Enviadas</p>
              <h4 className="text-3xl font-heading font-black tracking-tight">
                {tracks.length} <span className="text-slate-500 text-sm font-normal">/ {limitCount}</span>
              </h4>
              <div className="w-24 h-1 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${Math.min(100, (tracks.length / limitCount) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-xl">
              <Music className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 2: Plays global */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Total de Plays</p>
              <h4 className="text-3xl font-heading font-black tracking-tight font-mono text-[#d4af37]">{totalPlays}</h4>
              <p className="text-[10px] font-mono text-slate-400">Cliques no botão play</p>
            </div>
            <div className="p-3 bg-yellow-950/40 border border-yellow-500/20 text-[#d4af37] rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 3: Profile Visits */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Acessos no Catálogo</p>
              <h4 className="text-3xl font-heading font-black tracking-tight font-mono text-yellow-400">{analytics.viewsCount}</h4>
              <p className="text-[10px] font-mono text-slate-400">Total de visitas únicas</p>
            </div>
            <div className="p-3 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 4: WhatsApp clicks */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Cliques no WhatsApp</p>
              <h4 className="text-3xl font-heading font-black tracking-tight font-mono text-emerald-400">{analytics.whatsappClicks}</h4>
              <p className="text-[10px] font-mono text-slate-400">Propostas e negócios</p>
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl">
               <MessageSquare className="w-6 h-6" />
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
              {profile.plan === 'free' && 'Você está no Soundrive Free (5 Músicas)'}
              {profile.plan === 'pro' && 'Você está no Soundrive Pro (15 Músicas)'}
              {profile.plan === 'premium' && 'Você está no Soundrive Premium (50 Músicas)'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {profile.plan === 'free' && 'Você está no limite de 5 músicas do seu plano Free. Faça upgrade para o Pro ou Premium hoje mesmo para receber até 50 faixas, analytics completo com plays e visitas, e remover todos os anúncios!'}
              {profile.plan === 'pro' && 'Seu plano Pro está ativo! Ofereça até 15 músicas de demonstração de alta fidelidade, desfrute do acompanhamento básico de plays e do botão de contato "Quero gravar essa música" diretamente na sua guia pública.'}
              {profile.plan === 'premium' && 'Parabéns! Seu plano Premium está totalmente liberado com espaço máximo de 50 músicas, organização avançada por repertórios e álbuns personalizados, estatísticas detalhadas e suporte VIP prioritário de nossa equipe.'}
            </p>
          </div>
          <div className="px-4.5 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 text-slate-950 text-[10px] font-mono rounded-full font-black uppercase tracking-wider shrink-0 font-bold hover:scale-102 transition shadow-md">
            Gerenciar Assinatura
          </div>
        </div>

        {/* SECTION HEADER: MUSIC CONTROL LIST & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
          <div>
            <h3 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-orange-400" /> Meu Acervo Musical
            </h3>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">Controle suas composições salvas no catálogo.</p>
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
            className="px-5 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-slate-950 flex items-center gap-2 shadow-lg shadow-orange-500/20 group cursor-pointer transition duration-250 select-none font-bold"
          >
            <Plus className="w-5 h-5 text-slate-950 stroke-[2.5] group-hover:rotate-180 transition-transform" /> Adicionar Música
          </button>
        </div>

        {/* Music List Grid */}
        {tracks.length === 0 ? (
          <div id="empty-songs" className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-850 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto text-slate-600 border border-slate-800">
              <Music className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-black text-base uppercase text-slate-300">Seu pen drive está vazio</h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">Comece enviando sua primeira composição. Ela ficará disponível imediatamente para fãs e produtores ouvirem.</p>
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
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold uppercase text-orange-400 hover:text-slate-950 hover:bg-orange-500 transition cursor-pointer select-none"
            >
              Cadastrar faixa de demonstração
            </button>
          </div>
        ) : (
          <div id="songs-list-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => {
              const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
              
              return (
                <div 
                  key={track.trackId}
                  onClick={() => onSelectTrack(track, tracks)}
                  className={`bg-slate-900 hover:bg-slate-850 border rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-101 cursor-pointer flex flex-col justify-between ${
                    isCurrentlyPlaying ? 'ring-2 ring-orange-500 border-transparent bg-slate-850' : 'border-slate-850'
                  }`}
                >
                  <div>
                    {/* Premium Musical Note Card Header */}
                    <div className="relative aspect-video w-full bg-[#07090e] border-b border-slate-850 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                      {/* Ambient glows inside mock card header */}
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
                      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl pointer-events-none"></div>
                      
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${isCurrentlyPlaying ? 'from-orange-600 to-yellow-500 text-slate-950 shadow-md shadow-orange-500/20' : 'from-slate-950 to-slate-900 border border-slate-800 text-orange-400'} flex items-center justify-center shadow-lg relative z-10 transition-transform`}>
                        <Music className="w-5 h-5 animate-bounce" />
                      </div>
                      
                      {/* Neon wave simulation bar graph */}
                      <div className="flex items-end gap-1 mt-4 z-10 h-7">
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-orange-500 animate-bar-1' : 'bg-orange-950/80 hover:bg-orange-500/30 h-2'}`}></span>
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-orange-450 animate-bar-2' : 'bg-orange-950/80 hover:bg-orange-500/30 h-4'}`}></span>
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-gradient-to-t from-orange-500 to-yellow-400 animate-bar-3' : 'bg-orange-400/30 h-6'}`}></span>
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-gradient-to-t from-orange-500 to-yellow-400 animate-bar-4' : 'bg-orange-400/30 h-3'}`}></span>
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-orange-450 animate-bar-2' : 'bg-orange-950/80 hover:bg-orange-500/30 h-5'}`}></span>
                        <span className={`w-1 rounded-full transition-all ${isCurrentlyPlaying && isPlaying ? 'bg-orange-500 animate-bar-1' : 'bg-orange-950/80 hover:bg-orange-500/30 h-2'}`}></span>
                      </div>
                      
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-orange-950/80 border border-orange-500/20 text-orange-400 text-[9px] font-mono rounded uppercase font-bold tracking-wider">
                        {track.genre || profile.genre}
                      </span>
                    </div>

                    {/* Metadata body */}
                    <div className="p-5 space-y-2">
                      <h4 className="font-heading font-black text-base tracking-tight text-white uppercase truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold truncate leading-tight">
                        Intérprete: {track.singer || profile.name}
                      </p>
                      {track.composer && (
                        <p className="text-[10px] font-mono text-slate-500 uppercase">
                          Autor: {track.composer}
                        </p>
                      )}
                      {track.description && (
                        <p className="text-slate-400 text-xs italic line-clamp-2 pt-1 border-t border-slate-850/60 leading-relaxed">
                          {track.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Foot action panel */}
                  <div className="px-5 py-4 bg-slate-950 border-t border-slate-850/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-yellow-400" /> {track.playsCount} plays
                      </span>
                      {track.lyrics && (
                        <span className="px-1.5 py-0.5 bg-orange-955/80 border border-orange-550/25 text-orange-400 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                          Letra
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={(e) => handleDeleteMusic(track.trackId, e)}
                      className="p-1.5 bg-slate-900 border border-slate-850 text-slate-500 hover:text-red-400 hover:bg-slate-850 hover:border-slate-800 rounded transition cursor-pointer"
                      title="Excluir música"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

              {/* Row 2: Composer & Singer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              {/* Audio Upload Controls */}
              <div className="pt-2 border-t border-slate-850 p-4 bg-slate-950 rounded-2xl space-y-3">
                <h5 className="text-[11px] font-mono font-bold tracking-widest text-yellow-400 uppercase">1. Arquivo de Áudio da Música (MP3 / WAV)</h5>
                
                <div className="flex gap-4 text-xs font-semibold py-1">
                  <button 
                    type="button" 
                    onClick={() => setAudioOption('default')} 
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${audioOption === 'default' ? 'bg-orange-900/40 border-orange-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    Estúdio Demo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAudioOption('file')} 
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${audioOption === 'file' ? 'bg-orange-900/40 border-orange-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    Enviar do Celular/PC
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAudioOption('url')} 
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${audioOption === 'url' ? 'bg-orange-900/40 border-orange-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    Link Externo (URL)
                  </button>
                </div>

                {audioOption === 'file' && (
                  <div className="border-2 border-dashed border-slate-800 hover:border-slate-700/80 p-4 rounded-xl text-center space-y-2 relative bg-slate-900/20">
                    <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">Arraste ou clique abaixo para carregar seu arquivo musical</p>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:border-t file:border-slate-700 file:bg-slate-800 file:text-white file:rounded pointer-events-auto"
                    />
                    {audioFile && <p className="text-xs text-emerald-400 font-mono">Selecionado: {audioFile.name}</p>}
                  </div>
                )}

                {audioOption === 'url' && (
                  <input 
                    type="text" 
                    placeholder="https://meusite.com/musica.mp3"
                    value={customAudioUrl}
                    onChange={(e) => setCustomAudioUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                )}

                {audioOption === 'default' && (
                  <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl text-[10px] text-slate-500 font-mono">
                    <Info className="w-4 h-4 text-orange-500 shrink-0" /> O sistema irá anexar automaticamente um de nossos arquivos de estúdio (MP3 de alta fidelidade) para que você teste o player imediatamente.
                  </div>
                )}
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
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Você enviou <strong className="text-orange-400">{tracks.length} de {limitCount} músicas</strong> permitidas no plano <strong className="text-orange-400 uppercase">{profile.plan}</strong>.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Adicione mais faixas de demonstração, explore métricas, libere botões de vendas de guias e ative links personalizados fazendo upgrade para {profile.plan === 'free' ? 'Pro ou Premium' : 'Premium'}.
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

    </div>
  );
}
