import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  MapPin, 
  Phone, 
  Instagram, 
  Music, 
  ArrowLeft, 
  Smartphone, 
  ShieldCheck 
} from 'lucide-react';
import { Artist } from '../types';
import { dbService } from '../lib/db';

interface AuthScreenProps {
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  onLoginSuccess: (artist: Artist) => void;
  startInRegister: boolean;
  initPremium: boolean;
}

export default function AuthScreen({ 
  onNavigate, 
  onLoginSuccess, 
  startInRegister = false,
  initPremium = false,
}: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(startInRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  
  // Registration fields
  const [artisticName, setArtisticName] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('Sertanejo');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);

  useEffect(() => {
    setIsRegister(startInRegister);
    setIsGoogleFlow(false);
  }, [startInRegister]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (isRegister) {
      if (!artisticName) {
        setErrorMsg('Nome Artístico é obrigatório.');
        return;
      }
      
      // Auto slug for custom URL handle ID
      const userSlug = artisticName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      const slugId = userSlug || `artist-${Math.floor(Math.random() * 8999) + 1000}`;

      const newProfile: Artist = {
        userId: slugId,
        name: artisticName,
        email: email.trim().toLowerCase(),
        city: city || 'Não Informada',
        genre,
        whatsapp: whatsapp.replace(/\D/g, '') || '5562999999999',
        instagram: instagram.replace(/@/g, '') || 'insta_artist',
        bio: bio || `Catálogo musical de ${artisticName} no Soundrive.`,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        plan: initPremium ? 'premium' : 'free',
        createdAt: new Date().toISOString()
      };

      dbService.updateArtistProfile(slugId, newProfile);
      dbService.setCurrentUser(newProfile);
      
      setSuccessAnimation(true);
      setTimeout(() => {
        onLoginSuccess(newProfile);
      }, 1200);

    } else {
      // Login simulation: Check if user exists, otherwise create or auto-authenticate
      const artists = dbService.getAllArtists();
      const matched = Object.values(artists).find(a => a.email.toLowerCase() === email.trim().toLowerCase());

      if (matched) {
        if (matched.isBlocked) {
          setErrorMsg('Sua conta está temporariamente bloqueada. Fale com o suporte.');
          return;
        }
        dbService.setCurrentUser(matched);
        setSuccessAnimation(true);
        setTimeout(() => {
          onLoginSuccess(matched);
        }, 1200);
      } else {
        // Safe fallbacks to keep prototype completely active on arbitrary credentials
        const emailLower = email.trim().toLowerCase();
        if (emailLower === 'videopremieroficial@gmail.com') {
          // Auto create administrator
          const adminProfile: Artist = {
            userId: "admin-soundrive",
            name: "Administrador Soundrive",
            email: "videopremieroficial@gmail.com",
            city: "Goiânia - GO",
            genre: "Todos",
            whatsapp: "5562999999999",
            instagram: "soundrive_app",
            bio: "Painel de Administração do Soundrive.",
            avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500",
            plan: 'premium',
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          dbService.setCurrentUser(adminProfile);
          dbService.ensureAdminAuth().then(() => {
            const finalProfile = dbService.getCurrentUser() || adminProfile;
            setSuccessAnimation(true);
            setTimeout(() => {
              onLoginSuccess(finalProfile);
            }, 1200);
          });
          return;
        }

        const demoProfile: Artist = {
          userId: "gabriel-silva",
          name: "Gabriel Silva",
          email: email.trim().toLowerCase(),
          city: "Goiânia - GO",
          genre: "Sertanejo / MPB",
          whatsapp: "5562999999999",
          instagram: "gabrielsilva_oficial",
          bio: "Compositor há mais de 10 anos, escrevendo hits sertanejos e modas de viola exclusivas.",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
          plan: 'free',
          createdAt: new Date().toISOString()
        };
        dbService.setCurrentUser(demoProfile);
        setSuccessAnimation(true);
        setTimeout(() => {
          onLoginSuccess(demoProfile);
        }, 1205);
      }
    }
  };

  const signInGoogle = () => {
    setErrorMsg('');
    setIsGoogleFlow(true);
    // Pre-fill user profile fields for editing
    setArtisticName("Rodrigo Alencar");
    setEmail("rodrigo.alencar@gmail.com");
    setCity("Goiânia - GO");
    setGenre("Sertanejo");
    setWhatsapp("");
    setInstagram("rodrigoalencar_som");
    setBio("Compositor ativo buscando gravar com grandes intérpretes.");
    setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80");
  };

  const handleGoogleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!artisticName.trim()) {
      setErrorMsg('O Nome Artístico é obrigatório.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg('O WhatsApp de contato é obrigatório.');
      return;
    }

    const cleanedWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanedWhatsapp.length < 10) {
      setErrorMsg('Por favor, digite um número de WhatsApp com DDD válido.');
      return;
    }

    // Auto slug for custom URL handle ID
    const userSlug = artisticName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    const slugId = userSlug || `artist-${Math.floor(Math.random() * 8999) + 1000}`;

    const newProfile: Artist = {
      userId: slugId,
      name: artisticName,
      email: email.trim().toLowerCase(),
      city: city || 'Não Informada',
      genre,
      whatsapp: cleanedWhatsapp,
      instagram: instagram.replace(/@/g, '') || 'insta_artist',
      bio: bio || `Catálogo musical de ${artisticName} no Soundrive.`,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
      plan: initPremium ? 'premium' : 'free',
      createdAt: new Date().toISOString()
    };

    dbService.updateArtistProfile(slugId, newProfile);
    dbService.setCurrentUser(newProfile);
    
    setSuccessAnimation(true);
    setTimeout(() => {
      onLoginSuccess(newProfile);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Visual background elements */}
      <div className="absolute right-[-10%] top-[-10%] w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute left-[-15%] bottom-[-10%] w-[350px] h-[350px] bg-yellow-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Back to landing */}
      <button 
        id="back-to-landing-btn"
        onClick={() => onNavigate('landing')}
        className="absolute top-6 left-6 flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 hover:text-white text-slate-400 transition text-xs font-bold uppercase cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Início
      </button>

      {/* Main card box */}
      <div id="auth-main-card" className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 my-12">
        {successAnimation ? (
          <div className="text-center py-12 space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
              <ShieldCheck className="w-10 h-10 text-slate-950 animate-bounce" />
            </div>
            <h3 className="text-2xl font-heading font-black tracking-tight uppercase text-glow">Autenticação Concluída!</h3>
            <p className="text-slate-400 text-sm">Carregando as pastas do seu pen drive digital...</p>
          </div>
        ) : isGoogleFlow ? (
          <div className="space-y-6">
            
            {/* Header branding for Google Profile setup */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950 border border-amber-500/20 rounded-2xl mb-4 text-amber-500 shadow-md">
                <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.74-.08-1.302-.178-1.86H12.24z"/>
                </svg>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">Google Vinculado ✓</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase">
                Complete Seu Perfil
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Coloque aqui as suas informações reais de contato. Todos os campos são editáveis:
              </p>
            </div>

            {errorMsg && (
              <div id="google-auth-error-msg" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGoogleCompleteSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome Artístico / Banda <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="google-reg-artist-name"
                    required
                    type="text" 
                    placeholder="Ex: Lara & Gabriel ou Rodrigo Alencar"
                    value={artisticName}
                    onChange={(e) => setArtisticName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">WhatsApp de Contato <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="google-reg-whatsapp"
                      required
                      type="text" 
                      placeholder="DDD + Número (Ex: 6299999999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border-orange-500/50 border rounded-xl text-sm focus:border-orange-500 outline-none text-white transition text-glow font-bold animate-[pulse_3s_infinite]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Principal</label>
                  <select 
                    id="google-reg-music-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition"
                  >
                    <option value="Sertanejo">Sertanejo Universitário</option>
                    <option value="Sertanejo Raiz">Sertanejo Raiz</option>
                    <option value="Samba">Pagode / Samba</option>
                    <option value="Forró">Forró / Xote</option>
                    <option value="MPB">MPB Tradicional</option>
                    <option value="Gospel">Gospel / Religioso</option>
                    <option value="Pop Rock">Pop / Rock Nacional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade - Estado</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="google-reg-city"
                      type="text" 
                      placeholder="Ex: Goiânia - GO"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Instagram (Usuário)</label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="google-reg-instagram"
                      type="text" 
                      placeholder="rodrigoalencar_som"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">E-mail Conectado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
                  <input 
                    id="google-reg-email"
                    type="email" 
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed"
                    title="Seu e-mail está autenticado pelo Google"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Breve Discografia / Bio</label>
                <textarea 
                  id="google-reg-bio"
                  placeholder="Seu breve histórico ou as conquistas do seu repertório..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  id="google-cancel-btn"
                  type="button"
                  onClick={() => setIsGoogleFlow(false)}
                  className="w-1/3 py-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider rounded-xl transition cursor-pointer font-bold"
                >
                  Cancelar
                </button>
                <button 
                  id="google-submit-btn"
                  type="submit"
                  className="w-2/3 py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-xs font-heading font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-orange-500/10 transition text-slate-950 font-bold"
                >
                  Ativar Perfil & Entrar 🚀
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header branding */}
            <div className="text-center">
              <div className="inline-flex p-3 bg-orange-955/40 border border-orange-500/20 rounded-2xl mb-4 text-orange-400">
                <Music className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase">
                {isRegister ? 'Criar Cadastro Artista' : 'Entrar na Plataforma'}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                {isRegister
                  ? 'Comece grátis e monte seu pen drive digital em minutos'
                  : 'Acesse suas músicas e veja seus relatórios de plays'}
              </p>
              
              {initPremium && isRegister && (
                <div className="mt-3 px-3 py-1.5 bg-orange-900/40 border border-orange-500/40 text-orange-300 text-xs font-heading font-black rounded-lg uppercase inline-block">
                  ★ Assinatura Premium Solicitada
                </div>
              )}
            </div>

            {errorMsg && (
              <div id="auth-error-msg" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Optional Registration Inputs */}
              {isRegister && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome Artístico / Banda</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-artist-name"
                          type="text" 
                          placeholder="Ex: Lara & Gabriel"
                          value={artisticName}
                          onChange={(e) => setArtisticName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Principal</label>
                      <select 
                        id="reg-music-genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition"
                      >
                        <option value="Sertanejo">Sertanejo Universitário</option>
                        <option value="Sertanejo Raiz">Sertanejo Raiz</option>
                        <option value="Samba">Pagode / Samba</option>
                        <option value="Forró">Forró / Xote</option>
                        <option value="MPB">MPB Tradicional</option>
                        <option value="Gospel">Gospel / Religioso</option>
                        <option value="Pop Rock">Pop / Rock Nacional</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade - Estado</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-city"
                          type="text" 
                          placeholder="Ex: Goiânia - GO"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">WhatsApp de Contato</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-whatsapp"
                          type="text" 
                          placeholder="DDD + Número (Ex: 6299999999)"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Instagram (Usuário)</label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-instagram"
                          type="text" 
                          placeholder="gabrielsilva_oficial"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Link da Foto Artista (Opcional)</label>
                      <input 
                        id="reg-avatar-url"
                        type="text" 
                        placeholder="https://suafoto.com/perfil.jpg"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Bio / Curto Histórico</label>
                    <textarea 
                      id="reg-bio"
                      placeholder="Fale um pouco sobre sua trajetória, composições ou banda..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white resize-none transition"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Core Login/Register Credentials */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="auth-email-input"
                    type="email" 
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="auth-password-input"
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              <button 
                id="auth-submit-btn"
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-sm font-heading font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-orange-500/10 transition-transform active:scale-98 select-none text-slate-950"
              >
                {isRegister ? 'Criar Minha Conta de Compositor' : 'Entrar no Painel do Compositor'}
              </button>
            </form>

            {/* Simulated OAuth Google button */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800/80"></div>
              <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Ou faça acesso rápido</span>
              <div className="flex-grow border-t border-slate-800/80"></div>
            </div>

            <button 
              id="auth-google-btn"
              onClick={signInGoogle}
              className="w-full py-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.74-.08-1.302-.178-1.86H12.24z"/>
              </svg>
              Entrar com Conta Google
            </button>

            {/* Form switcher */}
            <div className="text-center pt-2">
              <button 
                id="auth-switch-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                {isRegister ? 'Já tenho uma conta. Quero Fazer Login' : 'Não tem conta? Cadastrar-se agora'}
              </button>
            </div>

            {/* Quick prefill tester helper */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850/60 transition text-[11px] text-slate-500 leading-relaxed text-center">
              💡 **Dica de Teste:** O app utiliza persistência híbrida avançada. Você pode preencher qualquer credencial fictícia para testar instantaneamente como artista, fã ou compositor!
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
