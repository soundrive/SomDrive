import { Artist, Music, Analytics } from '../types';

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
    if (user.userId === 'gabriel-silva' || user.email === 'gabriel.silva@soundrive.com' || user.name === 'Gabriel Silva') {
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
  Timestamp 
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
    const isMainAdmin = emailLower === 'videopremieroficial@gmail.com';

    return {
      uid: artist.userId,
      email: artist.email || '',
      artistName: artist.artistName || artist.name || '',
      whatsapp: artist.whatsapp || artist.phone || '',
      phone: artist.phone || artist.whatsapp || '',
      instagram: artist.instagram || '',
      city: artist.city || '',
      state: artist.state || '',
      role: artist.role || (isMainAdmin ? 'admin' : 'user'),
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
    if (!updated.role) {
      if (updated.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com') {
        updated.role = 'admin';
      } else {
        updated.role = 'user';
      }
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
      const artSlug = art.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
      const uriSlug = art.userId.toLowerCase();
      return artSlug === normalized || uriSlug === normalized || art.userId === id;
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
      role: 'user',
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
      const normalizedUser = {
        uid: uid,
        email: newProfile.email,
        artistName: newProfile.artistName,
        whatsapp: newProfile.whatsapp,
        city: newProfile.city,
        state: newProfile.state,
        mainGenre: newProfile.mainGenre,
        instagram: newProfile.instagram,
        userType: newProfile.userType,
        role: "user",
        plan: "free",
        paymentStatus: "inactive",
        accessType: "free",
        musicLimit: 5,
        songsCount: 0,
        totalPlays: 0,
        totalViews: 0,
        whatsappClicks: 0,
        isBlocked: false,
        createdAt: Timestamp.fromDate(new Date(nowISO)),
        updatedAt: Timestamp.fromDate(new Date(nowISO))
      };

      // Write 'users'
      await setDoc(doc(db, "users", uid), normalizedUser, { merge: true });

      // Write 'artists'
      await setDoc(doc(db, "artists", uid), {
        ...newProfile,
        createdAt: Timestamp.fromDate(new Date(nowISO)),
        updatedAt: Timestamp.fromDate(new Date(nowISO))
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

  // Ensure the admin was authenticated anonymously & registered in Firestore users collection
  async ensureAdminAuth(): Promise<void> {
    const localUserStr = localStorage.getItem(LS_CURR_USER);
    if (!localUserStr) return;
    
    try {
      const localUser = JSON.parse(localUserStr) as Artist;
      const emailLower = (localUser.email || '').toLowerCase().trim();
      if (emailLower === 'videopremieroficial@gmail.com') {
        // 1. Silent Firebase Auth login
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        
        const fireUser = auth.currentUser;
        if (fireUser) {
          let updatedUser = { ...localUser };
          let needsLocalSave = false;
          
          // 2. Local index/userId mapping sync with current Auth UID
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
          
          // 3. Keep Firestore users role matching to satisfy isAdmin() check
          const usersTableRef = doc(db, 'users', fireUser.uid);
          const adminData = this.getNormalizedUserData({
            ...updatedUser,
            role: 'admin'
          });
          
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
      console.error("ensureAdminAuth error: ", error);
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
          role: d.role || (d.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com' ? 'admin' : 'user'),
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
    const tracks: Music[] = musicsMap[artistId] || [];
    return tracks.map((t, idx) => {
      if (artistId === "gabriel-silva" && !t.lyrics) {
        return {
          ...t,
          lyrics: DEMO_LYRICS[idx] || ""
        };
      }
      return t;
    });
  },

  async addMusic(artistId: string, track: Omit<Music, 'playsCount' | 'createdAt'>): Promise<Music> {
    const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
    const tracks: Music[] = musicsMap[artistId] || [];

    const playsValue = track.plays !== undefined ? track.plays : 0;
    const performerValue = track.performer || track.singer || '';
    const statusValue = track.status || 'active';
    const storageProviderValue = track.storageProvider || 'cloudflare_r2';

    const newTrack: Music = {
      ...track,
      playsCount: playsValue,
      plays: playsValue,
      status: statusValue,
      performer: performerValue,
      singer: track.singer || performerValue,
      storageProvider: storageProviderValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tracks.push(newTrack);
    musicsMap[artistId] = tracks;
    localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));

    // Wait for sync to Firestore
    try {
      const firestoreTrackPayload = {
        id: newTrack.trackId,
        ownerId: newTrack.artistId,
        title: newTrack.title,
        composer: newTrack.composer || '',
        performer: newTrack.performer || newTrack.singer || '',
        singer: newTrack.singer || newTrack.performer || '',
        genre: newTrack.genre || '',
        lyrics: newTrack.lyrics || '',
        description: newTrack.description || '',
        status: newTrack.status || 'active',
        audioUrl: newTrack.audioUrl,
        storageProvider: newTrack.storageProvider || 'cloudflare_r2',
        storagePath: newTrack.storagePath || '',
        fileSize: newTrack.fileSize || 0,
        mimeType: newTrack.mimeType || 'audio/mpeg',
        originalFileName: newTrack.originalFileName || '',
        plays: newTrack.plays !== undefined ? newTrack.plays : 0,
        playsCount: newTrack.playsCount !== undefined ? newTrack.playsCount : 0,
        trackId: newTrack.trackId,
        artistId: newTrack.artistId,
        coverUrl: newTrack.coverUrl || '',
        createdAt: Timestamp.fromDate(new Date(newTrack.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(newTrack.updatedAt || newTrack.createdAt)),
      };

      await setDoc(doc(db, "artists", artistId, "musics", newTrack.trackId), firestoreTrackPayload, { merge: true });
    } catch (e: any) {
      console.error("erro ao salvar no Firestore:", e);
      handleFirestoreError(e, OperationType.WRITE, `artists/${artistId}/musics/${newTrack.trackId}`);
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
        viewsCount: 45, // Prepopulate subtle views
        whatsappClicks: 12
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
      const normalizedId = artistId.trim();
      const artistDocRef = doc(db, 'artists', normalizedId);
      const artistSnap = await getDoc(artistDocRef).catch(e => {
        handleFirestoreError(e, OperationType.GET, `artists/${normalizedId}`);
        throw e;
      });
      
      if (artistSnap.exists()) {
        const artData = artistSnap.data();
        const formattedArtist: Artist = {
          userId: artData.userId || normalizedId,
          name: artData.name || "Artista",
          avatarUrl: artData.avatarUrl || "",
          city: artData.city || "",
          genre: artData.genre || "",
          whatsapp: artData.whatsapp || "",
          instagram: artData.instagram || "",
          email: artData.email || "",
          bio: artData.bio || "",
          plan: artData.plan || "free",
          subscriptionDate: artData.subscriptionDate || "",
          subscriptionStatus: artData.subscriptionStatus || "ativo",
          createdAt: artData.createdAt instanceof Timestamp ? artData.createdAt.toDate().toISOString() : artData.createdAt || new Date().toISOString()
        };

        // Cache artist profile
        const cachedArtists = this.getAllArtists();
        cachedArtists[normalizedId] = formattedArtist;
        localStorage.setItem(LS_ARTISTS, JSON.stringify(cachedArtists));

        const curr = this.getCurrentUser();
        if (curr && curr.userId === normalizedId) {
          localStorage.setItem(LS_CURR_USER, JSON.stringify(formattedArtist));
        }
      }

      // Fetch tracks subcollection
      const musicsColRef = collection(db, 'artists', normalizedId, 'musics');
      const musicsSnap = await getDocs(musicsColRef).catch(e => {
        handleFirestoreError(e, OperationType.GET, `artists/${normalizedId}/musics`);
        throw e;
      });
      const fetchedTracks: Music[] = musicsSnap.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          trackId: d.trackId || d.id,
          artistId: d.artistId || d.ownerId || normalizedId,
          title: d.title,
          composer: d.composer || "",
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
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toDate().toISOString() : d.updatedAt || d.createdAt || new Date().toISOString()
        };
      });

      if (fetchedTracks.length > 0) {
        const musicsMap = JSON.parse(localStorage.getItem(LS_MUSICS) || "{}");
        musicsMap[normalizedId] = fetchedTracks;
        localStorage.setItem(LS_MUSICS, JSON.stringify(musicsMap));
      } else {
        // If Firestore musics are empty but local has seed files, migrate them up to Firestore!
        const localMusics = this.getArtistMusics(normalizedId);
        for (const localT of localMusics) {
          setDoc(doc(db, 'artists', normalizedId, 'musics', localT.trackId), {
            ...localT,
            createdAt: Timestamp.fromDate(new Date(localT.createdAt))
          }, { merge: true }).catch(err => {
            console.error("Initial track migration err: ", err);
            handleFirestoreError(err, OperationType.WRITE, `artists/${normalizedId}/musics/${localT.trackId}`);
          });
        }
      }

      // Fetch analytics
      const analyticsRef = doc(db, 'artists', normalizedId, 'analytics', 'metrics');
      const analyticsSnap = await getDoc(analyticsRef).catch(e => {
        handleFirestoreError(e, OperationType.GET, `artists/${normalizedId}/analytics/metrics`);
        throw e;
      });
      if (analyticsSnap.exists()) {
        const anData = analyticsSnap.data() as Analytics;
        const analyticsMap = JSON.parse(localStorage.getItem(LS_ANALYTICS) || "{}");
        analyticsMap[normalizedId] = anData;
        localStorage.setItem(LS_ANALYTICS, JSON.stringify(analyticsMap));
      } else {
        const localAn = this.getAnalytics(normalizedId);
        setDoc(analyticsRef, localAn, { merge: true }).catch(e => {
          console.error(e);
          handleFirestoreError(e, OperationType.WRITE, `artists/${normalizedId}/analytics/metrics`);
        });
      }

      return true;
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

  async deleteMusic(artistId: string, trackId: string): Promise<boolean> {
    try {
      // Async delete from firestore
      const musicDocRef = doc(db, 'artists', artistId, 'musics', trackId);
      await deleteDoc(musicDocRef).catch(e => {
        handleFirestoreError(e, OperationType.DELETE, `artists/${artistId}/musics/${trackId}`);
        throw e;
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
      const musicDocRef = doc(db, 'artists', artistId, 'musics', trackId);
      await setDoc(musicDocRef, {
        status: nextStatus,
        updatedAt: Timestamp.fromDate(new Date())
      }, { merge: true }).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `artists/${artistId}/musics/${trackId}`);
        throw e;
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
  }
};
