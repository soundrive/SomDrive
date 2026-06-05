/**
 * Types modeling the "Meu Pen Drive Digital" application state
 */

export interface Artist {
  userId: string; // matches uid
  name: string; // matches artistName
  avatarUrl?: string;
  city?: string;
  state?: string;
  genre?: string;
  whatsapp?: string; // matches phone
  instagram?: string;
  email: string;
  bio?: string;
  plan: 'free' | 'pro' | 'premium';
  subscriptionDate?: string;
  subscriptionStatus?: 'ativo' | 'pendente' | 'cancelado';
  createdAt: string;

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
}

export interface Music {
  trackId: string;
  artistId: string;
  title: string;
  composer?: string;
  singer?: string;
  genre?: string;
  description?: string;
  audioUrl: string; // Firebase Storage URL or dynamic Blob Object URL / demo MP3 URL
  coverUrl?: string; // Firebase Storage URL or profile cover URL / demo cover URL
  lyrics?: string; // Optional song lyrics
  playsCount: number;
  createdAt: string;
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
