import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Smartphone, 
  Car, 
  MessageSquare, 
  Share2, 
  Info, 
  Disc, 
  MapPin, 
  Instagram, 
  Mail, 
  Check, 
  ChevronRight, 
  ChevronDown,
  DollarSign, 
  ArrowLeft,
  Coins,
  ShieldCheck,
  Star,
  Music as MusicIcon,
  Copy,
  Home,
  MoreVertical,
  Search,
  Filter,
  SlidersHorizontal,
  FolderHeart,
  Globe,
  Plus,
  ExternalLink,
  Code,
  ShieldAlert
} from 'lucide-react';
import { Artist, Music as Track, Analytics, Repertoire } from '../types';
import { dbService } from '../lib/db';
import { BrandLogo } from './BrandLogo';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ArtistPublicProps {
  artistId: string;
  initialRepertoireId?: string | null;
  onNavigate: (view: 'landing' | 'auth' | 'dashboard' | 'public' | 'admin' | 'payment_return', payload?: any) => void;
  onSelectTrack: (track: Track, list: Track[]) => void;
  activeTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  setCarMode: (active: boolean) => void;
  autoCarMode: boolean;
  logoScale?: number;
  showLogo?: boolean;
  customLogoUrl?: string;
}

export default function ArtistPublic({
  artistId,
  initialRepertoireId = null,
  onNavigate,
  onSelectTrack,
  activeTrack,
  isPlaying,
  onPlayPause,
  setCarMode,
  autoCarMode,
  logoScale,
  showLogo,
  customLogoUrl
}: ArtistPublicProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState('All');
  
  // Shared navigation parameters mapped from URLSearchParams
  const [selectedRepertoireId, setSelectedRepertoireId] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('rep') || params.get('repertoire') || initialRepertoireId;
  });
  const [selectedSongId, setSelectedSongId] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return params.get('song') || params.get('play');
  });

  // Alerts
  const [copiedLinkAlert, setCopiedLinkAlert] = useState(false);
  const [alertText, setAlertText] = useState('Link copiado com sucesso!');
  const [whatsappShareAlert, setWhatsappShareAlert] = useState(false);
  const [instaShareAlert, setInstaShareAlert] = useState(false);
  
  // Active states
  const [expandedLyricsTrackId, setExpandedLyricsTrackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'composicoes' | 'sobre'>('composicoes');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom context menus / shares
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [activeProfileMenu, setActiveProfileMenu] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState<string | null>(null); // trackId or 'profile'
  const [forceAllView, setForceAllView] = useState(false);

  const openedAsRepertoireOnly = !forceAllView && (!!initialRepertoireId || window.location.pathname.includes('/repertorio/')) && !!selectedRepertoireId;
  const currentRepertoire = selectedRepertoireId ? repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
  const repertoireNotFoundOrPrivate = isInitialLoadDone && !forceAllView && window.location.pathname.includes('/repertorio/') && (
    !selectedRepertoireId ||
    !currentRepertoire ||
    currentRepertoire.visibility !== 'public' ||
    (currentRepertoire.ownerUid?.toString().trim().toLowerCase() !== artist?.userId?.toString().trim().toLowerCase())
  );

  useEffect(() => {
    if (repertoireNotFoundOrPrivate) {
      console.error("Firestore repertoire error", {
        code: "not-found",
        message: `Repertoire '${selectedRepertoireId}' not found, not active, or is private for artist ${artist?.userId}`,
        name: "RepertoireAccessError"
      });
    }
  }, [repertoireNotFoundOrPrivate, selectedRepertoireId, artist]);

  // Dynamic Browser Tab Meta Title
  useEffect(() => {
    if (artist) {
      if (openedAsRepertoireOnly && currentRepertoire && currentRepertoire.visibility !== 'private') {
        document.title = `${currentRepertoire.name} — ${artist.name} | SomDrive`;
      } else {
        document.title = `Catálogo musical de ${artist.name} | SomDrive`;
      }
    } else {
      document.title = `SomDrive - Catálogo Musical`;
    }
    return () => {
      document.title = `SomDrive - Catálogo Musical`;
    };
  }, [artist, openedAsRepertoireOnly, currentRepertoire]);

  // Parse URL search parameters for shared link access
  useEffect(() => {
    const parseParams = () => {
      const params = new URLSearchParams(window.location.search);
      const repParam = params.get('rep') || params.get('repertoire') || initialRepertoireId;
      const songParam = params.get('song') || params.get('play');
      
      if (repParam) {
        setSelectedRepertoireId(repParam);
        setSelectedSongId(null);
      } else if (songParam) {
        setSelectedSongId(songParam);
        setSelectedRepertoireId(null);
      } else {
        setSelectedRepertoireId(initialRepertoireId);
        setSelectedSongId(null);
      }
    };
    parseParams();
    
    // Listen for state/history changes
    window.addEventListener('popstate', parseParams);
    return () => window.removeEventListener('popstate', parseParams);
  }, [initialRepertoireId]);

  const clearSharedContext = () => {
    const artistSlug = artist?.slug || artist?.userId || artistId;
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistSlug);
    let prefix = '/catalogo/';
    const currentPath = window.location.pathname;
    if (currentPath.includes('/s/')) {
      prefix = '/s/';
    } else if (isGuid || currentPath.includes('/artista/')) {
      prefix = '/artista/';
    }
    window.history.pushState({}, '', `${prefix}${artistSlug}`);
    setForceAllView(true);
    setSelectedRepertoireId(null);
    setSelectedSongId(null);
  };

  // Load artist, tracks, and local/firestore synced repertoires
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const normalizedArtistSlug = artistId.trim().toLowerCase();

        // 1. Fetch artist directly from Firestore by slug OR by ID in parallel
        let resolvedArtist: Artist | null = null;
        let resolvedUserId = '';

        const qArtist = query(collection(db, 'artists'), where('slug', '==', normalizedArtistSlug));
        
        const artistQueryPromise = getDocs(qArtist).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - artist slug query", {
            colecao: "artists",
            slug: normalizedArtistSlug,
            ownerUid: "não_resolvido",
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        const artistDirectDocPromise = getDoc(doc(db, 'artists', artistId.trim())).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - artist direct fetch", {
            colecao: "artists",
            slug: normalizedArtistSlug,
            ownerUid: artistId.trim(),
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        // Resolve both queries in parallel so we don't have sequential latency
        const [snapArtist, directSnap] = await Promise.all([artistQueryPromise, artistDirectDocPromise]);

        if (snapArtist && !snapArtist.empty) {
          const docSnap = snapArtist.docs[0];
          resolvedArtist = dbService.mapFirestoreDocToArtist(docSnap.id, docSnap.data());
          resolvedUserId = docSnap.id;
        } else if (directSnap && directSnap.exists()) {
          resolvedArtist = dbService.mapFirestoreDocToArtist(directSnap.id, directSnap.data());
          resolvedUserId = directSnap.id;
        }

        if (!resolvedArtist) {
          setErrorMsg("Artista não encontrado ou indisponível.");
          setIsLoading(false);
          setIsInitialLoadDone(true);
          return;
        }

        setArtist(resolvedArtist);

        // 2. Fetch all public/active repertoires AND songs collection AND legacy musics IN PARALLEL!
        let repsList: Repertoire[] = [];
        let rawSongs: Track[] = [];

        const qRepsPub = query(
          collection(db, 'repertoires'),
          where('ownerUid', '==', resolvedUserId),
          where('visibility', '==', 'public')
        );

        const repsPubPromise = getDocs(qRepsPub).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - repsPub", {
            colecao: "repertoires",
            slug: normalizedArtistSlug,
            ownerUid: resolvedUserId,
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        const qRepsAct = query(
          collection(db, 'repertoires'),
          where('ownerUid', '==', resolvedUserId),
          where('visibility', '==', 'active')
        );

        const repsActPromise = getDocs(qRepsAct).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - repsAct", {
            colecao: "repertoires",
            slug: normalizedArtistSlug,
            ownerUid: resolvedUserId,
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        const qSongs = query(collection(db, 'songs'), where('ownerId', '==', resolvedUserId));

        const songsPromise = getDocs(qSongs).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - songs query", {
            colecao: "songs",
            slug: normalizedArtistSlug,
            ownerUid: resolvedUserId,
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        const musicsColRef = collection(db, 'artists', resolvedUserId, 'musics');

        const legacyMusicsPromise = getDocs(musicsColRef).catch(error => {
          console.error("PUBLIC CATALOG LOAD ERROR - legacy musics", {
            colecao: `artists/${resolvedUserId}/musics`,
            slug: normalizedArtistSlug,
            ownerUid: resolvedUserId,
            codigo_erro: error?.code || "desconhecido",
            mensagem: error?.message || String(error)
          });
          return null;
        });

        // Trigger all four concurrent requests in parallel
        const [snapRepsPub, snapRepsAct, snapSongs, snapLegacyMusics] = await Promise.all([
          repsPubPromise,
          repsActPromise,
          songsPromise,
          legacyMusicsPromise
        ]);

        // Process Repertoires
        if (snapRepsPub && !snapRepsPub.empty) {
          snapRepsPub.forEach(docSnap => {
            const d = docSnap.data();
            repsList.push({
              id: docSnap.id,
              ownerUid: d.ownerUid,
              name: d.name,
              slug: d.slug || '',
              description: d.description || '',
              type: d.type || 'repertoire',
              trackIds: d.trackIds || [],
              orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
              visibility: 'public',
              createdAt: d.createdAt || new Date().toISOString(),
              updatedAt: d.updatedAt || new Date().toISOString()
            });
          });
        }

        if (snapRepsAct && !snapRepsAct.empty) {
          snapRepsAct.forEach(docSnap => {
            const d = docSnap.data();
            if (!repsList.some(r => r.id === docSnap.id)) {
              repsList.push({
                id: docSnap.id,
                ownerUid: d.ownerUid,
                name: d.name,
                slug: d.slug || '',
                description: d.description || '',
                type: d.type || 'repertoire',
                trackIds: d.trackIds || [],
                orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
                visibility: 'public',
                createdAt: d.createdAt || new Date().toISOString(),
                updatedAt: d.updatedAt || new Date().toISOString()
              });
            }
          });
        }

        setRepertoires(repsList);

        // Process Songs (prefer active status, maps properly)
        if (snapSongs && !snapSongs.empty) {
          snapSongs.forEach(songDoc => {
            const sd = songDoc.data();
            const trackId = songDoc.id;
            if (sd.status !== 'inactive') {
              rawSongs.push({
                trackId: trackId,
                id: trackId,
                title: sd.title || '',
                artistId: sd.artistId || sd.ownerId || resolvedUserId,
                artistName: sd.artistName || resolvedArtist?.name || '',
                audioUrl: sd.audioUrl || sd.fileUrl || '',
                coverUrl: sd.coverUrl || '',
                lyrics: sd.lyrics || '',
                status: sd.status || 'active',
                genre: sd.genre || '',
                duration: sd.duration || 0,
                repertoireId: sd.repertoireId || '',
                createdAt: sd.createdAt?.toDate?.()?.toISOString?.() || sd.createdAt || '',
                playsCount: sd.playsCount || sd.plays || 0,
                plays: sd.plays || 0,
                orderIndex: sd.orderIndex !== undefined ? sd.orderIndex : sd.position
              } as Track);
            }
          });
        }

        // If 'songs' collection yields empty results, process legacy nested subcollection path `/artists/{userId}/musics` fallback
        if (rawSongs.length === 0 && snapLegacyMusics && !snapLegacyMusics.empty) {
          snapLegacyMusics.forEach(songDoc => {
            const sd = songDoc.data();
            const trackId = songDoc.id;
            if (sd.status !== 'inactive') {
              rawSongs.push({
                trackId: trackId,
                id: trackId,
                title: sd.title || '',
                artistId: sd.artistId || sd.ownerId || resolvedUserId,
                artistName: sd.artistName || resolvedArtist?.name || '',
                audioUrl: sd.audioUrl || sd.fileUrl || '',
                coverUrl: sd.coverUrl || '',
                lyrics: sd.lyrics || '',
                status: sd.status || 'active',
                genre: sd.genre || '',
                duration: sd.duration || 0,
                repertoireId: sd.repertoireId || '',
                createdAt: sd.createdAt?.toDate?.()?.toISOString?.() || sd.createdAt || '',
                playsCount: sd.playsCount || sd.plays || 0,
                plays: sd.plays || 0,
                orderIndex: sd.orderIndex !== undefined ? sd.orderIndex : sd.position
              } as Track);
            }
          });
        }

        // 4. Determine if we are loading a specific shared repertoire or the complete catalog
        const isSharedPage = !forceAllView && (!!initialRepertoireId || window.location.pathname.includes('/repertorio/')) && !!selectedRepertoireId;
        
        if (isSharedPage) {
          // Shared repertoire focus: filter tracks strictly to this repertoire
          const currentRepertoire = selectedRepertoireId ? repsList.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
          
          if (!currentRepertoire || currentRepertoire.visibility !== 'public') {
            // Repertoire wasn't found or isn't public, return early cleanly rendering the empty/private state
            setRepertoires([]);
            setIsLoading(false);
            setIsInitialLoadDone(true);
            return;
          }

          // Use matchingDoc.id if the state was using a slug
          if (selectedRepertoireId !== currentRepertoire.id) {
            setSelectedRepertoireId(currentRepertoire.id);
          }

          setRepertoires([currentRepertoire]);

          const allowedTrackIds = currentRepertoire.orderedTrackIds || currentRepertoire.trackIds || [];
          const filteredTracks = rawSongs.filter(track => {
            return allowedTrackIds.includes(track.trackId) || track.repertoireId === currentRepertoire.id;
          });

          // Sort by the orderedTrackIds list
          const sortedTracks = filteredTracks.sort((a, b) => {
            const idxA = allowedTrackIds.indexOf(a.trackId);
            const idxB = allowedTrackIds.indexOf(b.trackId);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });

          setAllTracks(sortedTracks);
        } else {
          // General catalog: show all active tracks, sort them cleanly by orderIndex / position
          const sortedAllTracks = rawSongs.sort((a, b) => {
            const posA = a.orderIndex !== undefined ? a.orderIndex : (a.position !== undefined ? a.position : 99999);
            const posB = b.orderIndex !== undefined ? b.orderIndex : (b.position !== undefined ? b.position : 99999);
            return posA - posB;
          });
          setAllTracks(sortedAllTracks);
        }

        setIsLoading(false);
        setIsInitialLoadDone(true);

        // Increment views in background
        dbService.incrementAnalyticsView(resolvedUserId, true, false);

      } catch (err: any) {
        console.error("Firestore loading error inside ArtistPublic:", {
          code: err?.code,
          message: err?.message,
          name: err?.name
        });
        setErrorMsg("Erro ao carregar o catálogo. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
        setIsInitialLoadDone(true);
      }
    };
    loadData();
  }, [artistId, selectedRepertoireId, forceAllView]);

  // Handle auto launch car mode if requested
  useEffect(() => {
    if (autoCarMode && allTracks.length > 0) {
      onSelectTrack(allTracks[0], allTracks);
      setCarMode(true);
    }
  }, [autoCarMode, allTracks]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#04060f] text-white flex flex-col items-center justify-center p-4">
        <Disc className="w-12 h-12 text-[#d4af37] animate-spin mb-4" />
        <h3 className="text-base font-heading font-bold text-center animate-pulse tracking-wider">SOMDRIVE • CARREGANDO</h3>
        <p className="text-xs text-slate-500 mt-2 font-mono">Resgatando pen drive e acervo musical privado...</p>
      </div>
    );
  }

  if (errorMsg || !artist) {
    return (
      <div className="min-h-screen bg-[#04060f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-950/40 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6">
          <MusicIcon className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-heading font-bold mb-2">{errorMsg || "Catálogo não encontrado ou ainda indisponível."}</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6 font-mono">
          O link de divulgação pode estar desatualizado ou o compositor desativou seu perfil temporariamente.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase hover:bg-slate-850 hover:text-white transition tracking-wider flex items-center gap-2 cursor-pointer font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>
      </div>
    );
  }

  if (repertoireNotFoundOrPrivate) {
    return (
      <div className="min-h-screen bg-[#04060f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#1a1410] border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-heading font-bold mb-2 text-orange-400 uppercase">Este repertório não está disponível.</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6 font-mono">
          O link pode estar quebrado, ter sido removido ou estar configurado como privado pelo compositor.
        </p>
        <button
          onClick={clearSharedContext}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase hover:bg-slate-850 hover:text-white transition tracking-wider flex items-center gap-2 cursor-pointer font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Ir para Perfil Completo
        </button>
      </div>
    );
  }

  // Filter songs based on current context (Shared Repertoire, Shared Single Song, or General Search)
  let activeDisplayTracks = [...allTracks];
  let customCollectionLabel = "";
  let isFilteredToSingleContext = false;

  if (selectedRepertoireId) {
    const foundRep = repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase()));
    if (foundRep) {
      const allowedIds = foundRep.orderedTrackIds || foundRep.trackIds || [];
      const matchedTracks = allTracks.filter(t => allowedIds.includes(t.trackId));
      activeDisplayTracks = matchedTracks.sort((a, b) => {
        const idxA = allowedIds.indexOf(a.trackId);
        const idxB = allowedIds.indexOf(b.trackId);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
      customCollectionLabel = `Repertório: ${foundRep.name}`;
      isFilteredToSingleContext = true;
    }
  } else if (selectedSongId) {
    activeDisplayTracks = allTracks.filter(t => t.trackId === selectedSongId);
    if (activeDisplayTracks.length > 0) {
      customCollectionLabel = `Música compartilhada: ${activeDisplayTracks[0].title}`;
      isFilteredToSingleContext = true;
    }
  } else {
    // General section / complete profile: only show songs not linked to any repertoire
    const repertoriedTrackIds = new Set<string>();
    repertoires.forEach(rep => {
      const idsComp = [...(rep.trackIds || []), ...(rep.orderedTrackIds || [])];
      idsComp.forEach(tid => {
        if (tid) {
          repertoriedTrackIds.add(tid.toString().trim().toLowerCase());
        }
      });
    });
    activeDisplayTracks = allTracks.filter(t => {
      if (t.repertoireId && t.repertoireId !== 'general') return false;
      if (!t.trackId) return true;
      const tidNormalized = t.trackId.toString().trim().toLowerCase();
      return !repertoriedTrackIds.has(tidNormalized);
    });
  }

  // Apply visual search query
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    activeDisplayTracks = activeDisplayTracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.composer || '').toLowerCase().includes(q) ||
      (t.genre || '').toLowerCase().includes(q)
    );
  }

  // Apply genre filter
  if (selectedGenreFilter !== 'All') {
    activeDisplayTracks = activeDisplayTracks.filter(t => t.genre === selectedGenreFilter);
  }

  const genres = ['All', ...Array.from(new Set(allTracks.map(t => t.genre).filter(Boolean)))];

  // Action Helpers
  const triggerAlert = (text: string) => {
    setAlertText(text);
    setCopiedLinkAlert(true);
    setTimeout(() => setCopiedLinkAlert(false), 2600);
  };

  const handleShareWhatsApp = () => {
    dbService.incrementAnalyticsView(artist.userId, false, false);
    const appBaseUrl = window.location.origin;
    const artistSlug = artist.slug || artist.userId;
    const foundRep = selectedRepertoireId ? repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
    let pageUrl = `${appBaseUrl}/s/${artistSlug}`;
    let messageText = `🎧 Ouça meu catálogo musical no SomDrive!\n\nAqui estão minhas composições disponíveis:\n${pageUrl}`;

    if (foundRep) {
      pageUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${foundRep.slug || foundRep.id}`;
      messageText = `Ouça o repertório “${foundRep.name}” de ${artist.name} no SomDrive: ${pageUrl}`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(messageText)}`, '_blank');
    
    setWhatsappShareAlert(true);
    setTimeout(() => setWhatsappShareAlert(false), 2000);
  };

  const handleCopyLinkDissemination = () => {
    const appBaseUrl = window.location.origin;
    const artistSlug = artist.slug || artist.userId;
    const foundRep = selectedRepertoireId ? repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
    let pageUrl = `${appBaseUrl}/s/${artistSlug}`;

    if (foundRep) {
      pageUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${foundRep.slug || foundRep.id}`;
      navigator.clipboard.writeText(pageUrl);
      triggerAlert(`🔗 Link do repertório "${foundRep.name}" copiado com sucesso!`);
    } else {
      navigator.clipboard.writeText(pageUrl);
      triggerAlert("🔗 Link do perfil copiado com sucesso!");
    }
  };

  const handleInstagramShare = () => {
    const instagramUrl = `https://instagram.com/${artist.instagram?.replace(/@/g, '') || ''}`;
    window.open(instagramUrl, '_blank');
    setInstaShareAlert(true);
    setTimeout(() => setInstaShareAlert(false), 2000);
  };

  const handleGeneralProfileShare = () => {
    const appBaseUrl = window.location.origin;
    const artistSlug = artist.slug || artist.userId;
    const foundRep = selectedRepertoireId ? repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
    let pageUrl = `${appBaseUrl}/catalogo/${artistSlug}`;
    let shareTitle = `SomDrive - ${artist.name}`;
    let shareText = `Ouça o catálogo de composições de ${artist.name} no SomDrive!`;

    if (foundRep) {
      pageUrl = `${appBaseUrl}/catalogo/${artistSlug}/repertorio/${foundRep.slug || foundRep.id}`;
      shareTitle = `${foundRep.name} — ${artist.name} | SomDrive`;
      shareText = `Ouça as músicas do repertório "${foundRep.name}" de ${artist.name} no SomDrive!`;
    }

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: pageUrl
      }).catch((err) => {
        console.log("Erro ao compartilhar", err);
        handleCopyLinkDissemination();
      });
    } else {
      handleCopyLinkDissemination();
    }
  };

  const handleSpeakWithArtist = () => {
    dbService.incrementAnalyticsView(artist.userId, false, false);
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = `Olá ${artist.name}, encontrei seu catálogo de composições no SomDrive e gostaria de conversar sobre contratação autorais e licenciamentos!`;
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(greetingText)}`, '_blank');
  };

  const handleContactForTrack = (track: Track) => {
    dbService.incrementAnalyticsView(artist.userId, false, true);
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = `Olá ${artist.name}, encontrei sua composição "${track.title}" no catálogo SomDrive e tenho alto interesse em gravá-la / ouvir a guia de áudio!`;
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(greetingText)}`, '_blank');
  };

  // Repertoire sharing logic
  const handleShareRepertoire = (rep: Repertoire, e: React.MouseEvent) => {
    e.stopPropagation();
    const appBaseUrl = window.location.origin;
    const artistSlug = artist.slug || artist.userId;
    const shareUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${rep.slug || rep.id}`;
    navigator.clipboard.writeText(shareUrl);
    triggerAlert(`🔗 Link do repertório "${rep.name}" copiado com sucesso!`);
  };

  const handlePlayRepertoire = (rep: Repertoire, e: React.MouseEvent) => {
    e.stopPropagation();
    const repTracks = allTracks.filter(t => rep.trackIds?.includes(t.trackId));
    if (repTracks.length > 0) {
      onSelectTrack(repTracks[0], repTracks);
    } else {
      alert("Este repertório ainda não possui músicas ativas.");
    }
  };

  // Individual Track sharing
  const handleCopyTrackLink = (track: Track) => {
    const appBaseUrl = window.location.origin;
    const shareUrl = `${appBaseUrl}/catalogo/${artist.slug || artist.userId}?song=${track.trackId}`;
    navigator.clipboard.writeText(shareUrl);
    triggerAlert(`🔗 Link da música "${track.title}" copiado para transferência!`);
    setActiveMenuTrackId(null);
  };

  const handleShareTrackWhatsApp = (track: Track) => {
    const appBaseUrl = window.location.origin;
    const shareUrl = `${appBaseUrl}/catalogo/${artist.slug || artist.userId}?song=${track.trackId}`;
    const text = `Ouça a composição autoral "${track.title}" de ${artist.name} no SomDrive:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setActiveMenuTrackId(null);
  };

  const handleEmbedTrack = (track: Track) => {
    setShowEmbedModal(track.trackId);
    setActiveMenuTrackId(null);
  };

  if (openedAsRepertoireOnly && artist && currentRepertoire) {
    return (
      <div className="min-h-screen bg-[#000000] text-zinc-100 font-sans pb-32 relative overflow-x-hidden flex flex-col items-center w-full">
        {/* Background Decorative Radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[850px] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none z-0"></div>
        
        {/* Header with SomDrive Logo */}
        <header className="w-full max-w-4xl px-4 py-6 flex items-center justify-between z-10 select-none">
          <a 
            href="https://www.somdrive.com.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="cursor-pointer hover:opacity-90 flex items-center"
          >
            <BrandLogo size="sm" scale={0.7} />
          </a>
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#8495b4] bg-[#181818] border border-zinc-900 px-3 py-1.5 rounded-lg uppercase">
            CONTEÚDO REGISTRADO
          </span>
        </header>

        {/* Main Content Card Container */}
        <main className="w-full max-w-3xl px-4 py-8 z-10 flex flex-col gap-6 relative">
          
          {/* Main Folder/Repertoire Card (Dark Graphite #181818 with discrete Lime Green border) */}
          <div className="w-full bg-[#181818] border border-[#84cc16]/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0px_0px_30px_rgba(132,204,22,0.06)] select-none">
            <div className="space-y-4 text-left flex-1 min-w-0">
              <span className="inline-block bg-[#eab308]/15 border border-[#eab308]/35 text-yellow-400 text-[10px] md:text-xs font-extrabold font-mono tracking-widest px-3 py-1 rounded-full uppercase">
                REPERTÓRIO
              </span>
              
              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight break-words pr-2 leading-tight">
                {currentRepertoire.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#84cc16] font-mono text-xs sm:text-sm font-bold">
                <span>Compositor: {artist.name}</span>
                <span className="text-zinc-750 select-none">•</span>
                <span>{allTracks.length} {allTracks.length === 1 ? 'faixa' : 'faixas'}</span>
              </div>

              {/* Action Buttons: Contato | Instagram | Compartilhar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 select-none">
                {!!(artist.whatsapp || artist.phone) && (
                  <button
                    onClick={() => {
                      dbService.incrementAnalyticsView(artist.userId, false, false);
                      const cleanNum = (artist.whatsapp || artist.phone || '').replace(/\D/g, '');
                      const greeting = encodeURIComponent(`Olá ${artist.name}, encontrei seu catálogo de composições no SomDrive e gostaria de conversar sobre contratação autorais e licenciamentos!`);
                      window.open(`https://wa.me/${cleanNum}?text=${greeting}`, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#84cc16]/10 text-[#84cc16] hover:bg-[#84cc16]/20 transition-all border border-[#84cc16]/20 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contato</span>
                  </button>
                )}
                {!!(artist.instagram && artist.instagram.trim().length > 0) && (
                  <button
                    onClick={() => {
                      const igUrl = `https://instagram.com/${artist.instagram.replace(/@/g, '').trim()}`;
                      window.open(igUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800 cursor-pointer"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    <span>Instagram</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const appBaseUrl = window.location.origin;
                    const artistSlug = artist.slug || artist.userId;
                    const shareUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${currentRepertoire.slug || currentRepertoire.id}`;
                    if (navigator.share) {
                      navigator.share({
                        title: `${currentRepertoire.name} — ${artist.name} | SomDrive`,
                        text: `Ouça o repertório "${currentRepertoire.name}" de ${artist.name} no SomDrive!`,
                        url: shareUrl
                      }).catch((err) => {
                        console.log("Erro ao compartilhar", err);
                        navigator.clipboard.writeText(shareUrl);
                        setAlertText("Link da pasta copiado!");
                        setCopiedLinkAlert(true);
                        setTimeout(() => setCopiedLinkAlert(false), 2800);
                      });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      setAlertText("Link da pasta copiado!");
                      setCopiedLinkAlert(true);
                      setTimeout(() => setCopiedLinkAlert(false), 2800);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Actions Block: Standalone Play everything button */}
            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              {allTracks.length > 0 && (
                <button
                  onClick={() => {
                    const isFirstPlayed = activeTrack?.trackId === allTracks[0].trackId;
                    if (isFirstPlayed) {
                      onPlayPause();
                    } else {
                      onSelectTrack(allTracks[0], allTracks);
                    }
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                    activeTrack && allTracks.some(t => t.trackId === activeTrack.trackId) && isPlaying
                      ? 'bg-[#84cc16] border-[#84cc16] text-black shadow-[0_0_15px_rgba(132,204,22,0.35)] hover:bg-[#99e623]'
                      : 'bg-white border-white text-black hover:bg-zinc-100'
                  }`}
                  title="Tocar tudo"
                >
                  {activeTrack && allTracks.some(t => t.trackId === activeTrack.trackId) && isPlaying ? (
                    <Pause className="w-4 h-4 text-black fill-black" />
                  ) : (
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Section: Title of Tracks list */}
          <div className="flex items-center justify-between mt-4 border-b border-zinc-900 pb-2 select-none">
            <h2 className="text-[12px] font-mono font-black tracking-widest text-[#8495b4] uppercase">
              MÚSICAS DESTE REPERTÓRIO
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Total de faixas: {allTracks.length}</span>
          </div>

          {/* Tracks List Container */}
          {allTracks.length === 0 ? (
            <div className="p-12 bg-[#181818] border border-dashed border-zinc-900 rounded-2xl text-center text-zinc-500 text-xs font-mono">
              Nenhuma música ativa foi vinculada a esta pasta.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 w-full">
              {allTracks.map((track, idx) => {
                const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
                const isActiveAndPlaying = isCurrentlyPlaying && isPlaying;
                const lyricsOpen = expandedLyricsTrackId === track.trackId;

                return (
                  <div 
                    key={track.trackId} 
                    className={`flex flex-col border rounded-xl transition-all ${
                      isCurrentlyPlaying 
                        ? 'bg-[#222222] border-[#84cc16]/40 shadow-[0_0_15px_rgba(132,204,22,0.04)]' 
                        : 'bg-[#121212] border-zinc-900/80 hover:border-zinc-800 hover:bg-[#161616]'
                    }`}
                  >
                    {/* Track Header row */}
                    <div 
                      onClick={() => {
                        if (isCurrentlyPlaying) {
                          onPlayPause();
                        } else {
                          onSelectTrack(track, allTracks);
                        }
                      }}
                      className={`flex items-center justify-between gap-4 p-4.5 cursor-pointer select-none transition-all rounded-xl ${isCurrentlyPlaying ? 'bg-zinc-950/20' : 'hover:bg-zinc-950/10'}`}
                    >
                      {/* Play Action + Title Block */}
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Play button with dynamic contrast color (White when paused/stopped, Green when active/playing) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrentlyPlaying) {
                              onPlayPause();
                            } else {
                              onSelectTrack(track, allTracks);
                            }
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer outline-none shrink-0 ${
                            isActiveAndPlaying
                              ? 'bg-[#84cc16] border-[#84cc16] text-black hover:bg-[#99e623]'
                              : 'bg-white border-white text-black hover:bg-zinc-100'
                          }`}
                        >
                          {isActiveAndPlaying ? (
                            <Pause className="w-4 h-4 text-black fill-black" />
                          ) : (
                            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0 text-left">
                          <h4 className={`text-base font-extrabold uppercase truncate tracking-wide ${isCurrentlyPlaying ? 'text-[#84cc16]' : 'text-zinc-100'}`}>
                            {track.title}
                          </h4>
                          {track.composer && (
                            <p className="text-xs text-zinc-500 font-mono uppercase mt-0.5 truncate">
                              Autor / Compositor: {track.composer}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (Letras, Carro) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Letra toggler */}
                        {track.lyrics && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLyricsTrackId(lyricsOpen ? null : track.trackId);
                            }}
                            className={`px-3 py-1.5 border rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                              lyricsOpen
                                ? 'bg-[#84cc16]/10 border-[#84cc16] text-[#84cc16]'
                                : 'bg-zinc-905 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                            title="Ver Letra"
                          >
                            Letra
                          </button>
                        )}

                        {/* Modo Carro toggler */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTrack(track, allTracks);
                            setCarMode(true);
                          }}
                          className="px-3 py-1.5 bg-zinc-905 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Modo Carro"
                        >
                          <Car className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="hidden sm:inline">Carro</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Expandable lyrics panel inside track block */}
                    {track.lyrics && lyricsOpen && (
                      <div className="px-5 pb-5 pt-3 border-t border-zinc-900 bg-zinc-950/40 text-left select-text rounded-b-xl">
                        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 mb-3">
                          <span className="text-[10px] font-mono tracking-widest text-[#eab308] font-extrabold uppercase">
                            Letra Completa
                          </span>
                          <button 
                            onClick={() => setExpandedLyricsTrackId(null)}
                            className="text-[9px] text-zinc-500 hover:text-white transition font-mono tracking-wider font-bold uppercase cursor-pointer"
                          >
                            Fechar ✕
                          </button>
                        </div>
                        <p className="text-zinc-300 font-sans text-sm leading-relaxed whitespace-pre-wrap select-text">
                          {track.lyrics}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111625] text-zinc-100 font-sans pb-32 relative overflow-hidden flex w-full">
      
      {/* Decorative vertical particles & overlay blur of image reference style */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-yellow-500/3 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff01_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>

      {/* FAR-LEFT SIDEBAR NAV (Original system sidebar) */}
      <aside className="w-56 bg-[#0c101d] border-r border-[#1b2438] h-screen sticky top-0 px-5 py-8 flex flex-col justify-between shrink-0 hidden lg:flex z-30 select-none">
        <div className="space-y-8">
          <div 
            onClick={() => onNavigate('landing')}
            className="cursor-pointer select-none group origin-left max-w-full overflow-hidden"
          >
            <BrandLogo size="sm" scale={logoScale || 1.0} showLogo={showLogo} customLogoUrl={customLogoUrl} />
          </div>

          <nav className="space-y-1.5 text-left">
            <h5 className="text-[10px] font-mono font-bold tracking-widest text-[#2f3f5c] uppercase pl-3 mb-2">SomDrive</h5>
            <button 
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#0c0f1d] border border-transparent hover:border-[#1c273d] transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              <Home className="w-4 h-4 text-zinc-500" />
              Início
            </button>

            <button 
              onClick={clearSharedContext}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-yellow-400 bg-[#eab308]/5 border border-[#eab308]/20 shadow-[0_0_15px_rgba(234,179,8,0.06)] transition-all text-xs font-mono font-bold uppercase tracking-wider relative cursor-default"
            >
              <span className="absolute left-0 top-3 bottom-3 w-[2px] bg-[#eab308] rounded-r"></span>
              <Disc className="w-4 h-4 text-[#eab308]" />
              Catálogo
            </button>

            <button 
              onClick={handleSpeakWithArtist}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#0c0f1d] border border-transparent hover:border-[#1c273d] transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              <Mail className="w-4 h-4 text-zinc-500" />
              Contato
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          <div className="px-3.5 py-3.5 bg-[#060a16] border border-[#16233e] rounded-xl self-start text-left shadow-lg">
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Plataforma Segura</span>
            </div>
            <p className="text-[9px] text-zinc-400 font-sans leading-normal">Obras 100% catalogadas com selo SomDrive.</p>
          </div>

          <div className="text-left text-[9px] text-zinc-500 font-mono">
            SomDrive © {new Date().getFullYear()}
          </div>
        </div>
      </aside>

      {/* COMPREHENSIVE RESPONSIVE GRID LAYOUT (Exact Visual Organization from Reference) */}
      <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: ARTIST PROFILE CARD (Fiel à imagem de referência) */}
        <section id="artist-profile-sidebar-card" className="w-full lg:w-72 shrink-0 flex flex-col">
          <div className="w-full bg-[#182033] border border-[#273554] rounded-2.5xl p-4 sm:p-5 md:p-6 text-left relative overflow-hidden sticky lg:top-6 shadow-[0_15px_35px_rgba(0,0,0,0.65)] select-none">
            
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-yellow-500 to-transparent"></div>
            
            {/* Visual Header & Verification Details */}
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00e676]/10 border border-[#00e676]/25 rounded-lg text-[9px] font-mono font-extrabold tracking-widest text-[#00e676] uppercase">
                <Check className="w-3 h-3 text-[#00e676] stroke-[3]" />
                <span>{artist.customBadgeText || "VERIFICADO"}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 uppercase">
                SOMDRIVE ID #SDR-{(artist.userId || '7824').substring(0, 4).toUpperCase()}
              </span>
            </div>

            {/* Split layout on mobile, standard column on desktop */}
            <div className="flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 mb-4 sm:mb-0 w-full">
              {/* Picture block */}
              <div className="w-[96px] h-[115px] sm:w-[150px] sm:h-[150px] lg:w-[130px] lg:h-[130px] xl:w-[160px] xl:h-[160px] sm:self-start rounded-xl bg-[#090e1a] border border-[#1b2b4d] overflow-hidden relative group shadow-md shrink-0 sm:mb-4">
                {artist.avatarUrl || artist.photoURL || artist.profileImageUrl ? (
                  <img 
                    src={artist.avatarUrl || artist.photoURL || artist.profileImageUrl} 
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0c0f18] to-slate-950 font-black text-2xl text-zinc-650 font-mono">
                    {(artist.name || 'S').substring(0, 1).toUpperCase()}
                  </div>
                )}
                {/* Overlay styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#182033]/80 via-transparent to-transparent opacity-90"></div>
              </div>

              {/* Metadata Text Details */}
              <div className="space-y-1.5 min-w-0 flex-1 sm:mb-5 text-left">
                <h2 className="text-[20px] sm:text-2xl font-heading font-black tracking-tight text-white uppercase flex items-center gap-1.5 flex-wrap">
                  {artist.name}
                  <svg className="w-4.5 h-4.5 sm:w-5 h-5 text-emerald-400 fill-emerald-400 shrink-0" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </h2>
                
                <div className="text-[10px] sm:text-[11px] font-mono font-bold text-yellow-500 tracking-wider uppercase">
                  {artist.userType || "COMPOSITOR"}
                </div>

                {/* Badges Info */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 sm:pt-1.5">
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#161c2c]/65 border border-[#1b2d4f] rounded-lg text-[9px] sm:text-[9px] font-mono font-extrabold text-zinc-300 uppercase tracking-widest">
                    {artist.genre || 'SERTANEJO'}
                  </span>
                  {artist.city && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#161c2c]/65 border border-[#1b2d4f] rounded-lg text-[9px] sm:text-[9px] font-mono font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-zinc-550" />
                      {artist.city} - {artist.state || 'GO'}
                    </span>
                  )}
                </div>

                <div className="pt-1.5 sm:pt-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[10.5px] font-mono font-medium text-zinc-400">
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00e676] animate-pulse"></span>
                  <span>{allTracks.length} músicas disponíveis</span>
                </div>
              </div>
            </div>

            {!selectedRepertoireId ? (
              /* Action Buttons pills matching image reference */
              <div className="space-y-2.5 w-full mt-4 sm:mt-5">
                {/* Grid 2 Columns for main action pills */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Secondary Gray Ouvir Artista */}
                  {allTracks.length > 0 ? (
                    <button 
                      onClick={() => onSelectTrack(allTracks[0], allTracks)}
                      className="w-full h-[38px] flex items-center justify-center gap-1.5 bg-[#141b2e]/90 hover:bg-[#1a233d] border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 rounded-xl text-[10px] sm:text-[10.5px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-97"
                    >
                      <Play className="w-3 h-3 fill-current stroke-[2]" />
                      <span>OUVIR</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full h-[38px] flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-650 rounded-xl text-[10.5px] font-mono uppercase tracking-wider select-none shrink-0"
                    >
                      Indisponível
                    </button>
                  )}

                  {/* Secondary Gray Contact block */}
                  <button 
                    onClick={handleSpeakWithArtist}
                    className="w-full h-[38px] flex items-center justify-center gap-1.5 bg-[#141b2e]/90 hover:bg-[#1a233d] border border-zinc-700/60 hover:border-zinc-500 text-zinc-200 hover:text-white rounded-xl text-[10px] sm:text-[10.5px] font-heading font-bold uppercase tracking-wider transition-all cursor-pointer select-none active:scale-97"
                  >
                    <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>CONTATO</span>
                  </button>
                </div>

                {/* Extra social horizontal bar containing Share profile, Insta, WhatsApp */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  <button 
                    onClick={handleCopyLinkDissemination}
                    className="h-[38px] bg-[#141b2e]/90 hover:bg-[#1a233d] border border-amber-500/25 hover:border-amber-500/50 rounded-xl text-yellow-400 hover:text-yellow-350 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Copiar Link de Divulgação"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button 
                    onClick={handleInstagramShare}
                    className="h-[38px] bg-[#141b2e]/90 hover:bg-[#1a233d] border border-zinc-700/50 hover:border-zinc-550 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Acessar Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </button>

                  <button 
                    onClick={handleShareWhatsApp}
                    className="h-[38px] bg-[#141b2e]/90 hover:bg-[#1a233d] border border-emerald-500/25 hover:border-emerald-500/50 rounded-xl text-emerald-400 hover:text-[#00e676] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Enviar por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <button 
                    onClick={handleGeneralProfileShare}
                    className="h-[38px] bg-[#141b2e]/90 hover:bg-[#1a233d] border border-cyan-500/25 hover:border-cyan-500/50 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Compartilhar Perfil"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative h-full">
                    <button 
                      onClick={() => setActiveProfileMenu(!activeProfileMenu)}
                      className={`h-[38px] bg-[#141b2e]/90 hover:bg-[#1a233d] border rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center w-full ${activeProfileMenu ? 'border-yellow-500' : 'border-zinc-700/50 hover:border-zinc-650'}`}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveProfileMenu(false)} />
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0a0f1d] border border-[#1b2a47] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] py-2 z-50 text-left">
                          <button
                            onClick={() => {
                              handleCopyLinkDissemination();
                              setActiveProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 hover:bg-[#111e3b] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar link do perfil
                          </button>
                          <button
                            onClick={() => {
                              handleShareWhatsApp();
                              setActiveProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 hover:bg-[#111e3b] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              setShowEmbedModal('profile');
                              setActiveProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 hover:bg-[#111e3b] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                          >
                            <Code className="w-3.5 h-3.5 text-yellow-500" /> Incorporar perfil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full mt-4 sm:mt-5 text-left">
                <button
                  onClick={clearSharedContext}
                  className="w-full h-[38px] flex items-center justify-center gap-2 bg-[#141b2e]/90 hover:bg-[#1a233d] border border-yellow-500/25 hover:border-yellow-500/50 text-yellow-500 hover:text-yellow-400 rounded-xl text-[10px] sm:text-[10.5px] font-heading font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-97"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>VER PERFIL COMPLETO</span>
                </button>
              </div>
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: REPERTOIRES & TRACKS (Frequência e beleza no estilo cadastrado) */}
        <section className="flex-1 w-full min-w-0 space-y-7 flex flex-col justify-start">
          
          {/* A. REPERTOIRES SECTION - Sliding Cards precisely organized */}
          <div className="space-y-3.5 select-none">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono font-black tracking-widest text-[#5c7094] uppercase flex items-center gap-2">
                <FolderHeart className="w-4.5 h-4.5 text-yellow-500" />
                <span>{openedAsRepertoireOnly ? 'REPERTÓRIO EXCLUSIVO' : 'REPERTÓRIOS & COLEÇÕES'}</span>
              </h3>
              
              <div className="flex items-center gap-4 text-xs font-mono">
                {isFilteredToSingleContext && (
                  <button 
                    onClick={clearSharedContext}
                    className="text-yellow-400 font-extrabold hover:underline"
                  >
                    Ver Tudo
                  </button>
                )}
                <span className="text-zinc-500">({openedAsRepertoireOnly ? '1' : repertoires.length})</span>
              </div>
            </div>

            {repertoires.length === 0 ? (
               <div className="p-6 bg-[#162035] border border-dashed border-[#25324e] rounded-2.5xl text-center text-zinc-400 text-xs font-mono">
                O artista ainda não separou suas guias em repertórios públicos.
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {repertoires
                  .filter(rep => !openedAsRepertoireOnly || rep.id === selectedRepertoireId || (rep.slug && rep.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase()))
                  .map((rep, idx) => {
                  const repTracksNum = (rep.trackIds || []).length;
                  const isRepActive = selectedRepertoireId === rep.id || (rep.slug && selectedRepertoireId === rep.slug);

                  // Unique vivid custom neon gradients for different folder cards to stand out beautifully
                  const neonGradients = [
                    'from-[#ffd600] via-[#00e676] to-[#00e5ff]',       // Yellow-Green-Cyan glow
                    'from-[#ff3d00] via-[#ff007f] to-[#7b2cbf]',       // Orange-Pink-Purple glow
                    'from-[#00e5ff] via-[#4d7cff] to-[#d500f9]',       // Cyan-Blue-Indigo glow
                    'from-[#00e676] via-[#aeea00] to-[#ffd600]',       // Electric Green-Volt-Yellow glow
                    'from-[#ff9100] via-[#ff3d00] to-[#ff007f]'        // Sunset Amber-Orange-Rose glow
                  ];

                  const glowShadows = [
                    'shadow-[0_0_15px_rgba(0,230,118,0.25)]',
                    'shadow-[0_0_15px_rgba(255,0,127,0.22)]',
                    'shadow-[0_0_15px_rgba(0,191,255,0.25)]',
                    'shadow-[0_0_15px_rgba(16eea,0,0.22)]',
                    'shadow-[0_0_15px_rgba(255,61,0,0.22)]'
                  ];

                  const cardColorText = isRepActive
                    ? ['text-yellow-400', 'text-[#ff007f]', 'text-cyan-455', 'text-[#00e676]', 'text-orange-455'][idx % 5]
                    : 'text-[#64748b] group-hover:text-white';

                  const badgeColorBg = isRepActive
                    ? ['bg-yellow-500/15 border-yellow-500/30 text-yellow-400', 'bg-rose-500/15 border-rose-500/30 text-rose-400', 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400', 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', 'bg-orange-500/15 border-orange-500/30 text-orange-400'][idx % 5]
                    : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400';

                  return (
                    <div 
                      key={rep.id}
                      onClick={() => setSelectedRepertoireId(rep.id)}
                      className={`min-w-[195px] sm:min-w-[215px] p-[1.5px] bg-gradient-to-br ${isRepActive ? neonGradients[idx % neonGradients.length] + ' ' + glowShadows[idx % glowShadows.length] : 'from-zinc-850 to-zinc-900/60 hover:from-zinc-700 hover:to-zinc-800'} rounded-2xl flex flex-col h-[162px] cursor-pointer transition-all relative group overflow-hidden active:scale-97 select-none`}
                    >
                      <div className={`w-full h-full p-4 rounded-[14px] flex flex-col justify-between relative z-10 transition-colors duration-250 ${isRepActive ? 'bg-[#212f4d] border border-[#00e676]/20' : 'bg-[#1a253e] hover:bg-[#1e2c4a] border border-[#273554]/30'}`}>
                        {/* Ambient shine in card with neon values */}
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${isRepActive ? 'from-emerald-500/12' : 'from-zinc-700/5'} to-transparent rounded-full pointer-events-none`}></div>

                        <div className="space-y-1 text-left relative z-10 w-full">
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[8.5px] font-mono tracking-widest font-extrabold uppercase border px-2 py-0.5 rounded-lg ${badgeColorBg}`}>
                              {rep.type === 'playlist' ? 'COLEÇÃO' : rep.type === 'project' ? 'PROJETO' : 'REPERTÓRIO'}
                            </span>
                            
                            {/* Share button style matching image reference */}
                            <button 
                              onClick={(e) => handleShareRepertoire(rep, e)}
                              className="p-1 px-1.5 text-[8.5px] font-mono text-zinc-400 hover:text-white bg-[#101625]/90 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Compartilhar este repertório"
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Share</span>
                            </button>
                          </div>

                          <h4 className={`text-[13.5px] font-heading font-black tracking-tight uppercase pt-2.5 transition-colors line-clamp-2 ${isRepActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                            {rep.name}
                          </h4>
                        </div>

                        {/* Waveform Fake Aesthetic Decor and Tracks count details */}
                        <div className="relative z-10 w-full">
                          {/* Elegant false waveforms of different neon options */}
                          <div className="flex items-end gap-[2px] h-6 mt-1 opacity-50 group-hover:opacity-90 transition-opacity">
                            <span className={`w-[1.5px] h-[6px] rounded-full animate-pulse bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[14px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[9px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[22px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[11px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[17px] rounded-full animate-pulse bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[6px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[15px] rounded-full bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[11px] rounded-full animate-bar-3 bg-current ${cardColorText}`}></span>
                            <span className={`w-[1.5px] h-[5px] rounded-full bg-current ${cardColorText}`}></span>
                          </div>

                          <div className="flex items-center justify-between pt-2 w-full">
                            <span className="text-[10px] font-mono tracking-wide text-zinc-400">{repTracksNum} {repTracksNum === 1 ? 'faixa' : 'faixas'}</span>
                            
                            {/* Play Repertoire Button */}
                            {repTracksNum > 0 && (
                              <button
                                onClick={(e) => handlePlayRepertoire(rep, e)}
                                className={`w-7.5 h-7.5 rounded-full hover:scale-105 flex items-center justify-center text-zinc-950 transition shadow cursor-pointer ${isRepActive ? 'bg-[#00e676] hover:bg-[#00c853]' : 'bg-zinc-800 hover:bg-zinc-700 text-white hover:text-[#00e676]'}`}
                                title="Tocar este repertório"
                              >
                                {isRepActive ? (
                                  <Play className="w-3.5 h-3.5 fill-current stroke-[3] ml-0.5 text-zinc-950" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-transparent stroke-[2] ml-0.5 text-current" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. DETAILED TRACKS LIST SECTION */}
          <div className="space-y-4">
            
            {/* Header section with search & filter inputs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#263554] pb-3.5">
              <div className="text-left">
                <h3 className="text-[13px] font-mono font-black tracking-widest text-[#5c7094] uppercase flex items-center gap-2">
                  <Disc className="w-4.5 h-4.5 text-emerald-400 rotate-slow" />
                  <span>{selectedRepertoireId ? "MÚSICAS DO REPERTÓRIO" : "MÚSICAS AVULSAS"}</span>
                </h3>
                {!selectedRepertoireId && !selectedSongId && (
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Músicas fora de repertórios (avulsas)
                  </p>
                )}
                {isFilteredToSingleContext && (
                  <div className="mt-1.5 inline-flex items-center gap-2 bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 rounded-full text-[10.5px] text-yellow-400 font-mono">
                    <span>{customCollectionLabel}</span>
                    <button 
                      onClick={clearSharedContext}
                      className="ml-1 text-white hover:text-red-400 text-xs font-bold font-sans cursor-pointer focus:outline-none"
                    >
                      (X)
                    </button>
                  </div>
                )}
              </div>

              {/* Responsive Inputs Box */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search input bar */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar músicas..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3.5 py-1.5 bg-[#162035] border border-[#263554] hover:border-zinc-500 rounded-xl text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all font-mono"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Genre trigger pill option */}
                <div className="relative">
                  <select
                    value={selectedGenreFilter}
                    onChange={(e) => setSelectedGenreFilter(e.target.value)}
                    className="px-3.5 py-1.5 bg-[#162035] border border-[#263554] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 font-mono uppercase font-bold focus:outline-none cursor-pointer focus:border-emerald-500 appearance-none pr-8"
                  >
                    {genres.map(g => (
                      <option key={g} value={g}>{g === 'All' ? 'TEMAS' : g}</option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            {whatsappShareAlert && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono rounded-xl text-center font-bold animate-pulse">
                Redirecionando de forma segura para o WhatsApp...
              </div>
            )}

            {allTracks.length === 0 ? (
              <div className="text-center py-16 bg-[#162035]/50 border border-[#263554] rounded-3xl text-zinc-400 text-xs font-mono">
                Artor ainda não disponibilizou nenhuma gravação ativa no acervo.
              </div>
            ) : activeDisplayTracks.length === 0 ? (
              <div className="text-center py-12 bg-[#162035]/50 border border-[#263554] rounded-2xl text-zinc-400 text-xs font-mono">
                Nenhuma gravação encontrada com as palavras buscadas / filtros.
              </div>
            ) : (
              /* High Polished List of Tracks modeled exactly as shown in screenshot */
              <div id="pub-tracks-list" className="border border-[#263554] rounded-2xl bg-[#162035]/70 backdrop-blur-md overflow-hidden text-left flex flex-col shadow-xl">
                
                {/* Headers Line Table Column */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#263554] text-[10px] font-mono uppercase tracking-widest text-[#8495b4] font-extrabold select-none">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">MÚSICA / GUIA EM MP3</div>
                  <div className="col-span-3">ESTILO / GÊNERO</div>
                  <div className="col-span-3 text-right">AÇÕES</div>
                </div>

                {/* Rows loops */}
                {activeDisplayTracks.map((track, idx) => {
                  const isCurrentlyPlaying = activeTrack?.trackId === track.trackId;
                  const isActiveAndPlaying = isCurrentlyPlaying && isPlaying;
                  const lyricsOpen = expandedLyricsTrackId === track.trackId;
                  
                  // mock durations or actual format
                  const mockTimes = ['03:10', '03:18', '03:05', '03:22', '02:54', '03:05', '03:12', '02:49'];
                  const durationText = mockTimes[idx % mockTimes.length];

                  return (
                    <div key={track.trackId} className="flex flex-col w-full border-b last:border-b-0 border-[#263554]/40">
                      
                      {/* Responsive Grid block */}
                      <div 
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            onPlayPause();
                          } else {
                            onSelectTrack(track, activeDisplayTracks);
                          }
                        }}
                        className={`grid grid-cols-12 gap-3 md:gap-4 px-4.5 sm:px-6 py-1.5 md:py-2 items-center cursor-pointer transition-all select-none border-l-[3.5px] group ${isCurrentlyPlaying ? 'bg-[#1a253e] border-l-emerald-400 shadow-inner' : 'border-l-transparent hover:border-l-zinc-500 hover:bg-[#1b2438]/65'}`}
                      >
                        {/* Col 1: Play trigger + index swap (Spotify style for ultimate elegance and minimum width) */}
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-start min-w-8">
                          {isCurrentlyPlaying ? (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayPause();
                              }}
                              className="w-7.5 h-7.5 rounded-full bg-[#00e676]/10 border border-[#00e676] flex items-center justify-center text-[#00e676] cursor-pointer focus:outline-none shrink-0"
                            >
                              {isActiveAndPlaying ? (
                                <Pause className="w-3.5 h-3.5 text-[#00e676] fill-[#00e676]" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <div className="relative w-7.5 h-7.5 flex items-center justify-start">
                              {/* Show index number, hide on row hover */}
                              <span className="font-mono text-[11px] font-bold text-zinc-400 block group-hover:hidden pl-1 select-none">
                                {(idx + 1).toString().padStart(2, '0')}
                              </span>
                              {/* Show play button icon on row hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTrack(track, activeDisplayTracks);
                                }}
                                className="hidden group-hover:flex w-7 h-7 rounded-full bg-[#1c253b] border border-zinc-700/50 items-center justify-center text-white hover:text-emerald-400 hover:border-emerald-500 transition-all cursor-pointer focus:outline-none"
                              >
                                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Col 2: Title & Waveform bar layout from Reference */}
                        <div className="col-span-7 sm:col-span-5 flex items-center gap-3 min-w-0">
                          
                          {/* Mini dynamic waveform indicator next to title */}
                          <div className="flex items-end gap-[1.5px] h-3.5 text-[#00e676] shrink-0 select-none hidden lg:flex mr-1">
                            <span className={`w-[1.5px] bg-[#00e676] max-h-3 rounded-full ${isActiveAndPlaying ? 'h-3 animate-bar-2' : 'h-1.5'}`}></span>
                            <span className={`w-[1.5px] bg-[#00e676] max-h-4.5 rounded-full ${isActiveAndPlaying ? 'h-4.5 animate-bar-3' : 'h-2.5'}`}></span>
                            <span className={`w-[1.5px] bg-[#00e676] max-h-2 rounded-full ${isActiveAndPlaying ? 'h-2 animate-bar-1' : 'h-1.5'}`}></span>
                          </div>

                          <div className="min-w-0 text-left">
                            <h4 className={`text-[16px] sm:text-[16px] font-heading font-black truncate uppercase tracking-wide ${isCurrentlyPlaying ? 'text-[#00e676]' : 'text-zinc-100'}`}>
                              {track.title}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-0.5 min-w-0">
                              {track.composer && (
                                <p className="text-[12px] sm:text-[12px] text-[#8495b4] font-mono uppercase truncate">
                                  Autor: {track.composer}
                                </p>
                              )}
                              <span className="inline-flex self-start px-1.5 py-[2px] bg-[#141b2e] border border-zinc-700/60 text-zinc-300 font-mono text-[10px] sm:text-[11px] font-bold rounded uppercase shrink-0">
                                {track.genre || 'Sertanejo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Col 3: Style descriptor tags */}
                        <div className="hidden sm:block sm:col-span-3 text-left">
                          <span className="px-2.5 py-1 bg-[#141b2e] border border-zinc-700/60 text-zinc-300 font-mono text-[9px] font-bold rounded-lg uppercase tracking-wider">
                            {track.genre || 'Sertanejo'}
                          </span>
                        </div>

                        {/* Col 4: Durations & popup menus */}
                        <div className="col-span-3 sm:col-span-3 text-right flex items-center justify-end gap-1 sm:gap-2 relative">
                          <span className="font-mono text-xs text-zinc-400 hidden md:inline">{durationText}</span>
                          
                          {/* WhatsApp contact regarding track */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactForTrack(track);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#00e676] hover:bg-emerald-500/10 border border-transparent rounded-lg z-10 transition-colors"
                            title="Conversar sobre esta guia de áudio"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Quick track sharing options menu */}
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTrackId(activeMenuTrackId === track.trackId ? null : track.trackId);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[#8495b4] hover:text-white rounded-lg hover:bg-[#20293d] border border-transparent hover:border-[#2d3a54] transition-colors cursor-pointer z-10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuTrackId === track.trackId && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuTrackId(null);
                                }} />
                                <div className="absolute right-0 mt-2 w-48 bg-[#182033] border border-[#2c3a5c] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] py-2 z-50 text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectTrack(track, activeDisplayTracks);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-[#1f283d] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Ouvir música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyTrackLink(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-[#1f283d] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Copiar link da música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareTrackWhatsApp(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-[#1f283d] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Compartilhar música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmbedTrack(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-[#1f283d] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Code className="w-3.5 h-3.5 text-yellow-500" /> Incorporar música
                                  </button>
                                  {track.lyrics && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedLyricsTrackId(lyricsOpen ? null : track.trackId);
                                        setActiveMenuTrackId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-[#1f283d] text-zinc-300 text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2 border-t border-[#263554]/45"
                                    >
                                      <Info className="w-3.5 h-3.5 text-amber-500" /> Letra da música
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Expandable lyrics block panel */}
                      {track.lyrics && lyricsOpen && (
                        <div className="p-5.5 bg-[#141c2d]/95 border-t border-b border-[#263554]/50 text-left">
                          <div className="flex items-center justify-between border-b border-[#263554]/40 pb-2 mb-3 select-none">
                            <span className="text-[9px] font-mono tracking-widest text-[#d4af37] font-extrabold uppercase flex items-center gap-1">
                              <Info className="w-3 h-3 text-[#d4af37]" /> Letra Completa
                            </span>
                            <button 
                              onClick={() => setExpandedLyricsTrackId(null)}
                              className="text-[9px] text-zinc-400 hover:text-white transition font-mono tracking-widest font-bold uppercase cursor-pointer"
                            >
                              [ fechar letra ]
                            </button>
                          </div>
                          <p className="whitespace-pre-line text-zinc-300 text-xs leading-relaxed font-sans font-medium select-text">{track.lyrics}</p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* C. BIO & ACQUISITION CARD OVERVIEW */}
          <div className="bg-[#182033] border border-[#273554] rounded-2.5xl p-6 text-left space-y-4">
            <h4 className="text-[10px] font-mono tracking-widest text-[#5c7094] uppercase font-bold">SOBRE O ARTISTA & COMPOSITOR</h4>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {artist.bio ? artist.bio : `O conceituado compositor ${artist.name} disponibiliza seu portfólio autoral, contendo guias de canções de alta fidelidade exclusivas para gravação e aquisição comercial de bandas, cantores e produtoras.`}
            </p>
          </div>

        </section>

      </main>

      {/* D. GENERAL POPUPS & MODALS */}

      {/* Alert Banner Popup */}
      {copiedLinkAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#eab308] border border-amber-300 text-[#03060f] px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(234,179,8,0.3)] animate-bounce font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 select-none">
          <Check className="w-4 h-4 stroke-[3.5]" />
          <span>{alertText}</span>
        </div>
      )}

      {/* Embed Code Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#182033] border border-[#273554] rounded-2.5xl max-w-lg w-full p-6 text-left space-y-4 shadow-2xl relative select-text">
            <h4 className="text-sm font-heading font-black tracking-widest text-yellow-500 uppercase">INCORPORAR ELEMENTO MUSICAL (EMBED)</h4>
            
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Copie o código HTML abaixo para embutir este elemento diretamente no seu site, blog, ou landing page institucional:
            </p>

            <textarea 
              readOnly
              value={showEmbedModal === 'profile' 
                ? `<iframe src="${window.location.origin}/catalogo/${artist.slug || artist.userId}" width="100%" height="600px" frameborder="0" style="border: 0; border-radius: 16px;"></iframe>`
                : `<iframe src="${window.location.origin}/catalogo/${artist.slug || artist.userId}?play=${showEmbedModal}&single=true" width="100%" height="180px" frameborder="0" style="border: 0; border-radius: 12px;"></iframe>`
              }
              className="w-full h-32 p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const val = showEmbedModal === 'profile' 
                    ? `<iframe src="${window.location.origin}/catalogo/${artist.slug || artist.userId}" width="100%" height="600px" frameborder="0" style="border: 0; border-radius: 16px;"></iframe>`
                    : `<iframe src="${window.location.origin}/catalogo/${artist.slug || artist.userId}?play=${showEmbedModal}&single=true" width="100%" height="180px" frameborder="0" style="border: 0; border-radius: 12px;"></iframe>`;
                  navigator.clipboard.writeText(val);
                  triggerAlert("🔗 Link de incorporação copiado com sucesso!");
                  setShowEmbedModal(null);
                }}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-mono font-bold uppercase tracking-wider rounded-xl cursor-not-allowed select-none"
              >
                Copiar Código HTML Code
              </button>

              <button
                onClick={() => setShowEmbedModal(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
