# Security Specification for Soundrive Firebase Backend

## Data Invariants
1. **User Ownership**: Any record under `/artists/{artistId}` or `/artists/{artistId}/musics/{musicId}` must strictly be authored/managed by the signed-in user who matches `{artistId}`.
2. **Read Access**: Artist profiles and their published music catalogs are public (readable by anyone), but write access is restricted only to the matching authenticated owner.
3. **Analytics**: Incremental operations like adding page views or recording clicks can be done anonymously or by any user, but are guarded against extreme value injection.
4. **Immutable Fields**: High-value attributes such as `createdAt`, `userId`, `trackId`, and original membership tiers are protected against modification during profile edits.

## The "Dirty Dozen" Validation Failures
The following actions must return `PERMISSION_DENIED` at the database rules gate:
1. Attempting to create an artist profile with a different user's `userId`.
2. Modifying an existing artist's `createdAt` timestamp.
3. Injecting a massive string (>2000 chars) into an artist's nickname or bio to exhaust Firebase resources.
4. A standard account trying to force upgrade its `plan` attribute directly to 'premium'.
5. Creating a music record with a spoofed `artistId` representing another author.
6. Triggering a track update that changes its immutable `trackId`.
7. Uploading a music record without a valid, safe `audioUrl` structure.
8. Trying to bypass validation limits by adding empty/undefined required fields.
9. Incrementing a track's `playsCount` by an abnormally large value (+10,000 in one go) rather than standard increments.
10. Directly overwriting `whatsappClicks` in the global analytics node to arbitrary values.
11. Reading private security profiles when authentication state is null or unverified.
12. Forging database document IDs with malicious characters (e.g., unicode exploits) using non-standard path variables.

## Security Rule Match Structure
The production `firestore.rules` will enforce:
- Reusable, optimized static checks (`isValidId()`, `isSignedIn()`).
- High-performance relational lookup ordering.
- Strict `affectedKeys().hasOnly()` checks restricting active update transitions.
