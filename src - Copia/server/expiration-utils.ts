export type FirestoreDateLike =
  | string
  | number
  | Date
  | {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    }
  | null;

export interface UserAccessData {
  userId: string;
  plan?: string;
  accessType?: string;
  role?: string;
  subscriptionEndsAt?: FirestoreDateLike;
  planExpiresAt?: FirestoreDateLike;
  trialEndsAt?: FirestoreDateLike;
  manualAccessEndsAt?: FirestoreDateLike;
  preferredFreeTracks?: string[];
  planStatus?: string;
}

export interface TrackData {
  trackId: string;
  status?: string;
  ownerId?: string;
  createdAt?: FirestoreDateLike;
  updatedAt?: FirestoreDateLike;
}

/**
 * Safely parses any date representation from Firestore (Timestamp, string, Date, legacy object)
 * into a pure JS Date object.
 */
export function getSafeExpirationDate(
  val: FirestoreDateLike | undefined
): Date | null {
  if (!val) return null;

  // Direct Date object
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // Firestore Timestamp / Admin Timestamp
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    const seconds = val.seconds ?? val._seconds;
    if (typeof seconds === 'number') {
      const nanoseconds = val.nanoseconds ?? val._nanoseconds ?? 0;
      const d = new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000));
      if (!isNaN(d.getTime())) return d;
    }
  }

  // ISO String / Milliseconds string or number
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Resolves the accurate expiration date for a user based on their specific access type.
 */
export function determineExpirationDate(user: UserAccessData): Date | null {
  const role = user.role || 'user';
  if (role === 'admin') {
    return null; // Admins never expire chronologically
  }

  const accessType = user.accessType || 'free';

  if (accessType === 'subscriber' || accessType === 'mercadopago') {
    const subDate = getSafeExpirationDate(user.subscriptionEndsAt);
    if (subDate) return subDate;
    return getSafeExpirationDate(user.planExpiresAt);
  }

  if (accessType === 'trial') {
    return getSafeExpirationDate(user.trialEndsAt);
  }

  if (accessType === 'manual') {
    return getSafeExpirationDate(user.manualAccessEndsAt);
  }

  return null;
}

/**
 * Returns true if the user's paid or trial access has expired.
 */
export function isAccessExpired(user: UserAccessData, now = new Date()): boolean {
  const plan = user.plan || 'free';
  const accessType = user.accessType || 'free';

  // If already on the free tier, no downgrade is needed
  if (plan === 'free' || accessType === 'free') {
    return false;
  }

  const expiryDate = determineExpirationDate(user);
  if (!expiryDate) {
    console.warn(`[Expiration Diagnostic] User ${user.userId || 'unknown'} has plan '${plan}' and accessType '${accessType}' but is missing a valid expiration date. No downgrade applied.`);
    return false; // Skip if no valid expiration date is present
  }

  return expiryDate < now;
}
