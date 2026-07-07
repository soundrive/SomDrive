import React, { useState, useEffect, useRef } from 'react';
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
  Folder,
  FolderOpen,
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

const normalizeVisibility = (
  value: unknown
): Repertoire['visibility'] => {
  if (
    value === 'public' ||
    value === 'unlisted' ||
    value === 'private' ||
    value === 'active'
  ) {
    return value;
  }

  return 'private';
};

const FOLDER_COLORS = [
  {
    name: 'verde_somdrive',
    primary: '#1ed760',
    border: 'border-[#1ed760]/35',
    borderActive: 'border-[#1ed760]',
    hoverBorder: 'hover:border-[#1ed760]/60',
    glow: 'shadow-[#1ed760]/10 hover:shadow-[#1ed760]/20',
    ring: 'ring-[#1ed760]/25',
    text: 'text-[#1ed760]',
    bg: 'bg-[#121c16]',
    textAccent: 'text-[#1ed760]'
  },
  {
    name: 'dourado',
    primary: '#f59e0b',
    border: 'border-[#f59e0b]/35',
    borderActive: 'border-[#f59e0b]',
    hoverBorder: 'hover:border-[#f59e0b]/60',
    glow: 'shadow-[#f59e0b]/10 hover:shadow-[#f59e0b]/20',
    ring: 'ring-[#f59e0b]/25',
    text: 'text-[#f59e0b]',
    bg: 'bg-[#1b1411]',
    textAccent: 'text-[#f59e0b]'
  },
  {
    name: 'azul',
    primary: '#3b82f6',
    border: 'border-[#3b82f6]/35',
    borderActive: 'border-[#3b82f6]',
    hoverBorder: 'hover:border-[#3b82f6]/60',
    glow: 'shadow-[#3b82f6]/10 hover:shadow-[#3b82f6]/20',
    ring: 'ring-[#3b82f6]/25',
    text: 'text-[#3b82f6]',
    bg: 'bg-[#111623]',
    textAccent: 'text-[#3b82f6]'
  },
  {
    name: 'roxo',
    primary: '#a855f7',
    border: 'border-[#a855f7]/35',
    borderActive: 'border-[#a855f7]',
    hoverBorder: 'hover:border-[#a855f7]/60',
    glow: 'shadow-[#a855f7]/10 hover:shadow-[#a855f7]/20',
    ring: 'ring-[#a855f7]/25',
    text: 'text-[#a855f7]',
    bg: 'bg-[#171120]',
    textAccent: 'text-[#a855f7]'
  },
  {
    name: 'ciano',
    primary: '#06b6d4',
    border: 'border-[#06b6d4]/35',
    borderActive: 'border-[#06b6d4]',
    hoverBorder: 'hover:border-[#06b6d4]/60',
    glow: 'shadow-[#06b6d4]/10 hover:shadow-[#06b6d4]/20',
    ring: 'ring-[#06b6d4]/25',
    text: 'text-[#06b6d4]',
    bg: 'bg-[#111920]',
    textAccent: 'text-[#06b6d4]'
  },
  {
    name: 'laranja',
    primary: '#f97316',
    border: 'border-[#f97316]/34',
    borderActive: 'border-[#f97316]',
    hoverBorder: 'hover:border-[#f97316]/65',
    glow: 'shadow-[#f97316]/10 hover:shadow-[#f97316]/20',
    ring: 'ring-[#f97316]/25',
    text: 'text-[#f97316]',
    bg: 'bg-[#1b1411]',
    textAccent: 'text-[#f97316]'
  },
  {
    name: 'cinza_premium',
    primary: '#cbd5e1',
    border: 'border-[#cbd5e1]/35',
    borderActive: 'border-[#cbd5e1]',
    hoverBorder: 'hover:border-[#cbd5e1]/60',
    glow: 'shadow-[#cbd5e1]/10 hover:shadow-[#cbd5e1]/20',
    ring: 'ring-[#cbd5e1]/25',
    text: 'text-[#cbd5e1]',
    bg: 'bg-[#151920]',
    textAccent: 'text-[#cbd5e1]'
  }
];

const getFolderColor = (index: number) => {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
};

const getCategoryIcon = (index: number, color: string) => {
  const iconIdx = index % 8;
  switch (iconIdx) {
    case 0:
      // Sertanejo: Music Note
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 1:
      // Românticas: Star
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 2:
      // Inéditas: Heart
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case 3:
      // Participações: Mic
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
        </svg>
      );
    case 4:
      // Modão: Guitar
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 9.5 3-3M17.5 11l3-3M12.5 13H15M8.5 16.5C7.5 16.5 6 15 6 13.5c0-1.5 2-3 4-3s4.5.5 4.5 2.5-2 3.5-6 3.5Z" />
          <path d="M14.5 10.5 21 4" />
        </svg>
      );
    case 5:
      // Trabalhos: Playlist Lines
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h11M3 6h18M3 14h11" />
          <path d="M17 14v6" />
          <circle cx="15" cy="20" r="2" />
        </svg>
      );
    case 6:
      // Ao Vivo: Flame
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    default:
      // Outros: Ellipsis (three dots)
      return (
        <svg className="w-8 h-8 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke={color}>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
  }
};

const ongoingVisits = new Set<string>();

function isNonAmbiguousId(id: string): boolean {
  const trimmed = id.trim();
  // 1. GUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return true;
  }
  // 2. Firebase Auth UID format: exactly 28 alphanumeric chars with mixed case and digits
  if (/^[A-Za-z0-9]{28}$/.test(trimmed)) {
    const hasLower = /[a-z]/.test(trimmed);
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasDigit = /[0-9]/.test(trimmed);
    if (hasLower && hasUpper && hasDigit) {
      return true;
    }
  }
  // 3. Firestore Auto-ID format: exactly 20 alphanumeric chars with mixed case and digits
  if (/^[A-Za-z0-9]{20}$/.test(trimmed)) {
    const hasLower = /[a-z]/.test(trimmed);
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasDigit = /[0-9]/.test(trimmed);
    if (hasLower && hasUpper && hasDigit) {
      return true;
    }
  }
  return false;
}

interface CatalogLoadResult {
  artist: Artist;
  resolvedUserId: string;
  repertoires: Repertoire[];
  tracks: Track[];
}

