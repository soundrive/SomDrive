import { useState, useEffect, lazy, Suspense } from 'react';
import { dbService } from './lib/db';
import { Artist, Music as Track } from './types';
import ArtistPublic from './components/ArtistPublic';
import Player from './components/Player';
import { ShieldAlert } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';

// Lazy load heavy views to optimize initial bundle size for public catalogs
const LandingPage = lazy(() => import('./components/LandingPage'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminArea = lazy(() => import('./components/AdminArea'));
const PaymentReturnScreen = lazy(() => import('./components/PaymentReturnScreen'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <p className="text-slate-400 text-sm font-medium tracking-wide">Carregando SomDrive...</p>
    </div>
  </div>
);

export default function App() {
  // SPA Routing state sync with address bar
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard' | 'public' | 'admin' | 'payment_return'>('landing');
  const [routePayload, setRoutePayload] = useState<any>(null);
  
  // Session state
  const [currentUser, setCurrentUser] = useState<Artist | null>(null);

  // Playback control states
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [isCarMode, setCarMode] = useState(false);
  const [logoScale, setLogoScale] = useState<number>(1.0);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');

  // Load general appearance configurations on initialization
  useEffect(() => {
    dbService.getAppearanceSettings().then((appearance) => {
      if (appearance) {
        if (typeof appearance.logoScale === 'number') {
          setLogoScale(appearance.logoScale);
        }
        if (typeof appearance.showLogo === 'boolean') {
          setShowLogo(appearance.showLogo);
        }
        if (typeof appearance.customLogoUrl === 'string') {
          setCustomLogoUrl(appearance.customLogoUrl);
        }
      }
    }).catch(err => {
      console.error("Error fetching appearance settings on mount", err);
    });
  }, []);

  // Handle routing deep link and session boot
  useEffect(() => {
    // Session load
    const user = dbService.getCurrentUser();
    let actsAsAdmin = false;
    if (user) {
      if (user.isBlocked) {
        dbService.setCurrentUser(null);
        setCurrentUser(null);
        setRoutePayload({ errorMsg: 'Sua conta está temporariamente bloqueada. Fale com o suporte.' });
      } else {
        setCurrentUser(user);
        actsAsAdmin = user.role === 'admin' || user.email?.toLowerCase().trim() === 'videopremieroficial@gmail.com' || user.email?.toLowerCase().trim() === 'sertanejopremier@gmail.com';
        if (actsAsAdmin) {
          dbService.ensureAdminAuth().then(() => {
            const updatedUser = dbService.getCurrentUser();
            if (updatedUser) {
              setCurrentUser(updatedUser);
            }
          });
        }
      }
    }

    // Dynamic Firebase Auth State handler
    let unsubscribeProfileSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (fireUser) => {
      if (unsubscribeProfileSnapshot) {
        unsubscribeProfileSnapshot();
        unsubscribeProfileSnapshot = null;
      }

      if (fireUser) {
        const emailLower = fireUser.email?.toLowerCase().trim() || '';
        if (emailLower === 'videopremieroficial@gmail.com' || emailLower === 'sertanejopremier@gmail.com') {
          dbService.ensureAdminAuth().then(() => {
            const updatedUser = dbService.getCurrentUser();
            if (updatedUser) {
              setCurrentUser(updatedUser);
            }
          });
        }

        // Setup real-time listener for current logged-in user documents
        unsubscribeProfileSnapshot = onSnapshot(doc(db, 'artists', fireUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const liveData = snapshot.data();
            const formatted = dbService.mapFirestoreDocToArtist(fireUser.uid, liveData);
            const checked = dbService.checkAndRevertExpiredAccess(formatted);
            dbService.setCurrentUser(checked);
            setCurrentUser(checked);
          }
        }, (error) => {
          console.error("Real-time profile subscription error:", error);
        });

      } else {
        setCurrentUser(null);
      }
    });

    // Parse URL on start: supports '/artista/id' and '/s/slug' custom urls
    const path = window.location.pathname;
    if (path.includes('/artista/') || path.includes('/artist/') || path.includes('/catalogo/') || path.startsWith('/s/')) {
      let workingPath = path;
      if (path.startsWith('/s/')) {
        workingPath = path.replace(/^\/s\//, '/catalogo/');
        window.history.replaceState({}, '', workingPath);
      }

      const parts = workingPath.split('/');
      const repIdx = parts.indexOf('repertorio');
      if (repIdx > 0 && repIdx < parts.length - 1) {
        const artistSlug = parts[repIdx - 1];
        const repertoireId = parts[repIdx + 1];
        if (artistSlug && repertoireId) {
          setCurrentView('public');
          setRoutePayload({ id: artistSlug, repertoireId: repertoireId, autoCar: false });
          return;
        }
      }
      const artistSlug = parts[parts.length - 1];
      if (artistSlug) {
        setCurrentView('public');
        setRoutePayload({ id: artistSlug, autoCar: false });
        return;
      }
    } else if (path === '/pagamento/retorno' || path === '/pagamento/sucesso' || path === '/pagamento/pendente' || path === '/pagamento/erro') {
      setCurrentView('payment_return');
      return;
    } else if (path === '/dashboard') {
      const u = dbService.getCurrentUser();
      if (u) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('auth');
        setRoutePayload({ isRegister: false });
        window.history.replaceState({}, '', '/entrar');
      }
      return;
    } else if (path === '/admin') {
      if (actsAsAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('landing');
        setRoutePayload({ errorMsg: 'Acesso restrito ao administrador.' });
      }
      return;
    }

    // Fallback: check query params or hash for routing
    const hash = window.location.hash;
    if (hash.startsWith('#/artista/')) {
      const id = hash.replace('#/artista/', '');
      setCurrentView('public');
      setRoutePayload({ id, autoCar: false });
    }

    return () => {
      unsubscribe();
      if (unsubscribeProfileSnapshot) {
        unsubscribeProfileSnapshot();
      }
    };
  }, []);

  // Update browser address bar dynamically on routing changes
  const handleNavigate = (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin' | 'payment_return', payload?: any) => {
    if (view === 'admin') {
      const u = dbService.getCurrentUser();
      const uEmail = u?.email?.toLowerCase().trim() || '';
      if (!u || (u.role !== 'admin' && uEmail !== 'videopremieroficial@gmail.com' && uEmail !== 'sertanejopremier@gmail.com')) {
        setCurrentView('landing');
        setRoutePayload({ errorMsg: 'Acesso restrito ao administrador.' });
        window.history.pushState({}, '', '/');
        return;
      }
    }

    setCurrentView(view);
    setRoutePayload(payload || null);

    // Sync browser address bar so copy-paste actually works!
    if (view === 'public' && payload?.id) {
      const prefix = '/catalogo/';
      if (payload.repertoireId) {
        window.history.pushState({}, '', `${prefix}${payload.id}/repertorio/${payload.repertoireId}`);
      } else {
        window.history.pushState({}, '', `${prefix}${payload.id}`);
      }
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'auth') {
      window.history.pushState({}, '', '/entrar');
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view === 'payment_return') {
      const subPath = payload?.subPath || '/pagamento/retorno';
      window.history.pushState({}, '', subPath);
    } else {
      window.history.pushState({}, '', '/');
    }
    
    // Smooth scroll back to top of screen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Watch for popstate browser back button clicks
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/artista/') || path.includes('/artist/') || path.includes('/catalogo/') || path.startsWith('/s/')) {
        const parts = path.split('/');
        const repIdx = parts.indexOf('repertorio');
        if (repIdx > 0 && repIdx < parts.length - 1) {
          const artistSlug = parts[repIdx - 1];
          const repertoireId = parts[repIdx + 1];
          if (artistSlug && repertoireId) {
            setCurrentView('public');
            setRoutePayload({ id: artistSlug, repertoireId: repertoireId, autoCar: false });
            return;
          }
        }
        const artistSlug = parts[parts.length - 1];
        if (artistSlug) {
          setCurrentView('public');
          setRoutePayload({ id: artistSlug, autoCar: false });
        }
      } else if (path === '/dashboard') {
        const u = dbService.getCurrentUser();
        if (u) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('auth');
        }
      } else if (path === '/entrar') {
        setCurrentView('auth');
      } else if (path === '/pagamento/retorno' || path === '/pagamento/sucesso' || path === '/pagamento/pendente' || path === '/pagamento/erro') {
        setCurrentView('payment_return');
      } else if (path === '/admin') {
        const u = dbService.getCurrentUser();
        const uEmail = u?.email?.toLowerCase().trim() || '';
        if (u && (u.role === 'admin' || uEmail === 'videopremieroficial@gmail.com' || uEmail === 'sertanejopremier@gmail.com')) {
          setCurrentView('admin');
        } else {
          setCurrentView('landing');
          setRoutePayload({ errorMsg: 'Acesso restrito ao administrador.' });
        }
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLoginSuccess = (artist: Artist) => {
    setCurrentUser(artist);
    const artistEmail = artist.email?.toLowerCase().trim() || '';
    const actsAsAdmin = artist.role === 'admin' || artistEmail === 'videopremieroficial@gmail.com' || artistEmail === 'sertanejopremier@gmail.com';
    if (actsAsAdmin) {
      dbService.ensureAdminAuth().then(() => {
        const updatedUser = dbService.getCurrentUser();
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      });
    }
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    dbService.setCurrentUser(null);
    setCurrentUser(null);
    setIsPlaying(false);
    setCurrentTrack(null);
    setCarMode(false);
    handleNavigate('landing');
  };

  // Music state selectors
  const handleSelectTrack = (track: Track, newList: Track[]) => {
    setTrackList(newList);
    
    // If selecting the same track that is already loaded, toggle play/pause
    if (currentTrack?.trackId === track.trackId) {
      handlePlayPause();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      // Play tracking is now handled reliably inside the Player component
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack && trackList.length > 0) {
      // Begin with first song in list
      setCurrentTrack(trackList[0]);
      setIsPlaying(true);
    } else if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (trackList.length === 0 || !currentTrack) return;
    const currentIndex = trackList.findIndex(t => t.trackId === currentTrack.trackId);
    const nextIndex = (currentIndex + 1) % trackList.length;
    setCurrentTrack(trackList[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (trackList.length === 0 || !currentTrack) return;
    const currentIndex = trackList.findIndex(t => t.trackId === currentTrack.trackId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = trackList.length - 1;
    }
    setCurrentTrack(trackList[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-white">
      
      {/* Route Views Switching Router */}
      <Suspense fallback={<LoadingFallback />}>
        {currentView === 'landing' && (
          <LandingPage 
            onNavigate={handleNavigate} 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            logoScale={logoScale}
            showLogo={showLogo}
            customLogoUrl={customLogoUrl}
          />
        )}

        {currentView === 'auth' && (
          <AuthScreen 
            onNavigate={handleNavigate} 
            onLoginSuccess={handleLoginSuccess}
            startInRegister={routePayload?.isRegister || false}
            initPremium={routePayload?.startPremium || false}
            logoScale={logoScale}
            showLogo={showLogo}
            customLogoUrl={customLogoUrl}
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <Dashboard 
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onSelectTrack={handleSelectTrack}
            activeTrack={currentTrack}
            isPlaying={isPlaying}
          />
        )}

        {/* Fallback to make sure Dashboard doesn't crash on null session */}
        {currentView === 'dashboard' && !currentUser && (
          <AuthScreen 
            onNavigate={handleNavigate} 
            onLoginSuccess={handleLoginSuccess}
            startInRegister={false}
            initPremium={false}
            logoScale={logoScale}
            showLogo={showLogo}
            customLogoUrl={customLogoUrl}
          />
        )}

        {currentView === 'public' && (
          <ArtistPublic 
            artistId={routePayload?.id || ""}
            initialRepertoireId={routePayload?.repertoireId || null}
            onNavigate={handleNavigate}
            onSelectTrack={handleSelectTrack}
            activeTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            setCarMode={setCarMode}
            autoCarMode={routePayload?.autoCar || false}
            logoScale={logoScale}
            showLogo={showLogo}
            customLogoUrl={customLogoUrl}
          />
        )}

        {currentView === 'admin' && currentUser && (
          <AdminArea 
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            logoScale={logoScale}
            onLogoScaleChange={setLogoScale}
            showLogo={showLogo}
            onShowLogoChange={setShowLogo}
            customLogoUrl={customLogoUrl}
            onCustomLogoUrlChange={setCustomLogoUrl}
          />
        )}

        {currentView === 'payment_return' && (
          <PaymentReturnScreen 
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onRefreshProfile={() => {
              const freshUser = dbService.getCurrentUser();
              if (freshUser) {
                setCurrentUser(freshUser);
              }
            }}
          />
        )}
      </Suspense>

      {/* Restrict warning overlay modal */}
      {routePayload?.errorMsg && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl max-w-sm text-center shadow-2xl relative animate-fade-in">
            <div className="mx-auto w-12 h-12 bg-red-950/40 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-red-400 font-bold" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Acesso Restrito</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{routePayload.errorMsg}</p>
            <button
              onClick={() => setRoutePayload(null)}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-slate-950 font-bold rounded-2xl text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Unified Persistent Player Dock */}
      <Player 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        trackList={trackList}
        isCarMode={isCarMode}
        setCarMode={setCarMode}
        onNavigate={handleNavigate}
        onSelectTrack={(track) => handleSelectTrack(track, trackList)}
        isAdminView={currentView === 'dashboard' || currentView === 'admin'}
      />

    </div>
  );
}

