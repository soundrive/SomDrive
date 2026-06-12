import { Artist, Music, Analytics, PaymentSettings, ShareCardSettings, AppearanceSettings } from '../types';

// Static Royalty-Free MP3 links that are reliable and beautiful
export const DEMO_SONGS = [
  {
    title: "Vento da Alvorada",
    composer: "Gabriel Silva",
    singer: "Lara & Gabriel",
    genre: "Sertanejo Acústico",
    description: "Uma melodia suave gravada ao vivo em Goiânia com arranjo de viola caipira.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Coração de Pedra",
    composer: "Mariana Souza",
    singer: "Grupo Sentimento",
    genre: "Pagode / Samba",
    description: "Samba raiz acelerado, com coro marcante e pandeiro orgânico gravado no Rio.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Noites do Nordeste",
    composer: "Raimundo Sanfoneiro",
    singer: "Trio Asa Branca",
    genre: "Forró / Xote",
    description: "Xote tradicional nordestino perfeito para dançar agarradinho e ouvir no som do carro.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Horizonte Neon",
    composer: "Carlos B.",
    singer: "Carlos B. & Banda",
    genre: "MPB / Pop",
    description: "Uma fusão de MPB moderna com sintetizadores retro. Eleita melhor composição autoral.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
  },
  {
    title: "Teus Olhos Claros",
    composer: "Paula Teixeira",
    singer: "Paula Teixeira",
    genre: "Pop / Acústico",
    description: "Voz e violão intimista, com letra romântica de arrancar suspiros.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
  }
];

export const DEMO_ARTIST: Artist = {
  userId: "gabriel-silva",
  name: "Gabriel Silva",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  city: "Goiânia - GO",
  genre: "Sertanejo / MPB",
  whatsapp: "5562999999999",
  instagram: "gabrielsilva_oficial",
  email: "gabrielsilva@gmail.com",
  bio: "Compositor há mais de 10 anos, escrevendo hits sertanejos e modas de viola exclusivas para artistas profissionais e contratantes de todo o Brasil.",
  plan: "free",
  createdAt: new Date().toISOString(),
};

export const DEMO_LYRICS = [
  `[Refrão]
Vento da alvorada leva essa dor de mim
Sopra no meu peito, diz que não é o fim
Se ela foi embora, traz de volta a flor
Que plantou sementes desse nosso amor

[Verso 1]
Madrugada fria na minha janela
Eu fico sonhando com os abraços dela
O violão em notas chora de saudade
Vento da manhã, traga a felicidade

[Verso 2]
Sei que eu errei, mas posso consertar
Essa noite inteira eu só quis te amar
O sereno cai e molha meu quintal
Vem curar de vez esse meu vendaval`,

  `[Verso 1]
Você me disse que tinha sentimento
Mas esfriou igual o sopro do vento
Deixou meu violão calado no canto
E transformou em cinzas todo esse meu tanto

[Refrão]
Esse seu coração de pedra não quer amolecer
Já procurei mil formas para te esquecer
Mas toda moda boa que eu resolvo tocar
Me lembra os seus beijos e me faz chorar

[Verso 2]
Agora eu bebo ouvindo rádio antigo
Tentando achar um rumo pra falar contigo
Mas sei que no seu peito não mora ninguém
Coração de pedra que não quer meu bem`,

  `[Verso 1]
Sob a lua do sertão azul brilhante
Eu vi seu rosto lindo num instante
Peguei minha sanfona para te cantar
E nas noites do Nordeste te conquistar

[Refrão]
Xote mareado, balanço gostoso
Te abraçar de canto é tão fervoroso
Arrasta o pé no chão, poeira vai subir
Ao som do sanfoneiro que nos faz sorrir

[Verso 2]
Se a noite tá fria, a gente faz esquentar
No aconchego desse fogo de luar
Não me deixe sozinho antes do sol nascer
Noites do Nordeste eu amo com você`,

  `[Verso 1]
Na imensidão de prédios sob o céu cinzento
Eu busco um sinal seu a cada momento
O asfalto reflete a pressa de chegar
Mas meu pensamento quer te encontrar

[Refrão]
O horizonte neon brilha na nossa cor
Pinta a cidade com as cores do amor
Atravessei a ponte só pra te dizer
Em meio a luzes mil, eu prefiro você

[Verso 2]
As estações passam e o trem não quer parar
A noite me convida para te encontrar
Compositores contam nossa história real
Em uma melodia doce e sem igual`,

  `[Verso 1]
A luz do sol que bate na sua janela
Mostra como a vida perto de você é bela
Acústico suave no som de um violão
É a melodia certa pro meu coração

[Refrão]
Teus olhos claros brilham mais que o sol
Me guiam no escuro feito um farol
E toda canção que eu escrevo pensado em ti
Diz que o mundo é lindo quando te vê sorrir

[Verso 2]
Palavras são poucas para descrever
A paz imensa de te ver crescer
Dentro dos meus sonhos você é o refrão
A nota perfeita da minha canção`
];

// Initial system seed state
const INITIAL_ARTISTS: Record<string, Artist> = {};

const INITIAL_MUSICS: Record<string, Music[]> = {};

const INITIAL_ANALYTICS: Record<string, Analytics> = {};

// Keys for standard local storage key-value tables
export const LS_ARTISTS = "pendrive_artists";
export const LS_MUSICS = "pendrive_musics";
export const LS_ANALYTICS = "pendrive_analytics";
export const LS_CURR_USER = "pendrive_curr_user";

// Clear old demo account if found in localStorage to avoid stale cached view
if (localStorage.getItem(LS_CURR_USER)) {
  try {
    const user = JSON.parse(localStorage.getItem(LS_CURR_USER) || "{}");
    if (user.userId === 'gabriel-silva' || user.email === 'gabriel.silva@somdrive.com' || user.name === 'Gabriel Silva') {
      localStorage.removeItem(LS_CURR_USER);
    }
  } catch (e) {
    localStorage.removeItem(LS_CURR_USER);
  }
}

// Seed local storage with base tables if empty or contains old demo tags
if (!localStorage.getItem(LS_ARTISTS) || localStorage.getItem(LS_ARTISTS)?.includes("gabriel-silva")) {
  localStorage.setItem(LS_ARTISTS, JSON.stringify(INITIAL_ARTISTS));
}
if (!localStorage.getItem(LS_MUSICS) || localStorage.getItem(LS_MUSICS)?.includes("gabriel-silva")) {
  localStorage.setItem(LS_MUSICS, JSON.stringify(INITIAL_MUSICS));
}
if (!localStorage.getItem(LS_ANALYTICS) || localStorage.getItem(LS_ANALYTICS)?.includes("gabriel-silva")) {
  localStorage.setItem(LS_ANALYTICS, JSON.stringify(INITIAL_ANALYTICS));
}

// Firebase imports
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  Timestamp,
  serverTimestamp,
  query,
  where,
  updateDoc,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from './firebase';
import { signInAnonymously } from 'firebase/auth';