const activeRequests = new Map<string, Promise<CatalogLoadResult>>();

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
  const ongoingWhatsAppClicksRef = useRef<Set<string>>(new Set());
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lastLoadedParamsRef = useRef<{
    artistId: string;
    selectedRepertoireId: string | null;
    forceAllView: boolean;
  } | null>(null);
  const lastLoadedRepertoireIdRef = useRef<string | null>(null);
  
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

  // Invisible smart data saver state matching player's in-memory key
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
          const conn = (navigator as any).connection;
          if (conn?.saveData) return true;
          if (conn?.type === 'cellular') return true;
          const effective = conn?.effectiveType || '';
          if (['slow-2g', '2g', '3g'].includes(effective)) return true;
        }
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('soundrive_datasaver_changed', { detail: isDataSaver }));
    } catch (e) {}
  }, [isDataSaver]);

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (typeof customEvent.detail === 'boolean') {
        setIsDataSaver(customEvent.detail);
      }
    };
    window.addEventListener('soundrive_datasaver_changed', handleCustomChange);
    return () => {
      window.removeEventListener('soundrive_datasaver_changed', handleCustomChange);
    };
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom context menus / shares
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
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
    let active = true;

    const loadData = async () => {
      const startTime = Date.now();
      // Avoid redundant fetches if the parameters haven't changed (e.g. from slug to ID state updates)
      if (
        lastLoadedParamsRef.current &&
        lastLoadedParamsRef.current.artistId === artistId &&
        lastLoadedParamsRef.current.forceAllView === forceAllView &&
        (lastLoadedParamsRef.current.selectedRepertoireId === selectedRepertoireId ||
         (selectedRepertoireId && lastLoadedRepertoireIdRef.current === selectedRepertoireId))
      ) {
        if (active) {
          setIsLoading(false);
        }
        return;
      }

      if (active) {
        setIsLoading(true);
        setErrorMsg(null);
      }

      const requestKey = `${artistId}_${selectedRepertoireId || 'null'}_${forceAllView}`;

      try {
        let promise = activeRequests.get(requestKey);

        if (!promise) {
          promise = (async (): Promise<CatalogLoadResult> => {
            const normalizedArtistSlug = artistId.trim().toLowerCase();
            const candidateId = artistId.trim();

            let resolvedArtist: Artist | null = null;
            let resolvedUserId = '';
            let repsList: Repertoire[] = [];
            let rawSongs: Track[] = [];

            // 1. Determine if candidateId is a non-ambiguous ID
            const isId = isNonAmbiguousId(candidateId);
            let specMatched = false;

            if (isId) {
              // ID is non-ambiguous, query direct document first!
              const directSnap = await getDoc(doc(db, 'artists', candidateId)).catch(error => {
                console.error("PUBLIC CATALOG LOAD ERROR - artist direct fetch ID", {
                  colecao: "artists",
                  slug: normalizedArtistSlug,
                  ownerUid: candidateId,
                  codigo_erro: error?.code || "desconhecido",
                  mensagem: error?.message || String(error)
                });
                return null;
              });

              if (directSnap && directSnap.exists()) {
                resolvedArtist = dbService.mapFirestoreDocToArtist(directSnap.id, directSnap.data());
                resolvedUserId = directSnap.id;
                specMatched = true;

                // Fire parallel content loads ONLY after we know the artist exists!
                const repsPubPromise = getDocs(query(
                  collection(db, 'repertoires'),
                  where('ownerUid', '==', candidateId),
                  where('visibility', '==', 'public')
                )).catch(() => null);

                const repsActPromise = getDocs(query(
                  collection(db, 'repertoires'),
                  where('ownerUid', '==', candidateId),
                  where('visibility', '==', 'active')
                )).catch(() => null);

                const songsPromise = getDocs(query(
                  collection(db, 'songs'),
                  where('ownerId', '==', candidateId)
                ))
                .then(snap => ({ status: 'success' as const, data: snap }))
                .catch(err => ({ status: 'error' as const, error: err }));

                const [snapRepsPub, snapRepsAct, songsResult] = await Promise.all([
                  repsPubPromise,
                  repsActPromise,
                  songsPromise
                ]);

                // Process Repertoires
                if (snapRepsPub && !snapRepsPub.empty) {
                  snapRepsPub.forEach(docSnap => {
                    const d = docSnap.data();
                    repsList.push({
                      ...d,
                      id: docSnap.id,
                      ownerUid: d.ownerUid || '',
                      name: d.name || '',
                      slug: d.slug || '',
                      description: d.description || '',
                      type: d.type || 'repertoire',
                      trackIds: d.trackIds || [],
                      orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
                      visibility: normalizeVisibility(d.visibility),
                      createdAt: d.createdAt || new Date().toISOString(),
                      updatedAt: d.updatedAt || new Date().toISOString()
                    } as Repertoire);
                  });
                }

                if (snapRepsAct && !snapRepsAct.empty) {
                  snapRepsAct.forEach(docSnap => {
                    const d = docSnap.data();
                    if (!repsList.some(r => r.id === docSnap.id)) {
                      repsList.push({
                        ...d,
                        id: docSnap.id,
                        ownerUid: d.ownerUid || '',
                        name: d.name || '',
                        slug: d.slug || '',
                        description: d.description || '',
                        type: d.type || 'repertoire',
                        trackIds: d.trackIds || [],
                        orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
                        visibility: normalizeVisibility(d.visibility),
                        createdAt: d.createdAt || new Date().toISOString(),
                        updatedAt: d.updatedAt || new Date().toISOString()
                      } as Repertoire);
                    }
                  });
                }

                // Process Songs & Sequential Fallback to Legacy Musics
                if (songsResult.status === 'error') {
                  console.error("PRIMARY SONGS FETCH FAILED FOR ID:", songsResult.error);
                  throw songsResult.error;
                }

                const mainSongsList: Track[] = [];
                if (songsResult.status === 'success' && songsResult.data && !songsResult.data.empty) {
                  songsResult.data.forEach(songDoc => {
                    const sd = songDoc.data();
                    const trackId = songDoc.id;
                    if (sd.status !== 'inactive') {
                      mainSongsList.push({
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

                // Strictly apply primary songs vs legacy fallback rules
                if (mainSongsList.length > 0) {
                  rawSongs = mainSongsList;
                } else {
                  // Primary songs successfully fetched but has 0 active tracks. Try legacy fallback ON DEMAND (not preventively!).
                  const legacyResult = await getDocs(collection(db, 'artists', resolvedUserId, 'musics'))
                    .then(snap => ({ status: 'success' as const, data: snap }))
                    .catch(err => ({ status: 'error' as const, error: err }));

                  if (legacyResult.status === 'success' && legacyResult.data && !legacyResult.data.empty) {
                    legacyResult.data.forEach(songDoc => {
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
                  } else if (legacyResult.status === 'error') {
                    console.error("LEGACY SONGS FETCH FAILED FOR ID:", legacyResult.error);
                  }
                }
              }
            }

            if (!specMatched) {
              // Ambiguous slug/ID parameter (all other cases): Resolve slug first!
              const qArtist = query(collection(db, 'artists'), where('slug', '==', normalizedArtistSlug));
              const snapArtist = await getDocs(qArtist).catch(error => {
                console.error("PUBLIC CATALOG LOAD ERROR - artist slug query", {
                  colecao: "artists",
                  slug: normalizedArtistSlug,
                  ownerUid: "não_resolvido",
                  codigo_erro: error?.code || "desconhecido",
                  mensagem: error?.message || String(error)
                });
                return null;
              });

              if (snapArtist && !snapArtist.empty) {
                const docSnap = snapArtist.docs[0];
                resolvedArtist = dbService.mapFirestoreDocToArtist(docSnap.id, docSnap.data());
                resolvedUserId = docSnap.id;
              } else {
                // Only if slug query finishes and doesn't find the artist, execute direct getDoc as fallback
                const directSnap = await getDoc(doc(db, 'artists', candidateId)).catch(() => null);
                if (directSnap && directSnap.exists()) {
                  resolvedArtist = dbService.mapFirestoreDocToArtist(directSnap.id, directSnap.data());
                  resolvedUserId = directSnap.id;
                }
              }

              if (!resolvedArtist) {
                throw new Error("Artista não encontrado ou indisponível.");
              }

              // Load all contents in parallel only after we successfully resolved the artist ID
              const repsPubPromise = getDocs(query(
                collection(db, 'repertoires'),
                where('ownerUid', '==', resolvedUserId),
                where('visibility', '==', 'public')
              )).catch(() => null);

              const repsActPromise = getDocs(query(
                collection(db, 'repertoires'),
                where('ownerUid', '==', resolvedUserId),
                where('visibility', '==', 'active')
              )).catch(() => null);

              const songsPromise = getDocs(query(
                collection(db, 'songs'),
                where('ownerId', '==', resolvedUserId)
              ))
              .then(snap => ({ status: 'success' as const, data: snap }))
              .catch(err => ({ status: 'error' as const, error: err }));

              const [snapRepsPub, snapRepsAct, songsResult] = await Promise.all([
                repsPubPromise,
                repsActPromise,
                songsPromise
              ]);

              // Process Repertoires
              if (snapRepsPub && !snapRepsPub.empty) {
                snapRepsPub.forEach(docSnap => {
                  const d = docSnap.data();
                  repsList.push({
                    ...d,
                    id: docSnap.id,
                    ownerUid: d.ownerUid || '',
                    name: d.name || '',
                    slug: d.slug || '',
                    description: d.description || '',
                    type: d.type || 'repertoire',
                    trackIds: d.trackIds || [],
                    orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
                    visibility: normalizeVisibility(d.visibility),
                    createdAt: d.createdAt || new Date().toISOString(),
                    updatedAt: d.updatedAt || new Date().toISOString()
                  } as Repertoire);
                });
              }

              if (snapRepsAct && !snapRepsAct.empty) {
                snapRepsAct.forEach(docSnap => {
                  const d = docSnap.data();
                  if (!repsList.some(r => r.id === docSnap.id)) {
                    repsList.push({
                      ...d,
                      id: docSnap.id,
                      ownerUid: d.ownerUid || '',
                      name: d.name || '',
                      slug: d.slug || '',
                      description: d.description || '',
                      type: d.type || 'repertoire',
                      trackIds: d.trackIds || [],
                      orderedTrackIds: d.orderedTrackIds || d.trackIds || [],
                      visibility: normalizeVisibility(d.visibility),
                      createdAt: d.createdAt || new Date().toISOString(),
                      updatedAt: d.updatedAt || new Date().toISOString()
                    } as Repertoire);
                  }
                });
              }

              // Process Songs & Legacy Fallback
              if (songsResult.status === 'error') {
                console.error("PRIMARY SONGS FETCH FAILED FOR SLUG/ID:", songsResult.error);
                throw songsResult.error;
              }

              const mainSongsList: Track[] = [];
              if (songsResult.status === 'success' && songsResult.data && !songsResult.data.empty) {
                songsResult.data.forEach(songDoc => {
                  const sd = songDoc.data();
                  const trackId = songDoc.id;
                  if (sd.status !== 'inactive') {
                    mainSongsList.push({
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

              // Fallback legacy logic strictly matching the specification (not preventively!)
              if (mainSongsList.length > 0) {
                rawSongs = mainSongsList;
              } else {
                // Primary songs successfully fetched but has 0 active tracks. Try legacy fallback ON DEMAND (not preventively!).
                const legacyResult = await getDocs(collection(db, 'artists', resolvedUserId, 'musics'))
                  .then(snap => ({ status: 'success' as const, data: snap }))
                  .catch(err => ({ status: 'error' as const, error: err }));

                if (legacyResult.status === 'success' && legacyResult.data && !legacyResult.data.empty) {
                  legacyResult.data.forEach(songDoc => {
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
                } else if (legacyResult.status === 'error') {
                  console.error("LEGACY SONGS FETCH FAILED FOR SLUG/ID:", legacyResult.error);
                }
              }
            }

            return {
              artist: resolvedArtist!,
              resolvedUserId,
              repertoires: repsList,
              tracks: rawSongs
            };
          })();

          activeRequests.set(requestKey, promise);

          promise.finally(() => {
            activeRequests.delete(requestKey);
          });
        }

        const startTime = performance.now();
        const { artist: resolvedArtist, resolvedUserId, repertoires: repsList, tracks: rawSongs } = await promise;
        const endTime = performance.now();
        if ((import.meta as any).env?.DEV) {
          console.log(`[PERFORMANCE] loadData resolved in ${(endTime - startTime).toFixed(2)}ms`);
        }

        if (!active) return;

        setArtist(resolvedArtist);
        setRepertoires(repsList);

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
          lastLoadedRepertoireIdRef.current = currentRepertoire.id;
        } else {
          // General catalog: show all active tracks, sort them cleanly by orderIndex / position
          const sortedAllTracks = rawSongs.sort((a, b) => {
            const posA = a.orderIndex !== undefined ? a.orderIndex : (a.position !== undefined ? a.position : 99999);
            const posB = b.orderIndex !== undefined ? b.orderIndex : (b.position !== undefined ? b.position : 99999);
            return posA - posB;
          });
          setAllTracks(sortedAllTracks);
          lastLoadedRepertoireIdRef.current = null;
        }

        // Save last loaded params
        lastLoadedParamsRef.current = {
          artistId,
          selectedRepertoireId,
          forceAllView
        };

        setIsLoading(false);
        setIsInitialLoadDone(true);

        // Increment views in background with exclusion and unique 24h checks
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
        const isRobot = /bot|crawler|spider|facebookexternalhit|whatsapp|twitterbot|linkedinbot|embedly|quora link preview|gofetch|rogue/i.test(userAgent);
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isAIStudioPreview = hostname.includes('ais-dev-') || hostname.includes('ais-pre-') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
        const isPrerender = typeof document !== 'undefined' && (document.visibilityState as string) === 'prerender';

        if (!isRobot && !isAIStudioPreview && !isPrerender && resolvedUserId) {
          const lastVisitKey = `soundrive_last_visit_${resolvedUserId}`;
          const lastVisit = localStorage.getItem(lastVisitKey);
          const now = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000;

          if (!lastVisit || (now - parseInt(lastVisit, 10)) >= oneDayMs) {
            if (!ongoingVisits.has(resolvedUserId)) {
              ongoingVisits.add(resolvedUserId);
              dbService.incrementAnalyticsView(resolvedUserId, true, false)
                .then(() => {
                  localStorage.setItem(lastVisitKey, Date.now().toString());
                })
                .catch((err) => {
                  console.error("Failed to persist unique visit in Firestore:", err);
                })
                .finally(() => {
                  ongoingVisits.delete(resolvedUserId);
                });
            }
          }
        }

      } catch (err: any) {
        if (!active) return;
        console.error("Firestore loading error inside ArtistPublic:", {
          code: err?.code,
          message: err?.message,
          name: err?.name
        });
        setErrorMsg("Erro ao carregar o catálogo. Por favor, tente novamente.");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsInitialLoadDone(true);
          const loadDuration = Date.now() - startTime;
          if (loadDuration > 1500) {
            setIsDataSaver(true);
          }
        }
      }
    };
    loadData();

    return () => {
      active = false;
    };
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

  const handleWhatsAppRedirectAndTrack = (buttonId: string, whatsappUrl: string) => {
    if (!artist) return;
    
    // Prevent concurrent tracking for the same event
    if (ongoingWhatsAppClicksRef.current.has(buttonId)) {
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Check 5-second duplicate click lock
    const key = `soundrive_last_wa_${artist.userId}_${buttonId}`;
    const lastClick = localStorage.getItem(key);
    const now = Date.now();
    if (lastClick && (now - parseInt(lastClick, 10)) < 5000) {
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Open blank window immediately to prevent popup blocking
    const newWindow = window.open('about:blank', '_blank');

    ongoingWhatsAppClicksRef.current.add(buttonId);

    let redirected = false;

    const performRedirect = () => {
      if (redirected) return;
      redirected = true;
      if (newWindow) {
        newWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }
    };

    // Timeout of 1.8 seconds: redirect anyway even if Firestore is slow
    const redirectTimeout = setTimeout(() => {
      performRedirect();
    }, 1800);

    dbService.incrementAnalyticsView(artist.userId, false, false)
      .then(() => {
        // Save the 5-second lock timestamp ONLY after successful Firestore persistence
        localStorage.setItem(key, Date.now().toString());
        performRedirect();
      })
      .catch((err) => {
        console.error("Failed to increment WhatsApp click metrics in Firestore:", err);
        performRedirect();
      })
      .finally(() => {
        clearTimeout(redirectTimeout);
        ongoingWhatsAppClicksRef.current.delete(buttonId);
      });
  };

  const handleShareWhatsApp = () => {
    const appBaseUrl = window.location.origin;
    const artistSlug = artist.slug || artist.userId;
    const foundRep = selectedRepertoireId ? repertoires.find(r => r.id === selectedRepertoireId || (r.slug && r.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase())) : null;
    let pageUrl = `${appBaseUrl}/s/${artistSlug}`;
    let messageText = `🎧 Ouça meu catálogo musical no SomDrive!\n\nAqui estão minhas composições disponíveis:\n${pageUrl}`;

    if (foundRep) {
      pageUrl = `${appBaseUrl}/s/${artistSlug}/repertorio/${foundRep.slug || foundRep.id}`;
      messageText = `Ouça o repertório “${foundRep.name}” de ${artist.name} no SomDrive: ${pageUrl}`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    handleWhatsAppRedirectAndTrack('share', whatsappUrl);
    
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

  const handleSpeakWithArtist = () => {
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = `Olá ${artist.name}, encontrei seu catálogo de composições no SomDrive e gostaria de conversar sobre contratação autorais e licenciamentos!`;
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(greetingText)}`;
    handleWhatsAppRedirectAndTrack('speak', whatsappUrl);
  };

  const handleContactForTrack = (track: Track) => {
    const whatsappNum = artist.whatsapp?.replace(/\D/g, '') || "5562999999999";
    const greetingText = `Olá ${artist.name}, encontrei sua composição "${track.title}" no catálogo SomDrive e tenho alto interesse em gravá-la / ouvir a guia de áudio!`;
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(greetingText)}`;
    handleWhatsAppRedirectAndTrack(`track_${track.trackId}`, whatsappUrl);
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
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    handleWhatsAppRedirectAndTrack(`share_track_${track.trackId}`, whatsappUrl);
    setActiveMenuTrackId(null);
  };

  const handleEmbedTrack = (track: Track) => {
    setShowEmbedModal(track.trackId);
    setActiveMenuTrackId(null);
  };

  if (openedAsRepertoireOnly && artist && currentRepertoire) {
    const repIndex = repertoires.findIndex(r => r.id === currentRepertoire.id);
    const folderColor = getFolderColor(repIndex >= 0 ? repIndex : 0);

    return (
      <div className="min-h-screen bg-[#0f121d] text-zinc-100 font-sans pb-32 relative overflow-x-hidden flex flex-col items-center w-full">
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
          
          {/* Main Folder/Repertoire Card (Dark Graphite CSS vector-based, elegant) */}
          <div className={`w-full bg-[#161c28] border ${folderColor.border} rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl ${folderColor.glow} select-none relative overflow-visible group`}>
            {/* Subtle flow radial blur */}
            <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br from-${folderColor.primary}/10 to-transparent blur-2xl pointer-events-none`}></div>

            <div className="space-y-4 text-left flex-1 min-w-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 48 40" className="w-8 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back flap */}
                    <path d="M4 10C4 7.79086 5.79086 6 8 6H16.5L20.5 11H40C42.2091 11 44 12.7909 44 15V32C44 34.2091 42.2091 36 40 36H8C5.79086 36 4 34.2091 4 32V10Z" fill={`${folderColor.primary}15`} stroke={folderColor.primary} strokeWidth="2" />
                    {/* Front pocket layer */}
                    <path d="M4 16C4 13.7909 5.79086 12 8 12H40C42.2091 12 44 13.7909 44 16V32C44 34.2091 42.2091 36 40 36H8C5.79086 36 4 34.2091 4 32V16Z" fill={`${folderColor.primary}25`} stroke={folderColor.primary} strokeWidth="2" />
                  </svg>
                </div>
                <span className={`inline-block text-[9px] md:text-[10px] font-mono font-black tracking-widest px-3 py-1 rounded-full uppercase ${folderColor.bg} ${folderColor.text} border border-white/5`}>
                  REPERTÓRIO PÚBLICO
                </span>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-white text-2xl sm:text-3xl md:text-3xl font-black tracking-tight break-words pr-2 leading-tight uppercase font-heading">
                  {currentRepertoire.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300 font-mono text-xs sm:text-sm font-bold">
                  <span>Compositor: {artist.name}</span>
                  <span className="text-zinc-600 select-none">•</span>
                  <span className={folderColor.text}>{allTracks.length} {allTracks.length === 1 ? 'faixa' : 'faixas'}</span>
                </div>
              </div>

              {/* Descrição cadastrada no repertório */}
              {currentRepertoire.description && currentRepertoire.description.trim().length > 0 && (
                <p className="text-slate-300 text-xs sm:text-sm bg-slate-900/30 border border-white/5 rounded-lg p-2.5 leading-relaxed max-w-2xl">
                  <span className="font-semibold text-zinc-400">Descrição:</span> {currentRepertoire.description}
                </p>
              )}

              {/* Action Buttons: Contato | Instagram | Compartilhar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 select-none">
                {!!(artist.whatsapp || artist.phone) && (
                  <button
                    onClick={() => {
                      const cleanNum = (artist.whatsapp || artist.phone || '').replace(/\D/g, '');
                      const greeting = encodeURIComponent(`Olá ${artist.name}, encontrei seu catálogo de composições no SomDrive e gostaria de conversar sobre contratação autorais e licenciamentos!`);
                      const whatsappUrl = `https://wa.me/${cleanNum}?text=${greeting}`;
                      handleWhatsAppRedirectAndTrack('repertoire_contact', whatsappUrl);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20 transition-all border border-[#1ed760]/15 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Contato</span>
                  </button>
                )}
                {!!(artist.instagram && artist.instagram.trim().length > 0) && (
                  <button
                    onClick={() => {
                      const igUrl = `https://instagram.com/${artist.instagram.replace(/@/g, '').trim()}`;
                      window.open(igUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all border border-zinc-800/80 cursor-pointer"
                  >
                    <Instagram className="w-3 h-3 text-pink-500" />
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all border border-zinc-800/80 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" style={{ color: folderColor.primary }} />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Actions Block: Standalone Play everything button */}
            <div className="flex flex-wrap items-center gap-3.5 shrink-0 z-10">
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
                  style={{
                    backgroundColor: folderColor.primary,
                    boxShadow: `0 0 20px ${folderColor.primary}40`
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all scale-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0 text-slate-950 hover:brightness-110"
                  title="Tocar tudo"
                >
                  {activeTrack && allTracks.some(t => t.trackId === activeTrack.trackId) && isPlaying ? (
                    <Pause className="w-5 h-5 text-slate-950 fill-slate-950 stroke-[3]" />
                  ) : (
                    <Play className="w-5 h-5 text-slate-950 fill-slate-950 ml-0.5" />
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

                        <div className="min-w-0 text-left flex-1">
                          <h4 className={`text-base font-extrabold uppercase truncate tracking-wide ${isCurrentlyPlaying ? 'text-[#84cc16]' : 'text-zinc-100'}`}>
                            {track.title}
                          </h4>
                          {track.composer && (
                            <p className="text-xs text-zinc-500 font-mono uppercase mt-0.5 truncate">
                              Autor / Compositor: {track.composer}
                            </p>
                          )}
                          {track.description && typeof track.description === 'string' && track.description.trim() && (
                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2 font-sans pr-2 normal-case">
                              {track.description}
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
    <div className="min-h-screen bg-[#0f121d] text-zinc-100 font-sans pb-32 relative overflow-hidden flex w-full">
      
      {/* Decorative vertical particles & overlay blur of image reference style */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#10b981]/4 rounded-full blur-[160px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-emerald-500/2 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff01_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0"></div>

      {/* FAR-LEFT SIDEBAR NAV (Original system sidebar) */}
      <aside className="w-56 bg-[#09090b] border-r border-[#1a1a1c] h-screen sticky top-0 px-5 py-8 flex flex-col justify-between shrink-0 hidden lg:flex z-30 select-none">
        <div className="space-y-8">
          <div 
            onClick={() => onNavigate('landing')}
            className="cursor-pointer select-none group origin-left max-w-full overflow-hidden"
          >
            <BrandLogo size="sm" scale={logoScale || 1.0} showLogo={showLogo} customLogoUrl={customLogoUrl} />
          </div>

          <nav className="space-y-1.5 text-left">
            <h5 className="text-[10px] font-mono font-bold tracking-widest text-[#5c7094] uppercase pl-3 mb-2">SomDrive</h5>
            <button 
              onClick={() => onNavigate('landing')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181c] border border-transparent hover:border-zinc-800 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              <Home className="w-4 h-4 text-zinc-500" />
              Início
            </button>

            <button 
              onClick={clearSharedContext}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#10b981] bg-[#10b981]/5 border border-[#10b981]/20 shadow-[0_0_15px_rgba(16,185,129,0.06)] transition-all text-xs font-mono font-bold uppercase tracking-wider relative cursor-default"
            >
              <span className="absolute left-0 top-3 bottom-3 w-[2px] bg-[#10b981] rounded-r"></span>
              <Disc className="w-4 h-4 text-[#10b981]" />
              Catálogo
            </button>

            <button 
              onClick={handleSpeakWithArtist}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181c] border border-transparent hover:border-zinc-800 transition-all text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              <Mail className="w-4 h-4 text-zinc-500" />
              Contato
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          <div className="px-3.5 py-3.5 bg-[#18181c] border border-zinc-800 rounded-xl self-start text-left shadow-lg">
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-[#10b981] font-extrabold tracking-widest uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0" />
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
          <div className="w-full bg-[#18181c] border border-zinc-800/80 rounded-2.5xl p-4 sm:p-5 md:p-6 text-left relative overflow-hidden sticky lg:top-6 shadow-[0_15px_35px_rgba(0,0,0,0.65)] select-none">
            
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#10b981] via-emerald-500 to-transparent"></div>
            
            {/* Visual Header & Verification Details */}
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#10b981]/10 border border-[#10b981]/25 rounded-lg text-[9px] font-mono font-extrabold tracking-widest text-[#10b981] uppercase">
                <Check className="w-3 h-3 text-[#10b981] stroke-[3]" />
                <span>{artist.customBadgeText || "VERIFICADO"}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 uppercase">
                SOMDRIVE ID #SDR-{(artist.userId || '7824').substring(0, 4).toUpperCase()}
              </span>
            </div>

            {/* Split layout on mobile, standard column on desktop */}
            <div className="flex sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 mb-4 sm:mb-0 w-full">
              {/* Picture block */}
              <div className="w-[96px] h-[115px] sm:w-[150px] sm:h-[150px] lg:w-[130px] lg:h-[130px] xl:w-[160px] xl:h-[160px] sm:self-start rounded-xl bg-[#090d14] border border-zinc-800 overflow-hidden relative group shadow-md shrink-0 sm:mb-4">
                {(artist.avatarUrl || artist.photoURL || artist.profileImageUrl) && !isDataSaver ? (
                  <img 
                    src={artist.avatarUrl || artist.photoURL || artist.profileImageUrl} 
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  /* High-end smart streaming CSS placeholder */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950/40 relative group-hover:scale-105 transition-transform duration-500">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                      <span className="text-xl sm:text-2xl font-black text-[#10b981] tracking-tight font-sans">
                        {(artist?.name || 'S').substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                {/* Overlay styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181c]/80 via-transparent to-transparent opacity-90 pointer-events-none"></div>
              </div>

              {/* Metadata Text Details */}
              <div className="space-y-1.5 min-w-0 flex-1 sm:mb-5 text-left">
                <h2 className="text-[20px] sm:text-2xl font-heading font-black tracking-tight text-white uppercase flex items-center gap-1.5 flex-wrap">
                  {artist.name}
                  <svg className="w-4.5 h-4.5 sm:w-5 h-5 text-[#10b981] fill-[#10b981] shrink-0" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </h2>
                
                <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#10b981] tracking-wider uppercase">
                  {artist.userType || "COMPOSITOR"}
                </div>

                {/* Badges Info */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 sm:pt-1.5">
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-[9px] sm:text-[9px] font-mono font-extrabold text-zinc-300 uppercase tracking-widest">
                    {artist.genre || 'SERTANEJO'}
                  </span>
                  {artist.city && (
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-[9px] sm:text-[9px] font-mono font-extrabold text-zinc-400 tracking-wider flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-zinc-500" />
                      {artist.city} - {artist.state || 'GO'}
                    </span>
                  )}
                </div>

                <div className="pt-1.5 sm:pt-3 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[10.5px] font-mono font-medium text-zinc-400">
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                  <span>{allTracks.length} músicas disponíveis</span>
                </div>
              </div>
            </div>

            {!selectedRepertoireId ? (
              /* High-End, Sleeker & Compact Action Buttons Pills (h-[34px] rounded-lg compact layout) */
              <div className="space-y-2 w-full mt-4 sm:mt-5">
                {/* Grid 2 Columns for main action pills */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Primary Highlighted Ouvir Button with radiant gradient filling */}
                  {allTracks.length > 0 ? (
                     <button 
                      onClick={() => onSelectTrack(allTracks[0], allTracks)}
                      className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#10b981] to-[#05c46b] hover:brightness-110 text-zinc-950 rounded-lg text-[9px] font-mono font-extrabold tracking-widest transition-all cursor-pointer select-none active:scale-97 shadow-[0_2px_12px_rgba(16,185,129,0.25)]"
                    >
                      <Play className="w-3 h-3 fill-current stroke-none" />
                      <span>OUVIR</span>
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-650 rounded-lg text-[9px] font-mono font-bold tracking-widest uppercase select-none shrink-0"
                    >
                      OFFLINE
                    </button>
                  )}

                  {/* Clean Contrast Contact Button with active hover theme change */}
                  <button 
                    onClick={handleSpeakWithArtist}
                    className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-[#10b981]/5 border border-zinc-800/80 hover:border-[#10b981]/35 text-zinc-300 hover:text-[#10b981] rounded-lg text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer select-none active:scale-97"
                  >
                    <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>CONTATO</span>
                  </button>
                </div>

                {/* Elegant second row: Copy Link with subtle gold hover, Instagram with pink hover */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleCopyLinkDissemination}
                    className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-amber-500/5 border border-zinc-800/80 hover:border-amber-500/35 text-zinc-300 hover:text-amber-400 rounded-lg text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer active:scale-95"
                    title="Copiar Link de Divulgação"
                  >
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>DIVULGAR</span>
                  </button>

                  <button 
                    onClick={handleInstagramShare}
                    className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-pink-500/5 border border-zinc-800/80 hover:border-pink-500/35 text-zinc-300 hover:text-pink-400 rounded-lg text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer active:scale-95"
                    title="Acessar Instagram"
                  >
                    <Instagram className="w-3 h-3 text-zinc-400" />
                    <span>INSTAGRAM</span>
                  </button>
                </div>
              </div>
            ) : (
              !openedAsRepertoireOnly && (
                <div className="w-full mt-4 sm:mt-5 text-left">
                  <button
                    onClick={clearSharedContext}
                    className="w-full h-[34px] flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-[#10b981]/5 border border-zinc-800/80 hover:border-[#10b981]/35 text-[#10b981] hover:text-emerald-400 rounded-lg text-[9px] font-mono font-bold tracking-widest transition-all cursor-pointer select-none active:scale-97"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>PERFIL COMPLETO</span>
                  </button>
                </div>
              )
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: REPERTOIRES & TRACKS (Frequência e beleza no estilo cadastrado) */}
        <section className="flex-1 w-full min-w-0 p-5 sm:p-7 md:p-8 bg-gradient-to-br from-[#0b130f] via-[#070908] to-[#121212] border border-[#10b981]/25 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] relative space-y-7 flex flex-col justify-start z-10">
          <div className="absolute top-0 inset-y-0 right-0 w-[240px] bg-[#10b981]/3 rounded-full blur-[110px] pointer-events-none z-0"></div>
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-[#10b981]/50 via-[#10b981]/10 to-transparent"></div>
          
          <div className="relative z-10 space-y-7 flex flex-col justify-start w-full">
          
          {/* A. REPERTOIRES SECTION - Sliding Cards precisely organized */}
          <div className="space-y-3.5 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-sans font-extrabold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                  <FolderHeart className="w-4 h-4 text-[#1ed760]" />
                  <span>{openedAsRepertoireOnly ? 'REPERTÓRIO EXCLUSIVO' : 'REPERTÓRIOS & COLEÇÕES'}</span>
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-emerald-500/25 text-[#1ed760] rounded-full bg-emerald-500/10">
                  {openedAsRepertoireOnly ? '1' : repertoires.length}
                </span>
              </div>
              
              {!openedAsRepertoireOnly && (
                <button 
                  onClick={clearSharedContext}
                  className="text-emerald-500 hover:text-emerald-400 font-sans font-bold text-[11px] sm:text-xs select-none cursor-pointer transition-all hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>

            {repertoires.length === 0 ? (
               <div className="p-6 bg-[#18181c] border border-dashed border-zinc-800 rounded-2.5xl text-center text-zinc-400 text-xs font-mono">
                O artista ainda não separou suas guias em repertórios públicos.
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="flex overflow-x-auto gap-[18px] pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent snap-x select-none">
                  {repertoires
                    .filter(rep => !openedAsRepertoireOnly || rep.id === selectedRepertoireId || (rep.slug && selectedRepertoireId && rep.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase()))
                    .map((rep, idx) => {
                      const repTracksNum = (rep.trackIds || []).length;
                      const isRepActive = selectedRepertoireId === rep.id || (rep.slug && selectedRepertoireId && rep.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase());
                      const folderColor = getFolderColor(idx);

                      return (
                        <div 
                          key={rep.id}
                          onClick={() => setSelectedRepertoireId(rep.id)}
                          className={`min-w-[145px] sm:min-w-[170px] w-[145px] sm:w-[170px] h-[215px] sm:h-[235px] cursor-pointer transition-all duration-300 relative group select-none snap-center flex flex-col justify-between p-3 sm:p-4 rounded-xl border ${
                            isRepActive 
                              ? folderColor.borderActive + " bg-[#151a29]" 
                              : folderColor.border + " bg-[#121622]/90 hover:bg-[#151a29]"
                          } shadow-md overflow-visible`}
                        >
                          {/* Soft glow matching color */}
                          <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/5 to-transparent blur-2xl pointer-events-none"></div>

                          {/* 2. Top labels bar */}
                          <div className="relative z-10 flex items-center justify-between w-full select-none pl-0.5">
                            <div className="flex items-center gap-1.5 uppercase font-[#1ed760] font-mono text-[7px] sm:text-[8px] font-extrabold tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folderColor.primary }}></span>
                              <span className={isRepActive ? 'text-white/90' : 'text-zinc-500'}>PASTA</span>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareRepertoire(rep, e);
                              }}
                              className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                                isRepActive
                                  ? 'text-[#1ed760] bg-slate-900/60 border border-[#1ed760]/20 hover:bg-slate-900'
                                  : 'text-slate-400 hover:text-white bg-black/40 border border-white/5 hover:bg-black/60'
                              }`}
                              title="Copiar link da pasta"
                              aria-label="Copiar link da pasta"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 3. Center big thematic vector category icon inside physical folder */}
                          <div className="relative w-full h-[75px] sm:h-[85px] flex items-center justify-center select-none pointer-events-none mt-1">
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <svg viewBox="0 0 100 75" className="w-[100px] sm:w-[110px] h-[75px] sm:h-[82px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path 
                                  d="M10,21 L10,13 C10,10.5 12,8.5 14.5,8.5 L36,8.5 C38.5,8.5 40.2,10 41.8,12 L47,21 Z"
                                  fill={folderColor.primary}
                                  className="transition-all duration-300"
                                />
                                <rect 
                                  x="10" 
                                  y="21" 
                                  width="80" 
                                  height="45" 
                                  rx="6" 
                                  fill={`${folderColor.primary}05`}
                                  stroke={folderColor.primary} 
                                  strokeWidth="1.8" 
                                  className="transition-all duration-300"
                                />
                              </svg>
                            </div>

                            <div className="relative z-10 transition-transform duration-300 group-hover:scale-110 mt-1.5 flex items-center justify-center">
                              {getCategoryIcon(idx, isRepActive ? folderColor.primary : `${folderColor.primary}dd`)}
                            </div>
                          </div>

                          {/* 4. Folder descriptive tag & Name */}
                          <div className="space-y-0.5 text-center relative z-10 w-full px-1 pointer-events-none">
                            <h4 className={`text-[12px] sm:text-[13px] font-sans font-extrabold uppercase truncate max-w-full transition-all duration-300 ${
                              isRepActive ? 'text-[#1ed760]' : 'text-slate-100 group-hover:text-[#1ed760]'
                            }`}>
                              {rep.name}
                            </h4>
                            <span className="text-[9.5px] sm:text-[10px] font-sans font-medium text-slate-400 block">
                              {repTracksNum} {repTracksNum === 1 ? 'música' : 'músicas'}
                            </span>
                          </div>

                          {/* 5. Center-bottom Play circle button and right Chevron indicator */}
                          <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-slate-800/50 relative z-10 select-none px-0.5">
                            {repTracksNum > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayRepertoire(rep, e);
                                }}
                                className={`w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-[1.05] active:scale-90 ${
                                  isRepActive
                                    ? `bg-[#1ed760] text-slate-950 hover:bg-emerald-450`
                                    : `hover:scale-[1.05] text-slate-100 border border-white/5`
                                }`}
                                style={{ backgroundColor: !isRepActive ? `${folderColor.primary}cc` : undefined }}
                                title="Tocar este repertório"
                              >
                                {isRepActive && isPlaying ? (
                                  <Pause className="w-2.5 h-2.5 fill-slate-950 text-slate-950 stroke-[3]" />
                                ) : (
                                  <Play className="w-2.5 h-2.5 fill-slate-950 text-slate-200 stroke-[3] ml-0.5" style={{ fill: !isRepActive ? '#020617' : undefined, color: !isRepActive ? '#020617' : undefined }} />
                                )}
                              </button>
                            ) : (
                              <div className="w-6.5 h-6.5" />
                            )}

                            <ChevronRight 
                              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 shrink-0"
                              style={{ color: folderColor.primary }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Dots indicator under folders list on mobile/desktop slider */}
                {!openedAsRepertoireOnly && repertoires.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                    {repertoires.map((rep, idx) => {
                      const isRepActive = selectedRepertoireId === rep.id || (rep.slug && selectedRepertoireId && rep.slug.toString().trim().toLowerCase() === selectedRepertoireId.toString().trim().toLowerCase());
                      return (
                        <button
                          key={`dot-${rep.id}`}
                          onClick={() => setSelectedRepertoireId(rep.id)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            isRepActive 
                              ? 'bg-[#1ed760] w-4 shadow-[0_0_8px_rgba(30,215,96,0.6)]' 
                              : 'bg-zinc-700 hover:bg-zinc-650'
                          }`}
                          title={`Ver pasta ${rep.name}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
                 {/* Header section with search & filter inputs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-3.5">
              <div className="text-left">
                <h3 className="text-[13px] font-mono font-black tracking-widest text-[#5c7094] uppercase flex items-center gap-2">
                  <Disc className="w-4.5 h-4.5 text-[#10b981] rotate-slow" />
                  <span>{selectedRepertoireId ? "MÚSICAS DO REPERTÓRIO" : "MÚSICAS AVULSAS"}</span>
                </h3>
                {!selectedRepertoireId && !selectedSongId && (
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Músicas fora de repertórios (avulsas)
                  </p>
                )}
                {isFilteredToSingleContext && (
                  <div className="mt-1.5 inline-flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/20 px-3 py-1 rounded-full text-[10.5px] text-[#10b981] font-mono">
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
                    className="w-full sm:w-48 pl-8 pr-3.5 py-1.5 bg-[#080d0a] border border-zinc-800 hover:border-[#10b981]/35 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/25 transition-all font-mono"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Genre trigger pill option */}
                <div className="relative">
                  <select
                    value={selectedGenreFilter}
                    onChange={(e) => setSelectedGenreFilter(e.target.value)}
                    className="px-3.5 py-1.5 bg-[#080d0a] border border-zinc-800 hover:border-[#10b981]/35 rounded-xl text-xs text-zinc-300 font-mono uppercase font-bold focus:outline-none cursor-pointer focus:border-[#10b981] appearance-none pr-8"
                  >
                    {genres.map(g => (
                      <option key={g} value={g} className="bg-[#0c0f0d] text-white">{g === 'All' ? 'TEMAS' : g}</option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-zinc-550 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            {whatsappShareAlert && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 text-[#10b981] text-[10px] font-mono rounded-xl text-center font-bold animate-pulse">
                Redirecionando de forma segura para o WhatsApp...
              </div>
            )}

            {allTracks.length === 0 ? (
              <div className="text-center py-16 bg-[#18181c]/50 border border-zinc-800 rounded-3xl text-zinc-400 text-xs font-mono">
                Artor ainda não disponibilizou nenhuma gravação ativa no acervo.
              </div>
            ) : activeDisplayTracks.length === 0 ? (
              <div className="text-center py-12 bg-[#18181c]/50 border border-zinc-800 rounded-2xl text-zinc-400 text-xs font-mono">
                Nenhuma gravação encontrada com as palavras buscadas / filtros.
              </div>
            ) : (
              /* High Polished List of Tracks modeled exactly as shown in screenshot */
              <div id="pub-tracks-list" className="border border-[#10b981]/25 rounded-2xl bg-gradient-to-br from-[#0c0f0d] to-[#040605] backdrop-blur-md overflow-hidden text-left flex flex-col shadow-2xl">
                
                {/* Headers Line Table Column */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800/80 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-extrabold select-none">
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
                    <div key={track.trackId} className="flex flex-col w-full border-b last:border-b-0 border-zinc-850/60">
                      
                      {/* Responsive Grid block */}
                      <div 
                        onClick={() => {
                          if (isCurrentlyPlaying) {
                            onPlayPause();
                          } else {
                            onSelectTrack(track, activeDisplayTracks);
                          }
                        }}
                        className={`grid grid-cols-12 gap-3 md:gap-4 px-4.5 sm:px-6 py-1.5 md:py-2 items-center cursor-pointer transition-all select-none border-l-[3.5px] group ${isCurrentlyPlaying ? 'bg-zinc-850/60 border-l-[#10b981] shadow-inner' : 'border-l-transparent hover:border-l-zinc-700 hover:bg-zinc-800/60'}`}
                      >
                        {/* Col 1: Play trigger + index swap (Spotify style for ultimate elegance and minimum width) */}
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-start min-w-8">
                          {isCurrentlyPlaying ? (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayPause();
                              }}
                              className="w-7.5 h-7.5 rounded-full bg-[#10b981]/10 border border-[#10b981] flex items-center justify-center text-[#10b981] cursor-pointer focus:outline-none shrink-0"
                            >
                              {isActiveAndPlaying ? (
                                <Pause className="w-3.5 h-3.5 text-[#10b981] fill-[#10b981]" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <div className="relative w-7.5 h-7.5 flex items-center justify-start">
                              {/* Show index number, hide on row hover */}
                              <span className="font-mono text-[11px] font-bold text-zinc-500 block group-hover:hidden pl-1 select-none">
                                {(idx + 1).toString().padStart(2, '0')}
                              </span>
                              {/* Show play button icon on row hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTrack(track, activeDisplayTracks);
                                }}
                                className="hidden group-hover:flex w-7 h-7 rounded-full bg-zinc-855 border border-zinc-700/50 items-center justify-center text-white hover:text-[#10b981] hover:border-[#10b981] transition-all cursor-pointer focus:outline-none"
                              >
                                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Col 2: Title & Waveform bar layout from Reference */}
                        <div className="col-span-7 sm:col-span-5 flex items-center gap-3 min-w-0">
                          
                          {/* Mini dynamic waveform indicator next to title */}
                          <div className="flex items-end gap-[1.5px] h-3.5 text-[#10b981] shrink-0 select-none hidden lg:flex mr-1">
                            <span className={`w-[1.5px] bg-[#10b981] max-h-3 rounded-full ${isActiveAndPlaying ? 'h-3 animate-bar-2' : 'h-1.5'}`}></span>
                            <span className={`w-[1.5px] bg-[#10b981] max-h-4.5 rounded-full ${isActiveAndPlaying ? 'h-4.5 animate-bar-3' : 'h-2.5'}`}></span>
                            <span className={`w-[1.5px] bg-[#10b981] max-h-2 rounded-full ${isActiveAndPlaying ? 'h-2 animate-bar-1' : 'h-1.5'}`}></span>
                          </div>

                          <div className="min-w-0 text-left flex-1">
                            <h4 className={`text-[16px] sm:text-[16px] font-heading font-black truncate uppercase tracking-wide ${isCurrentlyPlaying ? 'text-[#10b981]' : 'text-zinc-100'}`}>
                              {track.title}
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-0.5 min-w-0">
                              {track.composer && (
                                <p className="text-[12px] sm:text-[12px] text-zinc-500 font-mono uppercase truncate">
                                  Autor: {track.composer}
                                </p>
                              )}
                              <span className="inline-flex self-start px-1.5 py-[2px] bg-zinc-900 border border-zinc-800 text-zinc-350 font-mono text-[10px] sm:text-[11px] font-bold rounded uppercase shrink-0">
                                {track.genre || 'Sertanejo'}
                              </span>
                            </div>
                            {track.description && typeof track.description === 'string' && track.description.trim() && (
                              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2 font-sans pr-2 normal-case">
                                {track.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Col 3: Style descriptor tags */}
                        <div className="hidden sm:block sm:col-span-3 text-left">
                          <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[9px] font-bold rounded-lg uppercase tracking-wider">
                            {track.genre || 'Sertanejo'}
                          </span>
                        </div>

                        {/* Col 4: Durations & popup menus */}
                        <div className="col-span-3 sm:col-span-3 text-right flex items-center justify-end gap-1 sm:gap-2 relative">
                          <span className="font-mono text-xs text-zinc-500 hidden md:inline">{durationText}</span>
                          
                          {/* WhatsApp contact regarding track */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactForTrack(track);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#10b981] hover:bg-[#10b981]/10 border border-transparent rounded-lg z-10 transition-colors"
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
                              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors cursor-pointer z-10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuTrackId === track.trackId && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuTrackId(null);
                                }} />
                                <div className="absolute right-0 mt-2 w-48 bg-[#1e1e22] border border-zinc-800 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] py-2 z-50 text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectTrack(track, activeDisplayTracks);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-800 text-zinc-350 hover:text-white text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Ouvir música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyTrackLink(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-800 text-zinc-350 hover:text-white text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> Copiar link da música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareTrackWhatsApp(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-800 text-zinc-350 hover:text-white text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-[#10b981]" /> Compartilhar música
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmbedTrack(track);
                                      setActiveMenuTrackId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-800 text-zinc-350 hover:text-white text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Code className="w-3.5 h-3.5 text-[#10b981]" /> Incorporar música
                                  </button>
                                  {track.lyrics && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedLyricsTrackId(lyricsOpen ? null : track.trackId);
                                        setActiveMenuTrackId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-zinc-800 text-zinc-350 hover:text-white text-[10.5px] font-mono uppercase tracking-wider flex items-center gap-2 border-t border-zinc-800"
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
                        <div className="p-5.5 bg-[#18181c] border-t border-b border-zinc-850 text-left">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3 select-none">
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
          <div className="bg-[#0b0e0c]/85 border border-[#10b981]/15 rounded-2.5xl p-6 text-left space-y-4 shadow-xl">
            <h4 className="text-[10px] font-mono tracking-widest text-[#5c7094] uppercase font-bold">SOBRE O ARTISTA & COMPOSITOR</h4>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {artist.bio ? artist.bio : `O conceituado compositor ${artist.name} disponibiliza seu portfólio autoral, contendo guias de canções de alta fidelidade exclusivas para gravação e aquisição comercial de bandas, cantores e produtoras.`}
            </p>
          </div>

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
          <div className="bg-[#1a1a1e] border border-zinc-800/80 rounded-2.5xl max-w-lg w-full p-6 text-left space-y-4 shadow-2xl relative select-text">
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
