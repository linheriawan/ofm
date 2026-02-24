# Storage Migration: Base64 to S3

Room photos are currently base64-encoded in MongoDB `meeting_rooms.imageUrl`. This guide covers the planned migration to S3-compatible storage.

---

## Current vs Future

| Aspect | Base64 (Current) | S3 (Future) |
|--------|------------------|-------------|
| Setup | Simple, no infra | Requires S3 or MinIO |
| File size | ~500KB limit | 5MB+ |
| Performance | Slower API calls | Fast CDN delivery |
| Scalability | Limited | Unlimited |
| Offline | Works | Requires internet |

---

## Migration Steps

1. **Setup storage** -- MinIO (self-hosted) or AWS S3 bucket `ofm-room-photos`
2. **Install deps** -- `bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
3. **Create `src/lib/server/storage.ts`** -- S3Client with `uploadImage()` and `getImageUrl()` (signed URLs, 1h expiry)
4. **Create upload API** -- `POST /api/v1/upload/image` with auth and 5MB limit
5. **Update admin UI** -- Replace FileReader base64 with FormData upload to S3
6. **Serve signed URLs** -- Rooms API replaces S3 keys with signed URLs in GET responses (backward compatible with existing base64)
7. **Add env vars** -- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
8. **Run migration** -- `bun run scripts/migrate-images-to-s3.ts` converts existing base64 images

---

## Rollback

Keep MongoDB backup before migration. Restore with `mongorestore`, revert code, remove S3 env vars.
