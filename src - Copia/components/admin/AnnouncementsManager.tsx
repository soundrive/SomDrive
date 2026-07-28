import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Loader2, 
  Eye, 
  Calendar, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { Announcement, AnnouncementType } from '../../types';
import { dbService } from '../../lib/db';
import { auth } from '../../lib/firebase';
import { AnnouncementCard } from '../AnnouncementCard';

interface AnnouncementsManagerProps {
  currentUserId: string;
}

export default function AnnouncementsManager({ currentUserId }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<AnnouncementType>('audition');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageStoragePath, setImageStoragePath] = useState<string>('');
  
  // WhatsApp fields
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');

  // Image upload state variables
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [imageAction, setImageAction] = useState<'none' | 'keep' | 'replace' | 'remove'>('none');

  const [buttonText, setButtonText] = useState<string>('');
  const [buttonUrl, setButtonUrl] = useState<string>('');
  const [priority, setPriority] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [startsAt, setStartsAt] = useState<string>('');
  const [endsAt, setEndsAt] = useState<string>('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await dbService.getAnnouncements(false); // loads all (active and inactive)
      setAnnouncements(list);
    } catch (e) {
      console.error("Error loading announcements in admin:", e);
      showFeedback('Erro ao carregar avisos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  const handleStartCreate = () => {
    // Set default dates: startsAt is now, endsAt is empty
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);

    setIsEditing(true);
    setEditId(null);
    setTitle('');
    setType('audition');
    setSummary('');
    setContent('');
    setImageUrl('');
    setImageStoragePath('');
    setWhatsappNumber('');
    setWhatsappMessage('');
    setImageFile(null);
    setImagePreviewUrl('');
    setImageAction('none');
    setButtonText('');
    setButtonUrl('');
    setPriority(1);
    setIsActive(true);
    setStartsAt(localISOTime);
    setEndsAt('');
  };

  const handleStartEdit = (ann: Announcement) => {
    setIsEditing(true);
    setEditId(ann.id);
    setTitle(ann.title);
    setType(ann.type);
    setSummary(ann.summary);
    setContent(ann.content || '');
    setImageUrl(ann.imageUrl || '');
    setImageStoragePath(ann.imageStoragePath || '');
    setWhatsappNumber(ann.whatsappNumber || '');
    setWhatsappMessage(ann.whatsappMessage || '');
    setImageFile(null);
    setImagePreviewUrl(ann.imageUrl || '');
    setImageAction('keep');
    setButtonText(ann.buttonText || '');
    setButtonUrl(ann.buttonUrl || '');
    setPriority(ann.priority);
    setIsActive(ann.isActive);

    // Convert ISO string dates back to datetime-local values (YYYY-MM-DDTHH:MM)
    if (ann.startsAt) {
      const d = new Date(ann.startsAt);
      const tzoffset = d.getTimezoneOffset() * 60000;
      setStartsAt(new Date(d.getTime() - tzoffset).toISOString().slice(0, 16));
    } else {
      setStartsAt('');
    }

    if (ann.endsAt) {
      const d = new Date(ann.endsAt);
      const tzoffset = d.getTimezoneOffset() * 60000;
      setEndsAt(new Date(d.getTime() - tzoffset).toISOString().slice(0, 16));
    } else {
      setEndsAt('');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setImageFile(null);
    setImagePreviewUrl('');
    setImageAction('none');
  };

  const handleToggleActive = async (ann: Announcement, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const updated: Announcement = {
        ...ann,
        isActive: !ann.isActive,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveAnnouncement(updated, true);
      showFeedback(`Aviso ${!ann.isActive ? 'ativado' : 'desativado'} com sucesso!`, 'success');
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao alterar status do aviso.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Image Picker & Compressor Workflow
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("[ANNOUNCEMENT IMAGE 1] arquivo selecionado");
    setIsOptimizing(true);
    try {
      // Create a canvas crop & compression wrapper
      const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Determine dimensions for a square cover crop (1:1 ratio)
            const minSide = Math.min(img.width, img.height);
            // If the image is smaller than 600px, keep original dimension so we don't scale up and blur
            const targetSize = Math.min(600, minSide);
            
            if (minSide < 600) {
              showFeedback("Aviso: A imagem selecionada tem resolução baixa (menor que 600x600). Preservando a resolução original para evitar que fique borrada.", "success");
            }

            const targetWidth = targetSize;
            const targetHeight = targetSize;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error("Não foi possível carregar o canvas de renderização."));
              return;
            }

            // Cover crop calculations to keep quality and prevent deformation (1:1 aspect ratio)
            const imgAspect = img.width / img.height;
            const targetAspect = targetWidth / targetHeight;
            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            if (imgAspect > targetAspect) {
              // Image is wider, crop horizontal sides
              sWidth = img.height * targetAspect;
              sx = (img.width - sWidth) / 2;
            } else {
              // Image is taller, crop vertical sides
              sHeight = img.width / targetAspect;
              sy = (img.height - sHeight) / 2;
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

            // Compress as JPEG under 250 KB
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Falha ao compactar imagem."));
              }
            }, 'image/jpeg', 0.92); // 92% quality is outstanding for sharpness and retains optimal size
          };
          img.onerror = () => reject(new Error("Erro ao abrir imagem. Certifique-se de que é um formato válido."));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Erro ao ler o arquivo de imagem."));
        reader.readAsDataURL(file);
      });

      // Convert Blob to File object for Firebase upload
      const optimizedFile = new File([optimizedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: 'image/jpeg'
      });
      console.log("[ANNOUNCEMENT IMAGE 2] otimização concluída");

      // Show temporary object URL in UI preview
      const previewUrl = URL.createObjectURL(optimizedBlob);
      setImagePreviewUrl(previewUrl);
      setImageFile(optimizedFile);
      setImageAction('replace');
    } catch (err: any) {
      console.error(err);
      showFeedback(err.message || 'Erro ao processar imagem.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRemoveImageOnly = () => {
    setImagePreviewUrl('');
    setImageFile(null);
    setImageAction('remove');
  };

  // Physical Deletion of Announcement + Image Resource
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmation = window.confirm(
      "Tem certeza de que deseja excluir este aviso? O aviso e a imagem vinculada serão removidos definitivamente."
    );
    if (!confirmation) return;

    setActionLoading(true);
    try {
      // Find the announcement info first to check for linked image storage
      const ann = announcements.find(a => a.id === id);
      if (ann && ann.imageStoragePath) {
        try {
          await dbService.deleteAnnouncementImage(ann.imageStoragePath);
        } catch (storageErr) {
          console.error("Firebase Storage Image deletion failed:", storageErr);
          throw new Error(
            "Erro ao excluir a imagem vinculada do servidor de armazenamento. Por segurança, a exclusão do aviso foi interrompida para evitar dados inconsistentes."
          );
        }
      }

      await dbService.deleteAnnouncement(id);
      showFeedback('Aviso e recursos vinculados excluídos definitivamente com sucesso!', 'success');
      await loadAnnouncements();
    } catch (err: any) {
      console.error(err);
      showFeedback(err.message || 'Erro ao excluir o aviso.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ANNOUNCEMENT 1] submit iniciado");
    console.log("[ANNOUNCEMENT AUTH UID]", auth.currentUser?.uid);

    if (!title.trim() || !summary.trim() || !startsAt) {
      showFeedback('Preencha os campos obrigatórios (Título, Resumo e Data de Início).', 'error');
      return;
    }
    console.log("[ANNOUNCEMENT 2] validação concluída");

    setActionLoading(true);
    let previousStoragePathToDelete: string | null = null;

    try {
      const finalId = editId || 'ann_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      
      let finalImageUrl = imageUrl;
      let finalImageStoragePath = imageStoragePath;

      const selectedImageFile = imageFile;
      console.log("[ANNOUNCEMENT IMAGE]", selectedImageFile ? "upload necessário" : "sem imagem, upload ignorado");
      console.log("[ANNOUNCEMENT 3] imagem verificada");

      // Handle file upload processes securely without calling Storage if not needed
      if (imageAction === 'replace' && selectedImageFile instanceof File) {
        console.log("[ANNOUNCEMENT IMAGE 3] upload iniciado");
        // Upload the new image file using the optimized R2 endpoints
        const uploadRes = await dbService.uploadAnnouncementImage(finalId, selectedImageFile);
        finalImageUrl = uploadRes.imageUrl;
        console.log("[ANNOUNCEMENT IMAGE 4] upload concluído");
        console.log("[ANNOUNCEMENT IMAGE URL]", finalImageUrl);
        
        // Save the previous storage path to delete after successful document save
        if (imageStoragePath) {
          previousStoragePathToDelete = imageStoragePath;
        }
        finalImageStoragePath = uploadRes.imageStoragePath;
      } else if (imageAction === 'remove') {
        finalImageUrl = '';
        if (imageStoragePath) {
          previousStoragePathToDelete = imageStoragePath;
        }
        finalImageStoragePath = '';
      }

      // Automatically format WhatsApp fields
      let finalButtonUrl = buttonUrl;
      let cleanNum = '';
      if (whatsappNumber.trim()) {
        cleanNum = whatsappNumber.replace(/\D/g, ''); // Keep only digits
        if (cleanNum) {
          const finalNum = cleanNum.startsWith('55') ? cleanNum : '55' + cleanNum;
          let waLink = `https://wa.me/${finalNum}`;
          if (whatsappMessage.trim()) {
            waLink += `?text=${encodeURIComponent(whatsappMessage.trim())}`;
          }
          finalButtonUrl = waLink;
        }
      }

      const newAnn: Announcement = {
        id: finalId,
        title: title.trim(),
        type,
        summary: summary.trim(),
        content: content.trim() || undefined,
        imageUrl: finalImageUrl.trim() || undefined,
        imageStoragePath: finalImageStoragePath.trim() || undefined,
        whatsappNumber: cleanNum || undefined,
        whatsappMessage: whatsappMessage.trim() || undefined,
        buttonText: buttonText.trim() || (cleanNum ? 'Falar no WhatsApp' : undefined),
        buttonUrl: finalButtonUrl.trim() || undefined,
        priority: Number(priority),
        isActive,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        createdAt: editId ? (announcements.find(a => a.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUserId
      };

      console.log("[ANNOUNCEMENT 4] antes do saveAnnouncement");

      // 1. Save document to Firestore first with a 15-second safety timeout
      await Promise.race([
        dbService.saveAnnouncement(newAnn, !!editId),
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout ao salvar aviso após 15 segundos")),
            15000
          )
        )
      ]);
      console.log("[ANNOUNCEMENT SAVE] aviso salvo");

      // 2. ONLY AFTER successful save, clean up the previous storage image to prevent orphans or loss
      if (previousStoragePathToDelete) {
        try {
          await dbService.deleteAnnouncementImage(previousStoragePathToDelete);
        } catch (delErr) {
          console.warn("Could not delete older image from Storage, orphan may exist: ", delErr);
        }
      }

      showFeedback(editId ? 'Aviso atualizado com sucesso!' : 'Novo aviso criado com sucesso!', 'success');
      setIsEditing(false);
      setEditId(null);
      setImageFile(null);
      setImagePreviewUrl('');
      setImageAction('none');
      await loadAnnouncements();
    } catch (err: any) {
      console.error("[ANNOUNCEMENT ERROR]", err);
      showFeedback(err.message || 'Erro ao salvar o aviso. Verifique as regras de preenchimento.', 'error');
    } finally {
      console.log("[ANNOUNCEMENT FINALLY] loading liberado");
      setActionLoading(false);
    }
  };

  // Dynamic preview generator for Live UI feedback
  const getPreviewAnnouncement = (): Announcement => {
    let finalButtonUrl = buttonUrl;
    let computedButtonText = buttonText;
    
    if (whatsappNumber.trim()) {
      const cleanNum = whatsappNumber.replace(/\D/g, '');
      if (cleanNum) {
        const finalNum = cleanNum.startsWith('55') ? cleanNum : '55' + cleanNum;
        let waLink = `https://wa.me/${finalNum}`;
        if (whatsappMessage.trim()) {
          waLink += `?text=${encodeURIComponent(whatsappMessage.trim())}`;
        }
        finalButtonUrl = waLink;
        computedButtonText = buttonText || 'Falar no WhatsApp';
      }
    }

    return {
      id: 'preview',
      title: title || 'Título de Exemplo do Aviso',
      type,
      summary: summary || 'Aqui vai o resumo ou descrição breve do aviso que aparecerá em destaque no Dashboard.',
      content: content || undefined,
      imageUrl: imagePreviewUrl || undefined,
      buttonText: computedButtonText || undefined,
      buttonUrl: finalButtonUrl || undefined,
      priority,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUserId
    };
  };

  const previewAnnouncement = getPreviewAnnouncement();

  return (
    <div id="announcements-manager-admin" className="space-y-6">
      
      {/* Title & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="text-left">
          <h2 className="font-heading font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-400" />
            Mural de Avisos & Audições
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Crie seleções, comunicados ou oportunidades de audição para os compositores.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartCreate}
            className="px-5 py-3 bg-[#1ed760] hover:bg-[#1db954] text-slate-950 text-xs font-bold uppercase tracking-wider transition rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#1ed760]/10"
          >
            <Plus className="w-4 h-4" /> Novo Aviso
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs font-mono text-center transition ${
          message.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-500/20 text-[#1ed760]' 
            : 'bg-rose-950/30 border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Editing Form with Preview */}
      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 text-left">
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider border-b border-slate-800 pb-2">
              {editId ? 'Editar Aviso' : 'Novo Cadastro de Aviso'}
            </h3>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                Título do Aviso *
              </label>
              <input
                type="text"
                placeholder="Ex: Audição Urgente para Sertanejo Universitário"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans"
              />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                  Tipo de Aviso *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AnnouncementType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans cursor-pointer"
                >
                  <option value="audition">Audição</option>
                  <option value="opportunity">Oportunidade</option>
                  <option value="announcement">Comunicado</option>
                  <option value="invitation">Convite</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                  Prioridade *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans cursor-pointer"
                >
                  <option value={1}>Baixa (Comum)</option>
                  <option value={2}>Média</option>
                  <option value={3}>Alta (Borda Dourada / Destaque)</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                Resumo / Descrição Rápida * (Max 150 caracteres)
              </label>
              <textarea
                placeholder="Ex: Produtor renomado busca composições inéditas no estilo sertanejo universitário animado..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={150}
                required
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans resize-none"
              />
            </div>

            {/* Content (Detailed description) */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block flex items-center gap-1">
                Conteúdo Detalhado / Regras Completas (Opcional) <HelpCircle className="w-3 h-3 text-slate-500" title="Informações detalhadas adicionais ou regras" />
              </label>
              <input
                type="text"
                placeholder="Ex: Enviar áudio guia completo. Gravação agendada para 15 de Julho."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans"
              />
            </div>

            {/* Optimized Small Image Upload Section */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-white uppercase font-mono tracking-wider">Imagem Pequena (Opcional)</span>
                  <span className="block text-[9px] text-slate-400 font-sans mt-0.5">Imagem quadrada recomendada (1:1) | JPG, PNG ou WebP | Otimização automática</span>
                </div>
                {imagePreviewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImageOnly}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wide cursor-pointer"
                  >
                    Remover Imagem
                  </button>
                )}
              </div>

              {/* Form Input Button */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition select-none text-xs text-white font-mono uppercase tracking-wider font-bold hover:bg-slate-850">
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isOptimizing ? 'Otimizando...' : 'Adicionar Imagem'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={isOptimizing}
                    className="hidden"
                  />
                </label>

                {imagePreviewUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreviewUrl}
                      alt="Otimizada"
                      className="w-10 h-10 object-cover rounded border border-slate-800"
                    />
                    <span className="text-[9px] font-mono text-emerald-500 font-bold bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                      Pronta / Otimizada
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp Integration Section */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div>
                <span className="block text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#1ed760]" /> Integração com WhatsApp (Opcional)
                </span>
                <span className="block text-[9px] text-slate-400 font-sans mt-0.5">O sistema gerará automaticamente o link wa.me formatado com o DDI do Brasil (55).</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                    Número do WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 62999999999"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                    Mensagem Inicial
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Olá, gostaria de saber mais..."
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Button Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                  Texto do Botão de Ação
                </label>
                <input
                  type="text"
                  placeholder={whatsappNumber ? "Ex: Falar no WhatsApp" : "Ex: Enviar Composição"}
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-sans"
                />
              </div>

              {!whatsappNumber && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block">
                    Link de Destino do Botão (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="Ex: https://somdrive.com.br/regras"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
              )}
            </div>

            {/* Schedule configuration (startsAt, endsAt) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block flex items-center gap-1">
                  Data de Início * <Calendar className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-mono cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase block flex items-center gap-1">
                  Data de Encerramento (Opcional) <Calendar className="w-3 h-3 text-slate-400" />
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition font-mono cursor-pointer"
                />
              </div>
            </div>

            {/* IsActive Toggle switch */}
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div className="text-left">
                <span className="block text-xs font-bold text-white uppercase font-mono tracking-wider">Aviso Publicado</span>
                <span className="block text-[10px] text-slate-400 font-sans mt-0.5">Se inativo, nenhum compositor verá o aviso.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                {isActive ? (
                  <ToggleRight className="w-9 h-9 text-[#1ed760]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600" />
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading || isOptimizing}
                className="flex-1 px-4 py-3 bg-[#1ed760] hover:bg-[#1db954] text-slate-950 text-xs font-black uppercase tracking-wider transition rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editId ? 'Salvar Edições' : 'Criar Aviso'}
              </button>
            </div>
          </form>

          {/* Live Preview Side Panel */}
          <div className="space-y-5 text-left sticky top-5">
            <h3 className="text-sm font-black text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" /> Prévia em Tempo Real
            </h3>
            
            <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 space-y-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                Como os compositores verão no topo do painel:
              </span>
              
              <AnnouncementCard announcement={previewAnnouncement} compact={false} />
              
              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
                  Formato compacto adicional:
                </span>
                <AnnouncementCard announcement={previewAnnouncement} compact={true} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 text-slate-400">
              <span className="font-bold text-white block">Status da Programação:</span>
              <p>
                - Ativo no mural? {isActive ? <span className="text-[#1ed760] font-bold">Sim</span> : <span className="text-rose-400 font-bold">Não (Oculto)</span>}
              </p>
              <p>
                - Inicia em: <span className="font-mono text-white">{startsAt ? new Date(startsAt).toLocaleString('pt-BR') : 'Imediatamente'}</span>
              </p>
              <p>
                - Encerra em: <span className="font-mono text-white">{endsAt ? new Date(endsAt).toLocaleString('pt-BR') : 'Nunca (Permanente)'}</span>
              </p>
              <p>
                - Nível de Prioridade: <span className="text-white font-bold">{priority === 3 ? 'Alta (Destaque Dourado)' : priority === 2 ? 'Média' : 'Baixa'}</span>
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* List of Announcements */
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-3" />
              <p className="text-xs font-mono text-slate-400">Carregando avisos da base de dados...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white uppercase">Nenhum aviso cadastrado ainda</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Publique audições, seleções musicais, prazos ou novidades para todos os compositores verem em tempo real.
              </p>
              <button
                onClick={handleStartCreate}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider transition rounded-xl cursor-pointer"
              >
                Criar o Primeiro Aviso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => {
                const isCurrentlyActive = ann.isActive;
                const starts = new Date(ann.startsAt);
                const ends = ann.endsAt ? new Date(ann.endsAt) : null;
                const now = new Date();
                const isProgrammed = starts > now;
                const isExpired = ends ? ends < now : false;

                // Visual tag based on timeline status
                let timeStatus = (
                  <span className="text-[9px] font-mono font-bold bg-emerald-950/40 text-[#1ed760] border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    No Ar
                  </span>
                );
                if (!isCurrentlyActive) {
                  timeStatus = (
                    <span className="text-[9px] font-mono font-bold bg-slate-950/40 text-slate-500 border border-slate-800 px-2 py-0.5 rounded uppercase">
                      Desativado
                    </span>
                  );
                } else if (isProgrammed) {
                  timeStatus = (
                    <span className="text-[9px] font-mono font-bold bg-blue-950/40 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                      Agendado
                    </span>
                  );
                } else if (isExpired) {
                  timeStatus = (
                    <span className="text-[9px] font-mono font-bold bg-rose-950/40 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                      Expirado
                    </span>
                  );
                }

                return (
                  <div
                    key={ann.id}
                    className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:bg-slate-900 text-left"
                  >
                    {/* Basic details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {timeStatus}
                        <span className="text-[9px] font-mono text-slate-500">
                          Prioridade: <strong className="text-slate-350">{ann.priority}</strong>
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">•</span>
                        <span className="text-[9px] font-mono text-slate-500">
                          Criado em: <strong className="text-slate-350">{new Date(ann.createdAt).toLocaleDateString('pt-BR')}</strong>
                        </span>
                      </div>

                      <h4 className="text-xs md:text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {ann.summary}
                      </p>
                    </div>

                    {/* Timeline summary */}
                    <div className="text-left md:text-right shrink-0">
                      <span className="block text-[8px] font-mono text-slate-500 uppercase">Período de exibição</span>
                      <span className="text-[10px] font-mono text-slate-350 block mt-0.5">
                        Início: {new Date(ann.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ann.endsAt ? (
                        <span className="text-[10px] font-mono text-slate-350 block">
                          Fim: {new Date(ann.endsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-500/85 block">
                          Exibição permanente
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 border-t border-slate-950 pt-3 md:pt-0 md:border-none w-full md:w-auto justify-end">
                      {/* Active Toggle Toggle */}
                      <button
                        onClick={(e) => handleToggleActive(ann, e)}
                        disabled={actionLoading}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isCurrentlyActive 
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-[#1ed760] hover:bg-emerald-950/40' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={isCurrentlyActive ? 'Desativar aviso' : 'Ativar aviso'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(ann)}
                        disabled={actionLoading}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-orange-400 hover:text-white rounded-xl transition cursor-pointer"
                        title="Editar aviso"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDelete(ann.id, e)}
                        disabled={actionLoading}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-950/40 text-rose-500 hover:text-rose-400 rounded-xl transition cursor-pointer"
                        title="Excluir aviso permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
