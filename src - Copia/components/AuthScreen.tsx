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
  ShieldCheck,
  Sparkles,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import { Artist } from '../types';
import { dbService } from '../lib/db';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInAnonymously
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';

interface AuthScreenProps {
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin', payload?: any) => void;
  onLoginSuccess: (artist: Artist) => void;
  startInRegister: boolean;
  initPremium: boolean;
  logoScale?: number;
  showLogo?: boolean;
  customLogoUrl?: string;
}

export default function AuthScreen({ 
  onNavigate, 
  onLoginSuccess, 
  startInRegister = false,
  initPremium = false,
  logoScale,
  showLogo,
  customLogoUrl,
}: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(startInRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);
  
  // Registration fields
  const [artisticName, setArtisticName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [genre, setGenre] = useState('Sertanejo');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [userType, setUserType] = useState('Artista');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Missing Firestore document profile completion block
  const [isCompleteProfileMode, setIsCompleteProfileMode] = useState(false);
  const [pendingAuthUid, setPendingAuthUid] = useState('');
  const [pendingAuthEmail, setPendingAuthEmail] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');

    const emailValue = email.trim();
    if (!emailValue) {
      setErrorMsg('Digite seu e-mail para recuperar a senha.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setErrorMsg('Digite um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      auth.languageCode = 'pt-BR';
      await sendPasswordResetEmail(auth, emailValue.toLowerCase());
      setSuccessMsg('Se existir uma conta cadastrada com este e-mail, enviaremos um link para redefinir sua senha. Verifique também a caixa de spam.');
    } catch (error: any) {
      console.error("Erro ao enviar recuperação de senha:", error);
      if (error.code === 'auth/user-not-found') {
        // Neutrally handle user-not-found to prevent user enumeration
        setSuccessMsg('Se existir uma conta cadastrada com este e-mail, enviaremos um link para redefinir sua senha. Verifique também a caixa de spam.');
      } else {
        let msg = 'Não foi possível enviar o e-mail de recuperação. Tente novamente.';
        if (error.code === 'auth/invalid-email') {
          msg = 'Digite um e-mail válido.';
        } else if (error.code === 'auth/too-many-requests') {
          msg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        }
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsRegister(startInRegister);
    setIsGoogleFlow(false);
    setIsCompleteProfileMode(false);
  }, [startInRegister]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (isRegister) {
      if (!artisticName.trim()) {
        setErrorMsg('O Nome Artístico ou nome do cliente é obrigatório.');
        return;
      }
      if (!whatsapp.trim()) {
        setErrorMsg('WhatsApp de contato é obrigatório.');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('Cidade é obrigatória.');
        return;
      }
      if (!state.trim()) {
        setErrorMsg('Estado é obrigatório.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Use uma senha com pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }

      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      } catch (authErr: any) {
        console.warn("Firebase Registration Auth: ", authErr);
        let msg = 'Erro ao realizar cadastro. Tente outro e-mail.';
        const errStr = (authErr.code || authErr.message || '').toLowerCase();
        if (errStr.includes('email-already-in-use')) {
          msg = 'Este e-mail já possui uma conta.';
        } else if (errStr.includes('weak-password')) {
          msg = 'Use uma senha com pelo menos 6 caracteres.';
        } else if (authErr.message) {
          msg = authErr.message;
        }
        setErrorMsg(msg);
        return;
      }

      try {
        const uid = userCredential.user.uid;
        await userCredential.user.getIdToken(true);

        const profileData: Partial<Artist> = {
          name: artisticName.trim(),
          artistName: artisticName.trim(),
          email: email.trim().toLowerCase(),
          whatsapp: whatsapp.trim().replace(/\D/g, ''),
          phone: whatsapp.trim().replace(/\D/g, ''),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          mainGenre: genre,
          instagram: instagram.trim().replace(/@/g, ''),
          userType: userType,
        };

        const registeredProfile = await dbService.registerUserInFirestore(uid, profileData);
        
        setSuccessAnimation(true);
        setTimeout(() => {
          onLoginSuccess(registeredProfile);
        }, 1200);

      } catch (err: any) {
        console.warn("Firebase Registration Firestore: ", err);
        let msg = 'Conta criada no login, mas falhou ao salvar o perfil no banco de dados.';
        if (err.message && (err.message.includes('permission') || err.message.includes('insufficient permissions'))) {
          msg = 'Não foi possível salvar seu perfil. Verifique as regras do Firestore.';
        }
        setErrorMsg(msg);
      }

    } else {
      // Login flow
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        const user = userCredential.user;

        // Fetch user from Firestore 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isBlocked) {
            setErrorMsg('Sua conta está temporariamente bloqueada. Fale com o suporte.');
            return;
          }

          const resolvedEmail = (userData.email || email.trim().toLowerCase()).trim();
          const isMainAdmin = resolvedEmail.toLowerCase() === 'videopremieroficial@gmail.com' || resolvedEmail.toLowerCase() === 'sertanejopremier@gmail.com';
          
          // Build local Artist profile object from Firestore fields
          const loggedArtist: Artist = {
            userId: user.uid,
            name: userData.artistName || userData.name || 'Artista',
            artistName: userData.artistName || userData.name || 'Artista',
            email: resolvedEmail,
            whatsapp: userData.whatsapp || userData.phone || '',
            phone: userData.phone || userData.whatsapp || '',
            city: userData.city || '',
            state: userData.state || '',
            mainGenre: userData.mainGenre || userData.genre || 'Sertanejo',
            genre: userData.genre || userData.mainGenre || 'Sertanejo',
            instagram: userData.instagram || '',
            userType: userData.userType || 'Artista',
            role: isMainAdmin ? 'admin' : (userData.role || 'user'),
            plan: userData.plan || 'free',
            paymentStatus: userData.paymentStatus || 'inactive',
            accessType: userData.accessType || 'free',
            musicLimit: userData.musicLimit || 3,
            songsCount: userData.songsCount || 0,
            createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt || new Date().toISOString(),
            updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt || new Date().toISOString(),
          };

          dbService.setCurrentUser(loggedArtist);
          setSuccessAnimation(true);
          setTimeout(() => {
            onLoginSuccess(loggedArtist);
          }, 1200);

        } else {
          // Se o usuário logado ainda não tiver documento no Firestore, transicionamos para o modo "Complete seu cadastro"
          setPendingAuthUid(user.uid);
          setPendingAuthEmail(user.email || email.trim().toLowerCase());
          setIsCompleteProfileMode(true);
        }

      } catch (err: any) {
        console.warn("Firebase Login: ", err);
        const errStr = (err.code || err.message || '').toLowerCase();

        let msg = 'E-mail ou senha incorretos.';
        if (
          errStr.includes('invalid-credential') ||
          errStr.includes('wrong-password') ||
          errStr.includes('user-not-found') ||
          errStr.includes('invalid-email')
        ) {
          msg = 'E-mail ou senha incorretos.';
        } else if (err.message) {
          msg = err.message;
        }
        setErrorMsg(msg);
      }
    }
  };

  const signInGoogle = async () => {
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setIsGoogleFlow(true);
      
      // Update states with real Google account data
      setEmail(user.email || '');
      setArtisticName(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
      setPendingAuthUid(user.uid);
      setPendingAuthEmail(user.email || '');
      
      // Check if this user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isBlocked) {
          setErrorMsg('Sua conta está temporariamente bloqueada. Fale com o suporte.');
          setIsGoogleFlow(false);
          return;
        }
        
        const resolvedEmail = (userData.email || user.email || '').trim();
        const isMainAdmin = resolvedEmail.toLowerCase() === 'videopremieroficial@gmail.com' || resolvedEmail.toLowerCase() === 'sertanejopremier@gmail.com';

        // Build local Artist profile object from Firestore fields
        const loggedArtist: Artist = {
          userId: user.uid,
          name: userData.artistName || userData.name || 'Artista',
          artistName: userData.artistName || userData.name || 'Artista',
          email: resolvedEmail,
          whatsapp: userData.whatsapp || userData.phone || '',
          phone: userData.phone || userData.whatsapp || '',
          city: userData.city || '',
          state: userData.state || '',
          mainGenre: userData.mainGenre || userData.genre || 'Sertanejo',
          genre: userData.genre || userData.mainGenre || 'Sertanejo',
          instagram: userData.instagram || '',
          userType: userData.userType || 'Artista',
          role: isMainAdmin ? 'admin' : (userData.role || 'user'),
          plan: userData.plan || 'free',
          paymentStatus: userData.paymentStatus || 'inactive',
          accessType: userData.accessType || 'free',
          musicLimit: userData.musicLimit || 3,
          songsCount: userData.songsCount || 0,
          createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt || new Date().toISOString(),
        };

        dbService.setCurrentUser(loggedArtist);
        setSuccessAnimation(true);
        setTimeout(() => {
          onLoginSuccess(loggedArtist);
        }, 1200);
      } else {
        // User profile does not exist yet. Let them complete the form!
        setWhatsapp('');
        setCity('');
        setState('');
      }
    } catch (err: any) {
      console.warn("Google login: ", err);
      // Reset state so we don't present a fake/broken Google state with blank/missing fields
      setIsGoogleFlow(false);
      
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/user-cancelled' || err.message?.includes('closed') || err.message?.includes('cancelled') || err.message?.includes('Popup')) {
        setErrorMsg('O login com o Google foi fechado ou cancelado. Se o pop-up foi bloqueado pelo seu navegador, clique em abrir em uma nova aba no topo para logar com o Google, ou preencha o cadastro/login comum por e-mail e senha abaixo.');
      } else {
        setErrorMsg(`Erro na autenticação do Google: ${err.message || 'Erro de rede ou permissão'}. Você pode utilizar o cadastro padrão por e-mail e senha abaixo.`);
      }
    }
  };

  const handleGoogleCompleteSubmit = async (e: React.FormEvent) => {
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
    if (!city.trim()) {
      setErrorMsg('Cidade é obrigatória.');
      return;
    }
    if (!state.trim()) {
      setErrorMsg('Estado é obrigatório.');
      return;
    }

    const cleanedWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanedWhatsapp.length < 10) {
      setErrorMsg('Por favor, digite um número de WhatsApp com DDD válido.');
      return;
    }

    try {
      // Use logged Google uid if available, otherwise fallback on a safe tracking ID
      const targetUid = pendingAuthUid || auth.currentUser?.uid || `google-${Math.floor(Math.random() * 89999) + 10000}`;

      const profileData: Partial<Artist> = {
        name: artisticName.trim(),
        artistName: artisticName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: cleanedWhatsapp,
        phone: cleanedWhatsapp,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        mainGenre: genre,
        instagram: instagram.trim().replace(/@/g, ''),
        userType: 'Artista',
      };

      const registeredProfile = await dbService.registerUserInFirestore(targetUid, profileData);
      
      setSuccessAnimation(true);
      setTimeout(() => {
        onLoginSuccess(registeredProfile);
      }, 1200);

    } catch (err: any) {
      console.warn("Google profile save: ", err);
      setErrorMsg(err.message || 'Erro ao finalizar cadastro pelo Google.');
    }
  };

  const handleCompleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!artisticName.trim()) {
      setErrorMsg('O Nome Artístico ou nome do cliente é obrigatório.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg('WhatsApp de contato é obrigatório.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Cidade é obrigatória.');
      return;
    }
    if (!state.trim()) {
      setErrorMsg('Estado é obrigatório.');
      return;
    }

    try {
      const profileData: Partial<Artist> = {
        name: artisticName.trim(),
        artistName: artisticName.trim(),
        email: pendingAuthEmail || email.trim().toLowerCase(),
        whatsapp: whatsapp.trim().replace(/\D/g, ''),
        phone: whatsapp.trim().replace(/\D/g, ''),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        mainGenre: genre,
        instagram: instagram.trim().replace(/@/g, ''),
        userType: userType,
      };

      const registeredProfile = await dbService.registerUserInFirestore(pendingAuthUid, profileData);

      setSuccessAnimation(true);
      setTimeout(() => {
        onLoginSuccess(registeredProfile);
      }, 1200);

    } catch (err: any) {
      console.warn("Complete Profile: ", err);
      setErrorMsg(err.message || 'Erro ao finalizar cadastro.');
    }
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
        ) : isCompleteProfileMode ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex p-3 bg-orange-955/45 border border-orange-500/20 rounded-2xl mb-4 text-orange-400 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-heading font-black tracking-tight uppercase">
                Complete Seu Cadastro
              </h2>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Falta muito pouco! Preencha as informações obrigatórias abaixo para ativar sua conta e acessar seu SomDrive grátis:
              </p>
            </div>

            {errorMsg && (
              <div id="complete-profile-error" className="p-3 bg-red-950 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome Artístico / Cliente <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="comp-artist-name"
                      required
                      type="text" 
                      placeholder="Ex: Lara & Gabriel"
                      value={artisticName}
                      onChange={(e) => setArtisticName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Tipo de Usuário <span className="text-red-500">*</span></label>
                  <select 
                    id="comp-user-type"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition"
                  >
                    <option value="Compositor">Compositor</option>
                    <option value="Artista">Artista</option>
                    <option value="Produtor">Produtor</option>
                    <option value="Escritório musical">Escritório musical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Principal <span className="text-red-500">*</span></label>
                  <select 
                    id="comp-music-genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition animate-pulse-border"
                  >
                    <option value="Sertanejo Universitário">Sertanejo Universitário</option>
                    <option value="Sertanejo Raiz">Sertanejo Raiz</option>
                    <option value="Pagode / Samba">Pagode / Samba</option>
                    <option value="Forró / Xote">Forró / Xote</option>
                    <option value="MPB Tradicional">MPB Tradicional</option>
                    <option value="Gospel">Gospel</option>
                    <option value="Pop Rock">Pop Rock</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">WhatsApp de Contato <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="comp-whatsapp"
                      required
                      type="text" 
                      placeholder="DDD + WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="comp-city"
                      required
                      type="text" 
                      placeholder="Ex: Goiânia"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estado (UF) <span className="text-red-500">*</span></label>
                  <input 
                    id="comp-state"
                    required
                    maxLength={2}
                    type="text" 
                    placeholder="Ex: GO"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Instagram (Opcional)</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="comp-instagram"
                    type="text" 
                    placeholder="gabrielsilva_oficial"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              <button 
                id="complete-submit-btn"
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-sm font-heading font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-orange-500/10 transition text-slate-950 font-bold"
              >
                Salvar e Acessar Painel 🚀
              </button>
            </form>
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
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="google-reg-city"
                      required
                      type="text" 
                      placeholder="Ex: Goiânia"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estado (UF) <span className="text-red-500">*</span></label>
                  <input 
                    id="google-reg-state"
                    required
                    maxLength={2}
                    type="text" 
                    placeholder="Ex: GO"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Instagram (Opcional)</label>
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

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">E-mail Conectado <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="google-reg-email"
                      required
                      type="email" 
                      placeholder="voce@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-semibold"
                    />
                  </div>
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
        ) : isForgotPassword ? (
          <div className="space-y-6">
            {/* Header branding */}
            <div className="text-center animate-fade-in">
              <div className="inline-flex p-3 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-orange-400">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase text-orange-500">
                Recuperar Senha
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Insira o e-mail da sua conta para receber o link de recuperação.
              </p>
            </div>

            {errorMsg && (
              <div id="auth-error-msg" className="p-3 bg-red-952 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div id="auth-success-msg" className="p-3 bg-green-950 border border-green-500/40 text-green-300 text-xs font-mono rounded-xl text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Endereço de E-mail <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="reset-email-input"
                    required
                    type="email" 
                    disabled={isLoading}
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              <button 
                id="reset-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-sm font-heading font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-orange-500/10 transition-transform active:scale-98 select-none text-slate-950 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button 
                id="auth-back-to-login"
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                Voltar para o Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header branding */}
            <div className="text-center">
              <div className="mb-6 flex justify-center scale-102">
                <BrandLogo size="lg" scale={logoScale} showLogo={showLogo} customLogoUrl={customLogoUrl} />
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
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Nome Artístico ou Cliente <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-artist-name"
                          required
                          type="text" 
                          placeholder="Ex: Lara & Gabriel"
                          value={artisticName}
                          onChange={(e) => setArtisticName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Tipo de Usuário <span className="text-red-500">*</span></label>
                      <select 
                        id="reg-user-type"
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition"
                      >
                        <option value="Compositor">Compositor</option>
                        <option value="Artista">Artista</option>
                        <option value="Produtor">Produtor</option>
                        <option value="Escritório musical">Escritório musical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estilo Principal <span className="text-red-500">*</span></label>
                      <select 
                        id="reg-music-genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-slate-300 transition"
                      >
                        <option value="Sertanejo Universitário">Sertanejo Universitário</option>
                        <option value="Sertanejo Raiz">Sertanejo Raiz</option>
                        <option value="Pagode / Samba">Pagode / Samba</option>
                        <option value="Forró / Xote">Forró / Xote</option>
                        <option value="MPB Tradicional">MPB Tradicional</option>
                        <option value="Gospel">Gospel</option>
                        <option value="Pop Rock">Pop Rock</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">WhatsApp de Contato <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-whatsapp"
                          required
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
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Cidade <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input 
                          id="reg-city"
                          required
                          type="text" 
                          placeholder="Ex: Goiânia"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Estado (UF) <span className="text-red-500">*</span></label>
                      <input 
                        id="reg-state"
                        required
                        maxLength={2}
                        type="text" 
                        placeholder="Ex: GO"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Instagram (Opcional)</label>
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
                </div>
              )}

              {/* Core Login/Register Credentials */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Endereço de E-mail <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    id="auth-email-input"
                    required
                    type="email" 
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Senha <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      id="auth-password-input"
                      required
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isRegister ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">Confirmar Senha <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input 
                        id="auth-confirm-password-input"
                        required
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-orange-500 outline-none text-white transition animate-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                        title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:block"></div>
                )}
              </div>

              {!isRegister && (
                <div className="flex justify-end pt-1">
                  <button
                    id="auth-forgot-password-link"
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium cursor-pointer underline underline-offset-2"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <button 
                id="auth-submit-btn"
                type="submit"
                className="w-full py-4 mt-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-xl text-sm font-heading font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-orange-500/10 transition-transform active:scale-98 select-none text-slate-950"
              >
                {isRegister ? 'Criar Meu SomDrive Grátis' : 'Entrar no Painel'}
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
