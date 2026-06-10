import { useState, useEffect } from 'react';
import { dbService } from './lib/db';
import { Artist, Music as Track } from './types';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import ArtistPublic from './components/ArtistPublic';
import Player from './components/Player';
import AdminArea from './components/AdminArea';
import PaymentReturnScreen from './components/PaymentReturnScreen';
import { ShieldAlert } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';

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
    const unsubscribe = onAuthStateChanged(auth, (fireUser) => {
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
      }
    });

    // Parse URL on start: supports '/artista/id' custom urls
    const path = window.location.pathname;
    if (path.includes('/artista/') || path.includes('/artist/') || path.includes('/catalogo/')) {
      const parts = path.split('/');
      const artistSlug = parts[parts.length - 1];
      if (artistSlug) {
        setCurrentView('public');
        setRoutePayload({ id: artistSlug, autoCar: false });
        return;
      }
    } else if (path === '/pagamento/retorno') {
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
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id);
      const prefix = isGuid ? '/artista/' : '/catalogo/';
      window.history.pushState({}, '', `${prefix}${payload.id}`);
    } else if (view === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'auth') {
      window.history.pushState({}, '', '/entrar');
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view === 'payment_return') {
      window.history.pushState({}, '', '/pagamento/retorno');
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
      if (path.includes('/artista/') || path.includes('/artist/') || path.includes('/catalogo/')) {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        setCurrentView('public');
        setRoutePayload({ id, autoCar: false });
      } else if (path === '/dashboard') {
        const u = dbService.getCurrentUser();
        if (u) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('auth');
        }
      } else if (path === '/entrar') {
        setCurrentView('auth');
      } else if (path === '/pagamento/retorno') {
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
      // Log play analytics dynamically inside Firestore/Mock
      dbService.incrementPlayCount(track.artistId, track.trackId);
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
    dbService.incrementPlayCount(trackList[nextIndex].artistId, trackList[nextIndex].trackId);
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
    dbService.incrementPlayCount(trackList[prevIndex].artistId, trackList[prevIndex].trackId);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-white">
      
      {/* Route Views Switching Router */}
      {currentView === 'landing' && (
        <LandingPage 
          onNavigate={handleNavigate} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      )}

      {currentView === 'auth' && (
        <AuthScreen 
          onNavigate={handleNavigate} 
          onLoginSuccess={handleLoginSuccess}
          startInRegister={routePayload?.isRegister || false}
          initPremium={routePayload?.startPremium || false}
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
        />
      )}

      {currentView === 'public' && (
        <ArtistPublic 
          artistId={routePayload?.id || "gabriel-silva"}
          onNavigate={handleNavigate}
          onSelectTrack={handleSelectTrack}
          activeTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          setCarMode={setCarMode}
          autoCarMode={routePayload?.autoCar || false}
        />
      )}

      {currentView === 'admin' && currentUser && (
        <AdminArea 
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
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
      />

    </div>
  );
}

