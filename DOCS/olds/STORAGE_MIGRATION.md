# Image Storage Migration Guide

## Current Implementation: Base64 in MongoDB

Room photos are currently stored as base64-encoded strings directly in MongoDB's `meeting_rooms.imageUrl` field.

**Pros:**
- ✅ Simple implementation
- ✅ No additional infrastructure needed
- ✅ Works well for containerized deployments
- ✅ Backup/restore handled by MongoDB

**Cons:**
- ⚠️ Limited to ~500KB per image (to avoid bloating database)
- ⚠️ Increases MongoDB storage size
- ⚠️ Not ideal for high-resolution images
- ⚠️ All images loaded in API responses

**Current Code Location:**
- `/src/routes/admin/rooms/+page.svelte` - Upload UI and base64 conversion
- `handleImageUpload()` function - File-to-base64 conversion logic

---

## Migration Path: S3-Compatible Object Storage

When you're ready to scale, migrate to S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.)

### Step 1: Setup Object Storage

**Option A: MinIO (Self-hosted, S3-compatible)**
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=yourpassword \
  -v /data/minio:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

**Option B: AWS S3**
- Create S3 bucket: `ofm-room-photos`
- Setup IAM user with S3 permissions
- Get access key + secret key

### Step 2: Install S3 Client Library

```bash
bun add @aws-sdk/client-s3
bun add @aws-sdk/s3-request-presigner
```

### Step 3: Create Storage Service

Create `/src/lib/server/storage.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // For MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!
  },
  forcePathStyle: true // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || 'ofm-room-photos';

export async function uploadImage(file: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType
  });

  await s3Client.send(command);
  return `s3://${BUCKET_NAME}/${key}`;
}

export async function getImageUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  // Generate signed URL valid for 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

### Step 4: Create Upload API Endpoint

Create `/src/routes/api/v1/upload/image/+server.ts`:

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadImage } from '$lib/server/storage';
import { requireAuth } from '$lib/server/auth';
import { randomUUID } from 'crypto';

export const POST: RequestHandler = async (event) => {
  await requireAuth(event);

  const formData = await event.request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  // Validate file size (e.g., max 5MB for S3)
  if (file.size > 5 * 1024 * 1024) {
    return json({ success: false, error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Generate unique key
  const ext = file.name.split('.').pop();
  const key = `rooms/${randomUUID()}.${ext}`;

  // Upload to S3
  const buffer = Buffer.from(await file.arrayBuffer());
  const s3Path = await uploadImage(buffer, key, file.type);

  return json({ success: true, data: { key, url: s3Path } });
};
```

### Step 5: Update Admin UI

Modify `/src/routes/admin/rooms/+page.svelte`:

```typescript
// BEFORE (Base64):
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  const reader = new FileReader();
  reader.onload = (e) => {
    formData.imageUrl = e.target?.result as string; // base64
  };
  reader.readAsDataURL(file);
}

// AFTER (S3):
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/upload/image', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    formData.imageUrl = result.data.key; // Store S3 key, not URL
    imagePreview = URL.createObjectURL(file); // Client-side preview
  }
}
```

### Step 6: Update API to Serve Signed URLs

Modify `/src/routes/api/v1/rooms/+server.ts`:

```typescript
import { getImageUrl } from '$lib/server/storage';

export const GET: RequestHandler = async () => {
  const rooms = await db.collection('meeting_rooms').find().toArray();

  // Replace S3 keys with signed URLs
  const roomsWithImages = await Promise.all(
    rooms.map(async (room) => ({
      ...room,
      imageUrl: room.imageUrl?.startsWith('s3://')
        ? await getImageUrl(room.imageUrl.replace('s3://ofm-room-photos/', ''))
        : room.imageUrl // Keep base64 for backward compatibility
    }))
  );

  return json({ success: true, data: roomsWithImages });
};
```

### Step 7: Environment Variables

Add to `.env`:

```env
# S3 Storage (MinIO or AWS S3)
S3_ENDPOINT=http://localhost:9000  # Only for MinIO
S3_REGION=us-east-1
S3_BUCKET=ofm-room-photos
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### Step 8: Data Migration Script

Create `/scripts/migrate-images-to-s3.ts`:

```typescript
import { MongoClient } from 'mongodb';
import { uploadImage } from '../src/lib/server/storage';

async function migrateImagesToS3() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const db = client.db(process.env.MONGODB_DB);
  const rooms = await db.collection('meeting_rooms')
    .find({ imageUrl: { $regex: '^data:image' } }) // Find base64 images
    .toArray();

  for (const room of rooms) {
    try {
      // Extract base64 data
      const base64Data = room.imageUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to S3
      const key = `rooms/${room._id}.jpg`;
      const s3Path = await uploadImage(buffer, key, 'image/jpeg');

      // Update database
      await db.collection('meeting_rooms').updateOne(
        { _id: room._id },
        { $set: { imageUrl: key } }
      );

      console.log(`✅ Migrated ${room.roomName}`);
    } catch (error) {
      console.error(`❌ Failed to migrate ${room.roomName}:`, error);
    }
  }

  await client.close();
}

migrateImagesToS3();
```

Run migration:
```bash
bun run scripts/migrate-images-to-s3.ts
```

---

## Comparison

| Feature | Base64 (Current) | S3 (Future) |
|---------|------------------|-------------|
| Setup Complexity | ✅ Simple | ⚠️ Requires infrastructure |
| File Size Limit | 500KB | 5MB+ |
| Cost | Free (DB storage) | $0.023/GB (S3) |
| Performance | ⚠️ Slower API calls | ✅ Fast CDN delivery |
| Scalability | ⚠️ Limited | ✅ Unlimited |
| Backup | ✅ With MongoDB | ⚠️ Separate backup needed |
| Docker Volumes | Not needed | Not needed |

---

## Rollback Plan

If S3 migration fails, revert by:

1. Keep backup of MongoDB before migration
2. Restore from backup: `mongorestore --uri=$MONGODB_URI dump/`
3. Revert code changes to base64 implementation
4. Remove S3 environment variables

---

## Testing Checklist

- [ ] Upload new room photo via admin UI
- [ ] Edit existing room and change photo
- [ ] View room photos in admin list
- [ ] View room photos in booking form
- [ ] Test with 5MB image (should work with S3, fail with base64)
- [ ] Test S3 signed URL expiration (should refresh after 1 hour)
- [ ] Test offline mode (S3 requires internet, base64 doesn't)
- [ ] Verify Docker container restart doesn't lose images
