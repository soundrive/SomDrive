/**
 * Types modeling the "Meu Pen Drive Digital" application state
 */

export interface Artist {
  userId: string; // matches uid
  name: string; // matches artistName
  avatarUrl?: string;
  photoURL?: string;
  profileImageUrl?: string;
  city?: string;
  state?: string;
  genre?: string;
  whatsapp?: string; // matches phone
  instagram?: string;
  email: string;
  bio?: string;
  plan: 'free' | 'essencial' | 'pro' | 'premium';
  subscriptionDate?: string;
  subscriptionStatus?: 'ativo' | 'pendente' | 'cancelado';
  createdAt: string;

  // Custom public catalog texts
  customBadgeText?: string;
  customContactLabel?: string;
  customShareLabel?: string;
  customRightBadgeTitle?: string;
  customRightBadgeStatus?: string;
  customRightBadgeDescription?: string;
  customNoticeText?: string;
  customSongsListTitle?: string;
  customSongsListSubtitle?: string;
  customCardImageUrl?: string;

  // Extended Admin properties
  role?: 'user' | 'admin';
  paymentStatus?: 'inactive' | 'active' | 'pending' | 'cancelled' | 'manual';
  accessType?: 'free' | 'mercadopago' | 'manual' | 'trial';
  musicLimit?: number;
  songsCount?: number;
  trialEndsAt?: string | null;
  manualAccessEndsAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionEndsAt?: string | null;
  mercadoPagoPaymentId?: string | null;
  mercadoPagoSubscriptionId?: string | null;
  isBlocked?: boolean;
  updatedAt?: string;
  phone?: string;
  artistName?: string;
  userType?: string;
  mainGenre?: string;
  slug?: string;
  preferredFreeTracks?: string[];
}

export interface Music {
  trackId: string; // id
  artistId: string; // ownerId
  title: string;
  composer?: string;
  singer?: string; // matches performer
  performer?: string; // name of singer or vocal guide
  genre?: string;
  description?: string;
  audioUrl: string; // cloudflare r2 URL
  coverUrl?: string; // image cover URL
  lyrics?: string; // lyrics of the track
  playsCount: number; // local/view tracker playsCount
  plays?: number; // matches plays: 0
  status?: string; // "active" or "inactive" for private links
  storageProvider?: "cloudflare_r2" | string;
  storagePath?: string;
  fileSize?: number;
  mimeType?: string;
  originalFileName?: string;
  createdAt: string;
  updatedAt?: string;

  // New Deduplication parameters
  audioFileId?: string;
  partners?: string;
  audioHash?: string;
  position?: number;
  orderIndex?: number;

  // Repertoire fields and visibility flags
  repertoireId?: string | null;
  publicationDestination?: "general" | "repertoire";
  isActive?: boolean;
  isPublic?: boolean;
}

export interface Analytics {
  artistId: string;
  viewsCount: number;
  whatsappClicks: number;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface PaymentSettings {
  proMonthlyUrl?: string;
  proAnnualUrl?: string;
  premiumMonthlyUrl?: string;
  premiumAnnualUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ShareCardSettings {
  ogImageUrl: string;
  ogImageVersion: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface AppearanceSettings {
  logoScale: number;
  showLogo?: boolean;
  customLogoUrl?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Repertoire {
  id: string; // generated id
  ownerUid: string;
  name: string;
  slug?: string;
  description?: string;
  type: 'repertoire' | 'collection' | 'playlist' | 'project';
  trackIds: string[];
  orderedTrackIds?: string[];
  visibility: 'public' | 'unlisted' | 'private' | 'active';
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string; // generated id
  ownerUid: string;
  name: string;
  description?: string;
  type: string;
  trackIds: string[];
  orderedTrackIds?: string[];
  status: 'active' | 'completed' | 'draft' | 'private';
  createdAt: string;
  updatedAt?: string;
}