// Database Actions Layer
export const dbService = {
  // Normalize and prepare user object mapping users/{userId} properties
  getNormalizedUserData(artist: Artist, songsCount = 0) {
    const defaultLimit = artist.plan === 'free' ? 5 : (artist.plan === 'pro' ? 15 : 50);
    const plan = artist.plan || 'free';
    const emailLower = (artist.email || '').toLowerCase().trim();
    const isMainAdmin = emailLower === 'videopremieroficial@gmail.com' || emailLower === 'sertanejopremier@gmail.com';

    const nameToSlug = (artist.name || artist.artistName || "artista").trim();
    const cleanSlug = artist.slug || nameToSlug
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      uid: artist.userId,
      email: artist.email || '',
      artistName: artist.artistName || artist.name || '',
      slug: cleanSlug,
      whatsapp: artist.whatsapp || artist.phone || '',
      phone: artist.phone || artist.whatsapp || '',
      instagram: artist.instagram || '',
      avatarUrl: artist.avatarUrl || artist.photoURL || artist.profileImageUrl || '',
      photoURL: artist.photoURL || artist.avatarUrl || artist.profileImageUrl || '',
      profileImageUrl: artist.profileImageUrl || artist.avatarUrl || artist.photoURL || '',
      city: artist.city || '',
      state: artist.state || '',
      role: isMainAdmin ? 'admin' : (artist.role || 'user'),
      plan: plan,
      paymentStatus: artist.paymentStatus || (plan !== 'free' ? 'manual' : 'inactive'),
      accessType: artist.accessType || (plan !== 'free' ? 'trial' : 'free'),
      musicLimit: artist.musicLimit !== undefined ? artist.musicLimit : defaultLimit,
      songsCount: songsCount,
      userType: artist.userType || 'Artista',
      mainGenre: artist.mainGenre || artist.genre || '',
      totalPlays: 0,
      totalViews: 0,
      whatsappClicks: 0,
      trialEndsAt: artist.trialEndsAt || null,
      manualAccessEndsAt: artist.manualAccessEndsAt || null,
      subscriptionStartedAt: artist.subscriptionStartedAt || null,
      subscriptionEndsAt: artist.subscriptionEndsAt || null,
      mercadoPagoPaymentId: artist.mercadoPagoPaymentId || null,
      mercadoPagoSubscriptionId: artist.mercadoPagoSubscriptionId || null,
      isBlocked: artist.isBlocked || false,
      createdAt: artist.createdAt || new Date().toISOString(),
      updatedAt: artist.updatedAt || new Date().toISOString()
    };
  },

  // Automated checks for expired trials or manual subscriptions
  checkAndRevertExpiredAccess(artist: Artist): Artist {
    let changed = false;
    const now = new Date();
    const updated: Artist = { ...artist };

    // Set defaults if absent
    if (updated.isBlocked === undefined) updated.isBlocked = false;
    const emailLower = (updated.email || '').toLowerCase().trim();
    if (emailLower === 'videopremieroficial@gmail.com' || emailLower === 'sertanejopremier@gmail.com') {
      updated.role = 'admin';
    } else if (!updated.role) {
      updated.role = 'user';
    }

    if (updated.accessType === 'trial' && updated.trialEndsAt) {
      if (new Date(updated.trialEndsAt) < now) {
        updated.plan = 'free';
        updated.musicLimit = 5;
        updated.paymentStatus = 'inactive';
        updated.accessType = 'free';
        updated.updatedAt = now.toISOString();
        changed = true;
      }
    } else if (updated.accessType === 'manual' && updated.manualAccessEndsAt) {
      if (new Date(updated.manualAccessEndsAt) < now) {
        updated.plan = 'free';
        updated.musicLimit = 5;
        updated.paymentStatus = 'inactive';
        updated.accessType = 'free';
        updated.updatedAt = now.toISOString();
        changed = true;
      }
    }

    if (changed) {
      this.updateArtistProfileLocallyAndFirestore(updated.userId, updated);
    }

    return updated;
  },

  // Active signed-in artist session state
  getCurrentUser(): Artist | null {
    const u = localStorage.getItem(LS_CURR_USER);
    if (!u) return null;
    try {
      const parsed = JSON.parse(u) as Artist;
      return this.checkAndRevertExpiredAccess(parsed);
    } catch {
      return null;
    }
  },

  setCurrentUser(artist: Artist | null) {
    if (artist) {
      // Run automatic access expiration check
      const checkedArtist = this.checkAndRevertExpiredAccess(artist);
      localStorage.setItem(LS_CURR_USER, JSON.stringify(checkedArtist));
      
      const artists = this.getAllArtists();
      artists[checkedArtist.userId] = checkedArtist;
      localStorage.setItem(LS_ARTISTS, JSON.stringify(artists));

      // Async write to Firestore - both artists and users!
      this.updateArtistProfileLocallyAndFirestore(checkedArtist.userId, checkedArtist);
    } else {
      localStorage.removeItem(LS_CURR_USER);
    }
  },

  getAllArtists(): Record<string, Artist> {
    const raw = localStorage.getItem(LS_ARTISTS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  getArtist(id: string): Artist | null {
    const normalized = id.toLowerCase().trim();
    const artists = this.getAllArtists();
    
    // Exact or slugged search (replacing accents/spaces)
    const found = (Object.values(artists) as Artist[]).find((art: Artist) => {
      const artSlugField = (art.slug || "").toLowerCase().trim();
      const artSlug = art.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const uriSlug = art.userId.toLowerCase();
      return artSlugField === normalized || artSlug === normalized || uriSlug === normalized || art.userId === id;
    });

    const artistToReturn = found || artists[id] || null;
    if (artistToReturn) {
      return this.checkAndRevertExpiredAccess(artistToReturn);
    }
    return null;
  },

  updateArtistProfile(id: string, updated: Partial<Artist>): Artist {
    const artists = this.getAllArtists();
    const existing = artists[id] || {
      userId: id,
      name: updated.name || "Artista Desconhecido",
      email: updated.email || "artist@gmail.com",
      plan: "free",
      createdAt: new Date().toISOString()
    };
    
    const saved: Artist = { ...existing, ...updated, updatedAt: new Date().toISOString() };
    
    if (updated.name) {
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
      saved.artistName = updated.name;
      saved.slug = slugifyStr(updated.name);
    }

    artists[id] = saved;
    localStorage.setItem(LS_ARTISTS, JSON.stringify(artists));
    
    // If current artist is the edited one, sync session state too
    const curr = this.getCurrentUser();
    if (curr && curr.userId === id) {
      localStorage.setItem(LS_CURR_USER, JSON.stringify(saved));
    }

    // Sync to Firestore in background (revisits both artists and users)
    this.updateArtistProfileLocallyAndFirestore(id, saved);

    return saved;
  },

  async registerUserInFirestore(uid: string, data: Partial<Artist>): Promise<Artist> {
    const defaultLimit = 5; // free limit
    const nowISO = new Date().toISOString();
    const emailLower = (data.email || '').toLowerCase().trim();
    const isMainAdmin = emailLower === 'videopremieroficial@gmail.com' || emailLower === 'sertanejopremier@gmail.com';
    const role = isMainAdmin ? 'admin' : 'user';
    
    // Build a clean Artist profile
    const newProfile: Artist = {
      userId: uid,
      name: data.artistName || data.name || 'Artista',
      artistName: data.artistName || data.name || 'Artista',
      email: data.email || '',
      whatsapp: data.whatsapp || '',
      phone: data.whatsapp || '',
      city: data.city || '',
      state: data.state || '',
      mainGenre: data.mainGenre || 'Sertanejo',
      genre: data.mainGenre || 'Sertanejo',
      instagram: data.instagram || '',
      userType: data.userType || 'Artista',
      role: role,
      plan: 'free',
      paymentStatus: 'inactive',
      accessType: 'free',
      musicLimit: defaultLimit,
      songsCount: 0,
      createdAt: nowISO,
      updatedAt: nowISO,
      isBlocked: false,
    };

    // Save locally
    const artists = this.getAllArtists();
    artists[uid] = newProfile;
    localStorage.setItem(LS_ARTISTS, JSON.stringify(artists));
    localStorage.setItem(LS_CURR_USER, JSON.stringify(newProfile));

    // Also initialize musics and analytics locally
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    musicsMap[uid] = [];
    localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

    const analyticsMap = JSON.parse(localStorage.getItem(LS_ANALYTICS) || "{}");
    analyticsMap[uid] = { artistId: uid, viewsCount: 0, whatsappClicks: 0 };
    localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsMap));

    // Dual-write to Firebase Firestore
    try {
      // 2. Antes de salvar no Firestore, garantir que o usuário está autenticado:
      if (auth.currentUser && auth.currentUser.uid === uid) {
        await auth.currentUser.getIdToken(true);
      }

      // 3. Salvar o perfil usando setDoc com merge true
      await setDoc(doc(db, "users", uid), {
        uid,
        email: newProfile.email,
        artistName: newProfile.artistName,
        userType: newProfile.userType,
        whatsapp: newProfile.whatsapp,
        city: newProfile.city,
        state: newProfile.state,
        mainGenre: newProfile.mainGenre,
        instagram: newProfile.instagram,
        role: role,
        plan: "free",
        musicLimit: 5,
        songsCount: 0,
        totalPlays: 0,
        totalViews: 0,
        whatsappClicks: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Write 'artists'
      await setDoc(doc(db, "artists", uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Write initial analytics
      await setDoc(doc(db, "artists", uid, "analytics", "metrics"), {
        artistId: uid,
        viewsCount: 0,
        whatsappClicks: 0
      }, { merge: true });

    } catch (e) {
      console.error("Firestore dual writing during registration failed: ", e);
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
    }

    return newProfile;
  },

  // Save changes to localStorage AND dual-write to Firestore (artists/{id} AND users/{id})
  updateArtistProfileLocallyAndFirestore(id: string, saved: Artist) {
    try {
      const musicCount = (this.getArtistMusics(id) || []).length;
      const normalizedUser = this.getNormalizedUserData(saved, musicCount);

      // Async write to 'artists' collection
      setDoc(doc(db, "artists", id), {
        ...saved,
        createdAt: Timestamp.fromDate(new Date(saved.createdAt))
      }, { merge: true }).catch(e => {
        console.error("Failed to sync updated profile to artists: ", e);
      });

      // Async write to 'users' collection with raw dates converted to Firestore timestamps
      setDoc(doc(db, "users", id), {
        ...normalizedUser,
        createdAt: Timestamp.fromDate(new Date(normalizedUser.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(normalizedUser.updatedAt)),
        trialEndsAt: normalizedUser.trialEndsAt ? Timestamp.fromDate(new Date(normalizedUser.trialEndsAt)) : null,
        manualAccessEndsAt: normalizedUser.manualAccessEndsAt ? Timestamp.fromDate(new Date(normalizedUser.manualAccessEndsAt)) : null,
        subscriptionStartedAt: normalizedUser.subscriptionStartedAt ? Timestamp.fromDate(new Date(normalizedUser.subscriptionStartedAt)) : null,
        subscriptionEndsAt: normalizedUser.subscriptionEndsAt ? Timestamp.fromDate(new Date(normalizedUser.subscriptionEndsAt)) : null,
      }, { merge: true }).catch(e => {
        console.error("Failed to sync updated profile to users: ", e);
      });
    } catch (e) {
      console.error("Firestore sync exception: ", e);
    }
  },

  // Ensure the admin was authenticated & registered in Firestore users collection
  async ensureAdminAuth(): Promise<void> {
    const localUserStr = localStorage.getItem(LS_CURR_USER);
    if (!localUserStr) return;
    
    try {
      const localUser = JSON.parse(localUserStr) as Artist;
      const emailLower = (localUser.email || '').toLowerCase().trim();
      
      if (emailLower === 'videopremieroficial@gmail.com' || emailLower === 'sertanejopremier@gmail.com') {
        const fireUser = auth.currentUser;
        // Verify real signed-in credentials match admin email
        const fireEmailLower = fireUser?.email?.toLowerCase().trim() || '';
        if (fireUser && (fireEmailLower === 'videopremieroficial@gmail.com' || fireEmailLower === 'sertanejopremier@gmail.com')) {
          let updatedUser = { ...localUser, role: 'admin' as const };
          let needsLocalSave = false;
          
          // Local index / userId mapping sync with current Auth UID
          if (localUser.userId !== fireUser.uid) {
            console.log(`Migrating admin local userId from '${localUser.userId}' to '${fireUser.uid}'`);
            const artists = this.getAllArtists();
            if (artists[localUser.userId]) {
              delete artists[localUser.userId];
            }
            
            updatedUser.userId = fireUser.uid;
            artists[fireUser.uid] = updatedUser;
            localStorage.setItem(LS_ARTISTS, JSON.stringify(artists));
            needsLocalSave = true;
          }
          
          if (localUser.role !== 'admin') {
            updatedUser.role = 'admin';
            needsLocalSave = true;
          }
          
          // Keep Firestore users role matching to satisfy isAdmin() check
          const usersTableRef = doc(db, 'users', fireUser.uid);
          const adminData = this.getNormalizedUserData(updatedUser);
          
          await setDoc(usersTableRef, {
            ...adminData,
            role: 'admin',
            createdAt: Timestamp.fromDate(new Date(updatedUser.createdAt)),
            updatedAt: Timestamp.fromDate(new Date())
          }, { merge: true });
          
          // Also sync to artists matching
          await setDoc(doc(db, 'artists', fireUser.uid), {
            ...updatedUser,
            role: 'admin',
            createdAt: Timestamp.fromDate(new Date(updatedUser.createdAt)),
            updatedAt: Timestamp.fromDate(new Date())
          }, { merge: true });
          
          if (needsLocalSave) {
            localStorage.setItem(LS_CURR_USER, JSON.stringify(updatedUser));
          }
        }
      }
    } catch (error) {
      console.warn("ensureAdminAuth skipped or failed: ", error);
    }
  },

  // Admin Area operations: Loads all user records
  async getAllUsersForAdmin(): Promise<Artist[]> {
    try {
      await this.ensureAdminAuth();
      
      let docsList: { id: string; data: any; source: 'users' | 'artists' }[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(docSnap => {
          docsList.push({ id: docSnap.id, data: docSnap.data(), source: 'users' });
        });
      } catch (err) {
        console.warn("Could not list 'users' collection due to permissions or configuration, trying public 'artists' collection:", err);
        try {
          const artistsSnap = await getDocs(collection(db, 'artists'));
          artistsSnap.forEach(docSnap => {
            docsList.push({ id: docSnap.id, data: docSnap.data(), source: 'artists' });
          });
        } catch (err2) {
          console.error("Could not list public 'artists' collection either:", err2);
          throw err2; // Let the outer catch handle it by falling back to localStorage
        }
      }

      const dbUsers: Artist[] = [];
      const localArtists = this.getAllArtists();

      docsList.forEach(item => {
        const d = item.data;
        const uid = item.id;
        
        let formattedUser: Artist = {
          userId: uid,
          name: d.name || d.artistName || 'Artista',
          email: d.email || '',
          whatsapp: d.whatsapp || d.phone || '',
          phone: d.phone || d.whatsapp || '',
          artistName: d.artistName || d.name || '',
          instagram: d.instagram || '',
          city: d.city || '',
          state: d.state || '',
          role: (d.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com' || d.email?.toLowerCase().trim() === 'sertanejopremier@gmail.com') ? 'admin' : (d.role || 'user'),
          plan: d.plan || 'free',
          paymentStatus: d.paymentStatus || 'inactive',
          accessType: d.accessType || 'free',
          musicLimit: d.musicLimit !== undefined ? d.musicLimit : (d.plan === 'free' ? 5 : (d.plan === 'pro' ? 15 : 50)),
          songsCount: d.songsCount !== undefined ? d.songsCount : 0,
          trialEndsAt: d.trialEndsAt instanceof Timestamp ? d.trialEndsAt.toDate().toISOString() : d.trialEndsAt || null,
          manualAccessEndsAt: d.manualAccessEndsAt instanceof Timestamp ? d.manualAccessEndsAt.toDate().toISOString() : d.manualAccessEndsAt || null,
          subscriptionStartedAt: d.subscriptionStartedAt instanceof Timestamp ? d.subscriptionStartedAt.toDate().toISOString() : d.subscriptionStartedAt || null,
          subscriptionEndsAt: d.subscriptionEndsAt instanceof Timestamp ? d.subscriptionEndsAt.toDate().toISOString() : d.subscriptionEndsAt || null,
          mercadoPagoPaymentId: d.mercadoPagoPaymentId || null,
          mercadoPagoSubscriptionId: d.mercadoPagoSubscriptionId || null,
          isBlocked: d.isBlocked || false,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt || new Date().toISOString(),
        };

        dbUsers.push(formattedUser);
      });

      // Merge local storage users if not in Firestore list
      const firestoreUids = new Set(dbUsers.map(u => u.userId));
      const mergedList = [...dbUsers];

      Object.values(localArtists).forEach((art: Artist) => {
        if (!firestoreUids.has(art.userId)) {
          const songsCount = (this.getArtistMusics(art.userId) || []).length;
          const norm = this.getNormalizedUserData(art, songsCount);
          mergedList.push(norm);
        }
      });

      const now = new Date();
      // Apply expiry check and return
      const finalList = mergedList.map(u => {
        let isExpired = false;
        const p = { ...u };

        if (p.accessType === 'trial' && p.trialEndsAt) {
          if (new Date(p.trialEndsAt) < now) {
            p.plan = 'free';
            p.musicLimit = 5;
            p.paymentStatus = 'inactive';
            p.accessType = 'free';
            p.updatedAt = now.toISOString();
            isExpired = true;
          }
        } else if (p.accessType === 'manual' && p.manualAccessEndsAt) {
          if (new Date(p.manualAccessEndsAt) < now) {
            p.plan = 'free';
            p.musicLimit = 5;
            p.paymentStatus = 'inactive';
            p.accessType = 'free';
            p.updatedAt = now.toISOString();
            isExpired = true;
          }
        }

        if (isExpired) {
          this.updateArtistProfileLocallyAndFirestore(p.userId, p);
        }

        return p;
      });

      return finalList;
    } catch (e) {
      console.warn("Exception retrieving Firestore users, returning localStorage content:", e);
      const localArtists = this.getAllArtists();
      return Object.values(localArtists).map((art: Artist) => {
        const songsCount = (this.getArtistMusics(art.userId) || []).length;
        const norm = this.getNormalizedUserData(art, songsCount);
        return this.checkAndRevertExpiredAccess(norm);
      });
    }
  },

  // Save admin updates directly
  async updateUserDataFromAdmin(userId: string, updatedFields: Partial<Artist>): Promise<void> {
    const artists = this.getAllArtists();
    const existing = artists[userId] || {
      userId,
      name: updatedFields.name || "Artista",
      email: updatedFields.email || "",
      plan: "free",
      createdAt: new Date().toISOString()
    };

    const saved: Artist = {
      ...existing,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    artists[userId] = saved;
    localStorage.setItem(LS_ARTISTS, JSON.stringify(artists));

    const curr = this.getCurrentUser();
    if (curr && curr.userId === userId) {
      localStorage.setItem(LS_CURR_USER, JSON.stringify(saved));
    }

    // Single write to local and Firestore dual target
    this.updateArtistProfileLocallyAndFirestore(userId, saved);
  },

  getTotalSongsCount(): number {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    let total = 0;
    Object.values(musicsMap).forEach((songsList: any) => {
      total += (songsList || []).length;
    });
    return total;
  },

  getArtistMusics(artistId: string): Music[] {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    
    // Resolve artistId if it is a slug
    let targetId = artistId;
    const artists = this.getAllArtists();
    const foundArtist = (Object.values(artists) as Artist[]).find((artList: Artist) => {
      const artSlugField = (artList.slug || "").toLowerCase().trim();
      const artSlugName = artList.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const inputSlug = artistId.toLowerCase().trim();
      return artSlugField === inputSlug || artSlugName === inputSlug || artList.userId === artistId;
    });
    if (foundArtist) {
      targetId = foundArtist.userId;
    }

    const tracks: Music[] = musicsMap[targetId] || musicsMap[artistId] || [];
    const sorted = tracks.map((t, idx) => {
      if (artistId === "gabriel-silva" && !t.lyrics) {
        return {
          ...t,
          lyrics: DEMO_LYRICS[idx] || ""
        };
      }
      return t;
    });
    return sorted.sort((a, b) => {
      const getPosVal = (t: Music) => {
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
    });
  },

  async saveMusicOrder(artistId: string, orderedTrackIds: string[]): Promise<void> {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    const tracks: Music[] = musicsMap[artistId] || [];

    const updatedTracks = tracks.map(track => {
      const newPos = orderedTrackIds.indexOf(track.trackId);
      const idxVal = newPos !== -1 ? newPos : 99999;
      return {
        ...track,
        position: idxVal,
        orderIndex: idxVal
      };
    });

    updatedTracks.sort((a, b) => {
      const valA = a.orderIndex ?? a.position ?? 99999;
      const valB = b.orderIndex ?? b.position ?? 99999;
      return valA - valB;
    });
    musicsMap[artistId] = updatedTracks;
    localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

    try {
      for (const track of updatedTracks) {
        const songRef = doc(db, 'songs', track.trackId);
        await updateDoc(songRef, { 
          position: track.orderIndex, 
          orderIndex: track.orderIndex 
        }).catch(() => {});

        const legacyRef = doc(db, 'artists', artistId, 'musics', track.trackId);
        await updateDoc(legacyRef, { 
          position: track.orderIndex, 
          orderIndex: track.orderIndex 
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Error committing track reorder to Firestore:", e);
    }
  },

  async findAudioFileByHash(hash: string): Promise<any | null> {
    try {
      const q = query(collection(db, 'audioFiles'), where('audioHash', '==', hash));
      const snap = await getDocs(q).catch(e => {
        handleFirestoreError(e, OperationType.GET, 'audioFiles');
        throw e;
      });
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error("Error in findAudioFileByHash:", e);
      return null;
    }
  },

  async createAudioFile(id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, 'audioFiles', id);
      await setDoc(docRef, {
        ...data,
        createdAt: Timestamp.fromDate(new Date())
      }).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `audioFiles/${id}`);
        throw e;
      });
    } catch (e) {
      console.error("Error in createAudioFile:", e);
      throw e;
    }
  },

  async incrementAudioFileUsage(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'audioFiles', id);
      await updateDoc(docRef, {
        usageCount: increment(1)
      }).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `audioFiles/${id}`);
        throw e;
      });
    } catch (e) {
      console.error("Error in incrementAudioFileUsage:", e);
      throw e;
    }
  },

  async addMusic(artistId: string, track: Omit<Music, 'playsCount' | 'createdAt'>): Promise<Music> {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    const tracks: Music[] = musicsMap[artistId] || [];

    const playsValue = track.plays !== undefined ? track.plays : 0;
    const performerValue = track.performer || track.singer || '';
    const statusValue = track.status || 'active';
    const storageProviderValue = track.storageProvider || 'cloudflare_r2';

    const initialIndex = tracks.length;

    const newTrack: Music = {
      ...track,
      playsCount: playsValue,
      plays: playsValue,
      status: statusValue,
      performer: performerValue,
      singer: track.singer || performerValue,
      storageProvider: storageProviderValue,
      position: track.position !== undefined ? track.position : initialIndex,
      orderIndex: track.orderIndex !== undefined ? track.orderIndex : initialIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tracks.push(newTrack);
    musicsMap[artistId] = tracks;
    localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

    // Wait for sync to Firestore
    try {
      const songPayload = {
        songId: newTrack.trackId,
        ownerId: newTrack.artistId,
        title: newTrack.title,
        composer: newTrack.composer || '',
        partners: newTrack.partners || '',
        performer: newTrack.performer || newTrack.singer || '',
        genre: newTrack.genre || '',
        lyrics: newTrack.lyrics || '',
        description: newTrack.description || '',
        audioFileId: newTrack.audioFileId || '',
        audioUrl: newTrack.audioUrl,
        storagePath: newTrack.storagePath || '',
        storageProvider: newTrack.storageProvider || 'cloudflare_r2',
        fileSize: newTrack.fileSize || 0,
        mimeType: newTrack.mimeType || 'audio/mpeg',
        originalFileName: newTrack.originalFileName || '',
        plays: playsValue,
        position: newTrack.orderIndex,
        orderIndex: newTrack.orderIndex,
        createdAt: Timestamp.fromDate(new Date(newTrack.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(newTrack.updatedAt || newTrack.createdAt))
      };

      // Write to new songs root collection
      await setDoc(doc(db, "songs", newTrack.trackId), songPayload, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `songs/${newTrack.trackId}`);
      });

      // Write to legacy artist musics subcollection of course for flawless compatibility
      const firestoreTrackPayload = {
        ...songPayload,
        id: newTrack.trackId,
        playsCount: playsValue,
        trackId: newTrack.trackId,
        artistId: newTrack.artistId,
        coverUrl: newTrack.coverUrl || '',
      };

      await setDoc(doc(db, "artists", artistId, "musics", newTrack.trackId), firestoreTrackPayload, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `artists/${artistId}/musics/${newTrack.trackId}`);
      });
    } catch (e: any) {
      console.error("erro ao salvar no Firestore:", e);
      throw e;
    }

    return newTrack;
  },

  incrementPlayCount(artistId: string, trackId: string): number {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    const tracks: Music[] = musicsMap[artistId] || [];
    
    const track = tracks.find(t => t.trackId === trackId);
    if (track) {
      track.playsCount += 1;
      if (track.plays !== undefined) {
        track.plays += 1;
      } else {
        track.plays = track.playsCount;
      }
      track.updatedAt = new Date().toISOString();
      musicsMap[artistId] = tracks;
      localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));
      
      // Update global plays in analytics table too
      this.incrementAnalyticsView(artistId, false, true);

      // Async sync specifically playsCount increment to Firestore
      try {
        setDoc(doc(db, "songs", trackId), {
          plays: track.plays,
          updatedAt: Timestamp.fromDate(new Date())
        }, { merge: true }).catch(e => {
          console.error(e);
          handleFirestoreError(e, OperationType.WRITE, `songs/${trackId}`);
        });

        setDoc(doc(db, "artists", artistId, "musics", trackId), {
          playsCount: track.playsCount,
          plays: track.plays,
          updatedAt: Timestamp.fromDate(new Date())
        }, { merge: true }).catch(e => {
          console.error(e);
          handleFirestoreError(e, OperationType.WRITE, `artists/${artistId}/musics/${trackId}`);
        });
      } catch (err) {
        console.error(err);
      }

      return track.playsCount;
    }
    return 0;
  },

  getAnalytics(artistId: string): Analytics {
    const analyticsMap = JSON.parse(localStorage.getItem(LS_ANALYTICS) || "{}");
    if (!analyticsMap[artistId]) {
      analyticsMap[artistId] = {
        artistId,
        viewsCount: 0,
        whatsappClicks: 0
      };
      localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsMap));
    }
    return analyticsMap[artistId];
  },

  incrementAnalyticsView(artistId: string, isProfileView = true, isPlayIncrement = false) {
    const analyticsMap = JSON.parse(localStorage.getItem(LS_ANALYTICS) || "{}");
    if (!analyticsMap[artistId]) {
      analyticsMap[artistId] = { artistId, viewsCount: 1, whatsappClicks: 0 };
    }
    
    if (isProfileView) {
      analyticsMap[artistId].viewsCount += 1;
    } else if (!isPlayIncrement) {
      analyticsMap[artistId].whatsappClicks += 1;
    }
    
    localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsMap));

    // Async sync updated analytics node to Firestore
    try {
      setDoc(doc(db, "artists", artistId, "analytics", "metrics"), {
        artistId,
        viewsCount: analyticsMap[artistId].viewsCount,
        whatsappClicks: analyticsMap[artistId].whatsappClicks
      }, { merge: true }).catch(e => {
        console.error(e);
        handleFirestoreError(e, OperationType.WRITE, `artists/${artistId}/analytics/metrics`);
      });
    } catch (e) {
      console.error(e);
    }
  },

  // ----------------------------------------------------
  // Highly robust on-demand Firestore synchronization
  // ----------------------------------------------------
  async syncArtistData(artistId: string): Promise<boolean> {
    try {
      const normalizedQuery = artistId.trim();
      let resolvedUserId = normalizedQuery;
      let artData: any = null;

      // Helper function to create clean slug
      const generateCleanSlug = (nameStr: string): string => {
        if (!nameStr) return "";
        return nameStr
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");
      };

      // 1. Try to find the document directly by ID in 'artists' collection
      const artistDocRef = doc(db, 'artists', normalizedQuery);
      const artistSnap = await getDoc(artistDocRef).catch(() => null);

      if (artistSnap && artistSnap.exists()) {
        artData = artistSnap.data();
        resolvedUserId = artData.userId || normalizedQuery;
      } else {
        // 2. Query 'artists' collection for slug
        const qArtists = query(collection(db, 'artists'), where('slug', '==', normalizedQuery));
        const snapArtists = await getDocs(qArtists).catch(() => null);
        if (snapArtists && !snapArtists.empty) {
          const docSnap = snapArtists.docs[0];
          artData = docSnap.data();
          resolvedUserId = artData.userId || docSnap.id;
        } else {
          // 3. Query 'users' collection for slug
          const qUsers = query(collection(db, 'users'), where('slug', '==', normalizedQuery));
          const snapUsers = await getDocs(qUsers).catch(() => null);
          if (snapUsers && !snapUsers.empty) {
            const docSnap = snapUsers.docs[0];
            artData = docSnap.data();
            resolvedUserId = artData.uid || artData.userId || docSnap.id;
          } else {
            // 4. Try direct get from 'users' collection too
            const userDocRef = doc(db, 'users', normalizedQuery);
            const userSnap = await getDoc(userDocRef).catch(() => null);
            if (userSnap && userSnap.exists()) {
              artData = userSnap.data();
              resolvedUserId = artData.uid || artData.userId || normalizedQuery;
            }
          }
        }
      }

      // If we found the artist data, load complete profile from 'artists/' + resolvedUserId
      if (resolvedUserId) {
        const fullArtistRef = doc(db, 'artists', resolvedUserId);
        const fullArtistSnap = await getDoc(fullArtistRef).catch(() => null);
        if (fullArtistSnap && fullArtistSnap.exists()) {
          artData = { ...artData, ...fullArtistSnap.data() };
        }

        // If no slug exists in the doc, generate and save it automatically!
        if (artData && !artData.slug) {
          const generatedSlug = generateCleanSlug(artData.name || artData.artistName || "artista");
          if (generatedSlug) {
            artData.slug = generatedSlug;
            
            // Save to 'artists'
            await setDoc(doc(db, "artists", resolvedUserId), { slug: generatedSlug }, { merge: true }).catch(err => {
              console.error("Failed to update auto slug in artists collection:", err);
            });

            // Save to 'users'
            await setDoc(doc(db, "users", resolvedUserId), { slug: generatedSlug }, { merge: true }).catch(err => {
              console.error("Failed to update auto slug in users collection:", err);
            });
          }
        }

        const formattedArtist: Artist = {
          userId: resolvedUserId,
          name: artData?.name || artData?.artistName || "Artista",
          artistName: artData?.artistName || artData?.name || "Artista",
          avatarUrl: artData?.avatarUrl || artData?.profileImageUrl || artData?.photoURL || "",
          profileImageUrl: artData?.profileImageUrl || artData?.avatarUrl || artData?.photoURL || "",
          photoURL: artData?.photoURL || artData?.avatarUrl || artData?.profileImageUrl || "",
          slug: artData?.slug || "",
          city: artData?.city || "",
          state: artData?.state || "",
          genre: artData?.genre || artData?.mainGenre || "",
          mainGenre: artData?.mainGenre || artData?.genre || "",
          whatsapp: artData?.whatsapp || artData?.phone || "",
          phone: artData?.phone || artData?.whatsapp || "",
          instagram: artData?.instagram || "",
          email: artData?.email || "",
          bio: artData?.bio || "",
          plan: artData?.plan || "free",
          subscriptionStatus: artData?.subscriptionStatus || "ativo",
          createdAt: artData?.createdAt instanceof Timestamp ? artData.createdAt.toDate().toISOString() : artData?.createdAt || new Date().toISOString()
        };

        // Cache artist profile in LocalStorage under BOTH resolvedUserId and slug for instant rendering
        const cachedArtists = this.getAllArtists();
        cachedArtists[resolvedUserId] = formattedArtist;
        if (formattedArtist.slug) {
          cachedArtists[formattedArtist.slug] = formattedArtist;
        }
        if (normalizedQuery !== resolvedUserId && normalizedQuery !== formattedArtist.slug) {
          cachedArtists[normalizedQuery] = formattedArtist;
        }
        localStorage.setItem(LS_ARTISTS, JSON.stringify(cachedArtists));

        const curr = this.getCurrentUser();
        if (curr && curr.userId === resolvedUserId) {
          localStorage.setItem(LS_CURR_USER, JSON.stringify(formattedArtist));
        }

        // Fetch songs from root 'songs' collection where ownerId == resolvedUserId
        let fetchedTracks: Music[] = [];
        const songsQuery = query(collection(db, 'songs'), where('ownerId', '==', resolvedUserId));
        const songsSnap = await getDocs(songsQuery).catch(e => {
          handleFirestoreError(e, OperationType.GET, 'songs');
          throw e;
        });

        if (songsSnap && !songsSnap.empty) {
          fetchedTracks = songsSnap.docs.map(docSnap => {
            const d = docSnap.data();
            return {
              trackId: docSnap.id || d.songId || d.trackId,
              artistId: d.ownerId || d.artistId || resolvedUserId,
              title: d.title,
              composer: d.composer || "",
              partners: d.partners || "",
              singer: d.performer || d.singer || "",
              performer: d.performer || d.singer || "",
              genre: d.genre || "",
              description: d.description || "",
              audioUrl: d.audioUrl,
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
              createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
              updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt || d.createdAt || new Date().toISOString()
            };
          });
        } else {
          // Fallback to legacy subcollection
          const musicsColRef = collection(db, 'artists', resolvedUserId, 'musics');
          const musicsSnap = await getDocs(musicsColRef).catch(e => {
            handleFirestoreError(e, OperationType.GET, `artists/${resolvedUserId}/musics`);
            throw e;
          });
          if (musicsSnap && !musicsSnap.empty) {
            fetchedTracks = musicsSnap.docs.map(docSnap => {
              const d = docSnap.data();
              return {
                trackId: d.trackId || d.id || docSnap.id,
                artistId: d.artistId || d.ownerId || resolvedUserId,
                title: d.title,
                composer: d.composer || "",
                partners: d.partners || "",
                singer: d.singer || d.performer || "",
                performer: d.performer || d.singer || "",
                genre: d.genre || "",
                description: d.description || "",
                audioUrl: d.audioUrl,
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
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
                updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt || d.createdAt || new Date().toISOString()
              };
            });

            // Automatically migrate these tracks to the root "songs" collection for future correctness
            for (const track of fetchedTracks) {
              const songDocRef = doc(db, 'songs', track.trackId);
              setDoc(songDocRef, {
                songId: track.trackId,
                ownerId: track.artistId,
                title: track.title,
                composer: track.composer || '',
                partners: track.partners || '',
                performer: track.performer || '',
                genre: track.genre || '',
                lyrics: track.lyrics || '',
                description: track.description || '',
                audioFileId: track.audioFileId || `migrated-${track.trackId}`,
                audioUrl: track.audioUrl,
                storagePath: track.storagePath || '',
                storageProvider: track.storageProvider || 'cloudflare_r2',
                fileSize: track.fileSize || 0,
                mimeType: track.mimeType || 'audio/mpeg',
                originalFileName: track.originalFileName || '',
                plays: track.plays !== undefined ? track.plays : 0,
                createdAt: Timestamp.fromDate(new Date(track.createdAt)),
                updatedAt: Timestamp.fromDate(new Date(track.updatedAt || track.createdAt))
              }, { merge: true }).catch(err => {
                console.error("Migration to songs collection failed: ", err);
              });
            }
          }
        }

        // Cache tracks
        const allMusics = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
        allMusics[resolvedUserId] = fetchedTracks;
        if (formattedArtist.slug) {
          allMusics[formattedArtist.slug] = fetchedTracks;
        }
        if (normalizedQuery !== resolvedUserId && normalizedQuery !== formattedArtist.slug) {
          allMusics[normalizedQuery] = fetchedTracks;
        }
        localStorage.setItem(LS_MUSICS, JSON.stringify(allMusics));

        // Fetch analytics
        const analyticsRef = doc(db, 'artists', resolvedUserId, 'analytics', 'metrics');
        const analyticsSnap = await getDoc(analyticsRef).catch(e => {
          handleFirestoreError(e, OperationType.GET, `artists/${resolvedUserId}/analytics/metrics`);
          throw e;
        });
        if (analyticsSnap && analyticsSnap.exists()) {
          const anData = analyticsSnap.data() as Analytics;
          const analyticsMap = JSON.parse(localStorage.getItem(LS_ANALYTICS) || "{}");
          analyticsMap[resolvedUserId] = anData;
          analyticsMap[normalizedQuery] = anData;
          if (formattedArtist.slug) {
            analyticsMap[formattedArtist.slug] = anData;
          }
          localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsMap));
        } else {
          const localAn = this.getAnalytics(resolvedUserId);
          setDoc(analyticsRef, localAn, { merge: true }).catch(() => {});
        }

        return true;
      }

      return false;
    } catch (e) {
      console.error("syncArtistData failed gracefully, preserving cached offline state: ", e);
      return false;
    }
  },

  // Firebase Storage File Upload
  async uploadFile(artistId: string, file: File, type: 'audio' | 'cover', progressCallback?: (prog: number) => void): Promise<string> {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9ms._-]/g, '').slice(-40);
      const uniqueId = `file-${Date.now()}-${Math.floor(Math.random() * 899) + 100}`;
      const folder = type === 'audio' ? 'songs' : 'covers';
      const storageRef = ref(storage, `artists/${artistId}/${folder}/${uniqueId}_${cleanName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      if (progressCallback) progressCallback(100);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Firebase Storage Upload Error:", error);
      throw error;
    }
  },

  // Cloudflare R2 Upload for Avatars/Profile Photos
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const mimeLower = file.type.toLowerCase();
    const nameLower = file.name.toLowerCase();
    const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
    const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");
    
    if (!isAcceptedMime && !isAcceptedExt) {
      const errMsg = "Formato de arquivo inválido. Apenas imagens nos formatos JPEG, PNG e WEBP são permitidas.";
      console.error("Formato Inválido ao subir avatar:", {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        userId
      });
      throw new Error(errMsg);
    }
    
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errMsg = "A imagem é muito grande. O limite máximo é de 2 MB.";
      console.error("Tamanho Excedido ao subir avatar:", {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        userId
      });
      throw new Error(errMsg);
    }

    let uploadUrl = "";
    let publicImageUrl = "";

    // 1. Obter URL presignada do R2
    try {
      const response = await fetch("/api/r2-presigned-image-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileType: file.type || "image/jpeg",
          fileSize: file.size,
          userId,
          fileName: file.name
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const resData = await response.json();
      uploadUrl = resData.uploadUrl;
      publicImageUrl = resData.publicImageUrl;
    } catch (err: any) {
      console.error("erro ao gerar URL R2", {
        error: err.message || String(err),
        userId,
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      });
      throw new Error("Não foi possível gerar a autorização de upload do R2.");
    }

    // 2. PUT da imagem para o R2 (usando a URL gerada)
    let usedProxy = false;
    try {
      console.log("Tentando upload direto (PUT) no R2 com pre-signed URL...");
      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg"
        },
        body: file
      });

      if (!putResponse.ok) {
        throw new Error(`HTTP status ${putResponse.status}`);
      }
      console.log("Upload direto com PUT concluído com sucesso.");
    } catch (err: any) {
      console.warn("Upload direto PUT falhou (provável CORS ou restrição de rede). Tentando rota proxy de contingência...", err);
      try {
        console.log("Iniciando fallback via proxy de imagem R2...");
        const proxyResponse = await fetch("/api/r2-proxy-image-upload", {
          method: "POST",
          headers: {
            "x-file-name": encodeURIComponent(file.name),
            "x-file-type": file.type || "image/jpeg",
            "x-file-size": String(file.size),
            "x-user-id": userId
          },
          body: file
        });

        if (!proxyResponse.ok) {
          const errData = await proxyResponse.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${proxyResponse.status}`);
        }

        const proxyData = await proxyResponse.json();
        publicImageUrl = proxyData.publicImageUrl;
        usedProxy = true;
        console.log("Upload via proxy de contingência realizado com sucesso:", publicImageUrl);
      } catch (proxyErr: any) {
        console.error("erro no PUT da imagem", {
          error: proxyErr.message || String(proxyErr),
          userId,
          file: {
            name: file.name,
            type: file.type,
            size: file.size
          }
        });
        throw new Error("Não foi possível enviar a imagem para o servidor de armazenamento.");
      }
    }

    // 3. Salvar no Firestore users/{userId} e artists/{userId}
    try {
      const userRef = doc(db, "users", userId);
      const artistRef = doc(db, "artists", userId);

      const updatePayload = {
        avatarUrl: publicImageUrl,
        photoURL: publicImageUrl,
        profileImageUrl: publicImageUrl,
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, updatePayload, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
        throw err;
      });

      await setDoc(artistRef, updatePayload, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `artists/${userId}`);
        throw err;
      });
    } catch (err: any) {
      console.error("erro ao salvar Firestore", {
        error: err.message || String(err),
        userId,
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      });
      throw new Error("Não foi possível salvar os caminhos da imagem no banco de dados.");
    }

    return publicImageUrl;
  },

  async deleteMusic(artistId: string, trackId: string): Promise<boolean> {
    try {
      // Async delete from firestore (both songs and artists subcol)
      const songDocRef = doc(db, 'songs', trackId);
      await deleteDoc(songDocRef).catch(e => {
        handleFirestoreError(e, OperationType.DELETE, `songs/${trackId}`);
        throw e;
      });

      const musicDocRef = doc(db, 'artists', artistId, 'musics', trackId);
      await deleteDoc(musicDocRef).catch(() => {
        // Fallback catch, the legacy record might not exist or failed, but don't block
      });

      // Local storage cleanup
      const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
      const currentList: Music[] = musicsMap[artistId] || [];
      const updatedList = currentList.filter(t => t.trackId !== trackId);
      musicsMap[artistId] = updatedList;
      localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

      return true;
    } catch (e) {
      console.error("Error deleting music:", e);
      return false;
    }
  },

  async toggleMusicStatus(artistId: string, trackId: string, currentStatus: string): Promise<string> {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const songDocRef = doc(db, 'songs', trackId);
      await setDoc(songDocRef, {
        status: nextStatus,
        updatedAt: Timestamp.fromDate(new Date())
      }, { merge: true }).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `songs/${trackId}`);
        throw e;
      });

      const musicDocRef = doc(db, 'artists', artistId, 'musics', trackId);
      await setDoc(musicDocRef, {
        status: nextStatus,
        updatedAt: Timestamp.fromDate(new Date())
      }, { merge: true }).catch(() => {
        // Legacy fallback
      });

      // Update locally
      const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
      const currentList: Music[] = musicsMap[artistId] || [];
      const updatedList = currentList.map(t => t.trackId === trackId ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t);
      musicsMap[artistId] = updatedList;
      localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

      return nextStatus;
    } catch (e) {
      console.error("Error toggling music status:", e);
      throw e;
    }
  },

  async updateMusic(artistId: string, trackId: string, updatedFields: Partial<Music>): Promise<Music> {
    try {
      // Local storage tables update
      const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
      const currentList: Music[] = musicsMap[artistId] || [];
      const updatedList = currentList.map(t => {
        if (t.trackId === trackId) {
          return {
            ...t,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      musicsMap[artistId] = updatedList;
      localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

      const updatedTrack = updatedList.find(t => t.trackId === trackId)!;

      // Firestore update in 'songs' collection
      const songsDocRef = doc(db, 'songs', trackId);
      const songsPayload: any = {
        title: updatedTrack.title,
        genre: updatedTrack.genre || '',
        composer: updatedTrack.composer || '',
        performer: updatedTrack.performer || updatedTrack.singer || '',
        singer: updatedTrack.singer || updatedTrack.performer || '',
        partners: updatedTrack.partners || '',
        description: updatedTrack.description || '',
        lyrics: updatedTrack.lyrics || '',
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      if (updatedTrack.coverUrl) {
        songsPayload.coverUrl = updatedTrack.coverUrl;
      }

      await setDoc(songsDocRef, songsPayload, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `songs/${trackId}`);
        throw err;
      });

      // Firestore update in parent subcollection for seamless UI compatibility
      const musicDocRef = doc(db, 'artists', artistId, 'musics', trackId);
      const legacyPayload = {
        ...songsPayload,
        playsCount: updatedTrack.playsCount,
        plays: updatedTrack.plays || updatedTrack.playsCount,
        id: trackId,
        trackId: trackId,
        artistId: artistId,
        coverUrl: updatedTrack.coverUrl || '',
      };
      await setDoc(musicDocRef, legacyPayload, { merge: true }).catch(() => {
        // Fallback for subcollection if it doesn't exist or is legacy
      });

      return updatedTrack;
    } catch (e) {
      console.error("Error updating music:", e);
      throw e;
    }
  },

  async getPaymentSettings(): Promise<PaymentSettings | null> {
    try {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PaymentSettings;
      }
      return null;
    } catch (e) {
      console.error("Error fetching payment settings:", e);
      return null;
    }
  },

  async updatePaymentSettings(settings: Partial<PaymentSettings>, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'payment');
      const dataToSave = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      };
      await setDoc(docRef, dataToSave, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/payment');
        throw err;
      });
    } catch (e) {
      console.error("Error updating payment settings:", e);
      throw e;
    }
  },

  async getShareCardSettings(): Promise<ShareCardSettings | null> {
    try {
      const docRef = doc(db, 'settings', 'shareCard');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ShareCardSettings;
      }
      return null;
    } catch (e) {
      console.error("Error fetching share card settings:", e);
      return null;
    }
  },

  async deleteShareCardSettings(updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'shareCard');
      const dataToSave = {
        ogImageUrl: "",
        ogImageVersion: String(Date.now()),
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      };
      await setDoc(docRef, dataToSave, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/shareCard');
        throw err;
      });
    } catch (e) {
      console.error("Error deleting share card settings:", e);
      throw e;
    }
  },

  async updateShareCardSettings(ogImageUrl: string, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'shareCard');
      const dataToSave = {
        ogImageUrl,
        ogImageVersion: String(Date.now()),
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      };
      await setDoc(docRef, dataToSave, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/shareCard');
        throw err;
      });
    } catch (e) {
      console.error("Error updating share card settings:", e);
      throw e;
    }
  },

  async getAppearanceSettings(): Promise<AppearanceSettings> {
    try {
      const docRef = doc(db, 'settings', 'appearance');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          logoScale: typeof data.logoScale === 'number' ? data.logoScale : 1.0,
          showLogo: typeof data.showLogo === 'boolean' ? data.showLogo : true,
          customLogoUrl: typeof data.customLogoUrl === 'string' ? data.customLogoUrl : '',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };
      }
      return { logoScale: 1.0, showLogo: true, customLogoUrl: '' };
    } catch (e) {
      console.error("Error fetching appearance settings:", e);
      return { logoScale: 1.0, showLogo: true, customLogoUrl: '' };
    }
  },

  async updateAppearanceSettings(settings: { logoScale?: number; showLogo?: boolean; customLogoUrl?: string }, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, 'settings', 'appearance');
      const dataToSave = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      };
      await setDoc(docRef, dataToSave, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/appearance');
        throw err;
      });
    } catch (e) {
      console.error("Error updating appearance settings:", e);
      throw e;
    }
  }
};
