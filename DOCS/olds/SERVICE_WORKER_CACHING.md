# Service Worker Caching Strategy

## Overview

The OFM Room Display system uses a **hybrid caching strategy** with Service Workers to provide:
- ✅ **Instant video playback** (cached, offline-capable)
- ✅ **Real-time meeting data** (always fresh from API)
- ✅ **Reduced bandwidth costs** (videos downloaded once)
- ✅ **Offline fallback** (videos play even without internet)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         Room Display Tablet/Browser             │
├─────────────────────────────────────────────────┤
│                                                 │
│  🎥 Video Background Requests                   │
│      ↓                                          │
│  📦 Service Worker (Cache First)                │
│      ├─ Check cache                             │
│      ├─ If found → Return cached video          │
│      └─ If not → Download & cache               │
│                                                 │
│  📅 Meeting Schedule Requests                   │
│      ↓                                          │
│  🌐 Service Worker (Network First)              │
│      ├─ Try network first                       │
│      ├─ If success → Update cache & return      │
│      └─ If fail → Return stale cache            │
│                                                 │
│  💾 Cache Storage                               │
│      ├─ ofm-videos-v2 (up to GB of videos)      │
│      ├─ ofm-api-v2 (API fallback data)          │
│      └─ ofm-static-v2 (offline.html, etc.)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Caching Strategies

### 1. Videos → **Cache First** (Offline-capable)

**Flow:**
1. Request video URL (e.g., `/videos/abc123.mp4`)
2. Service Worker checks cache
3. If cached → Return immediately (instant playback)
4. If not cached → Download, cache, then return

**Benefits:**
- No buffering after first load
- Works completely offline
- Zero bandwidth after initial cache
- Videos persist for 7 days

**Code Location:** `static/service-worker.js` → `cacheFirstStrategy()`

### 2. API Data → **Network First** (Always fresh)

**Flow:**
1. Request API (e.g., `/api/v1/rooms/R101/schedule`)
2. Service Worker tries network first
3. If network succeeds → Update cache & return fresh data
4. If network fails → Return stale cached data (if available)

**Benefits:**
- Always tries to get fresh data
- Falls back to cache when offline
- Meeting schedules update every 30 seconds
- Automatic retry when connection restored

**Code Location:** `static/service-worker.js` → `networkFirstStrategy()`

### 3. Static Assets → **Cache First**

**Flow:**
1. Request static file (e.g., `.js`, `.css`, `.png`)
2. Service Worker checks cache
3. If cached → Return cached version
4. If not → Download & cache

**Code Location:** `static/service-worker.js` → `cacheFirstStrategy()`

---

## File Structure

```
OFM/
├── static/
│   ├── service-worker.js        # Main Service Worker
│   └── offline.html             # Offline fallback page
├── src/
│   ├── lib/
│   │   └── utils/
│   │       └── cache-manager.ts # Client-side cache utilities
│   └── routes/
│       └── (fullscreen)/
│           └── display/
│               └── room/
│                   └── [roomId]/
│                       └── +page.svelte # Registers SW & pre-caches videos
└── DOCS/
    └── SERVICE_WORKER_CACHING.md # This file
```

---

## How It Works

### Initial Load

1. **User opens room display page** (`/display/room/R101`)

2. **Service Worker registers**
   ```typescript
   await registerServiceWorker(); // src/lib/utils/cache-manager.ts
   ```

3. **Device checks assignment**
   ```typescript
   const isAssigned = await checkDeviceAssignment();
   ```

4. **Load room schedule** (Network First)
   ```typescript
   const response = await fetch(`/api/v1/rooms/${roomId}/schedule`);
   // Service Worker intercepts → Network First strategy
   ```

5. **Load background videos metadata** (Network First)
   ```typescript
   const response = await fetch(`/api/v1/videos/${videoId}`);
   // Returns video URL
   ```

6. **Pre-cache video files** (Cache First)
   ```typescript
   await precacheVideos(videoUrls);
   // Service Worker downloads and caches all videos
   ```

7. **Video element loads** (Instant from cache)
   ```html
   <video src="https://cdn.example.com/video1.mp4" />
   <!-- Served from cache after first download -->
   ```

### Subsequent Loads

- **Videos:** Instant playback from cache ⚡
- **API calls:** Fresh data from network (30s refresh)
- **Offline mode:** Videos play, schedule shows last known state

---

## API Reference

### Client-Side (cache-manager.ts)

```typescript
// Register Service Worker
await registerServiceWorker(): Promise<ServiceWorkerRegistration | null>

// Pre-cache videos for offline use
await precacheVideos(videoUrls: string[]): Promise<void>

// Get cache status
await getCacheStatus(): Promise<CacheStatus | null>

// Clear video cache
await clearVideoCache(): Promise<void>

// Clear all caches
await clearAllCaches(): Promise<void>

// Listen for cache events
const cleanup = onCacheEvent((event) => {
  console.log('Cache event:', event.data);
});

// Unregister Service Worker
await unregisterServiceWorker(): Promise<boolean>
```

### Service Worker Messages

```javascript
// Pre-cache videos
navigator.serviceWorker.controller.postMessage({
  type: 'PRECACHE_VIDEOS',
  data: { videoUrls: ['https://...', 'https://...'] }
});

// Clear video cache
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_VIDEO_CACHE'
});

// Get cache status
navigator.serviceWorker.controller.postMessage({
  type: 'GET_CACHE_STATUS'
});
```

---

## Cache Management

### Cache Names

- **`ofm-videos-v2`** - Video files (largest, long-lived)
- **`ofm-api-v2`** - API responses (fallback only)
- **`ofm-static-v2`** - Static assets (offline.html, etc.)

**Version History:**
- `v1` → `v2` (2025-01-12): Fixed reactivity issues, bumped for cache invalidation

### Cache Lifetime

- **Videos:** 7 days (configurable via `VIDEO_MAX_AGE`)
- **API data:** 5 minutes fallback (configurable via `API_MAX_AGE`)
- **Static assets:** Until cache version changes

### Cache Size

- **Videos:** No hard limit (browser-dependent, typically several GB)
- **API:** Small (<1MB typically)
- **Static:** Very small (<100KB)

### Cache Cleanup

**Automatic:**
- Old cache versions deleted on Service Worker activation
- Browser manages storage automatically (LRU eviction)

**Manual:**
```typescript
import { clearVideoCache, clearAllCaches } from '$lib/utils/cache-manager';

// Clear just videos
await clearVideoCache();

// Clear everything
await clearAllCaches();
```

---

## Offline Behavior

### When Network Fails

1. **Videos:** Continue playing from cache ✅
2. **API calls:** Return last cached data (if available)
3. **Navigation:** Show offline fallback page (`/offline.html`)

### Offline Fallback Page

Located at: `static/offline.html`

Features:
- Auto-retry every 30 seconds
- Manual retry button
- Connection status indicator
- Automatically reloads when connection restored

---

## Testing

### Test Cache First (Videos)

1. Open room display page
2. Open DevTools → Network tab
3. First load: Video downloads (see in network tab)
4. Refresh page
5. Second load: Video loads from cache (instant, no network)

### Test Network First (API)

1. Open room display page
2. Open DevTools → Network tab
3. Observe API calls refreshing every 30 seconds
4. Disconnect network
5. API calls fail, but last cached data still shown

### Test Offline Mode

1. Open room display page
2. Wait for videos to cache (see cache status indicator)
3. Disconnect network (DevTools → Offline mode)
4. Refresh page
5. Videos should still play, meeting data shows last state

---

## Browser Support

| Browser | Service Worker | Cache API | Status |
|---------|----------------|-----------|--------|
| Chrome 40+ | ✅ | ✅ | Fully supported |
| Firefox 44+ | ✅ | ✅ | Fully supported |
| Safari 11.1+ | ✅ | ✅ | Fully supported |
| Edge 17+ | ✅ | ✅ | Fully supported |
| Opera 27+ | ✅ | ✅ | Fully supported |

**Note:** Older browsers gracefully degrade to network-only mode.

---

## Performance Benefits

### Before Service Worker

- Video download: ~50MB per load
- Bandwidth usage: 50MB × page loads
- Load time: 5-10 seconds (buffering)
- Offline: ❌ Not working

### After Service Worker

- Video download: 50MB once (cached)
- Bandwidth usage: 50MB once + API calls only
- Load time: <1 second (from cache)
- Offline: ✅ Videos play, schedule available

**Savings Example:**
- 10 room displays × 2 videos (50MB each)
- Before: 1GB download per day × 30 days = **30GB/month**
- After: 1GB download once = **1GB/month**
- **Savings: 96.7% bandwidth reduction** 🎉

---

## Troubleshooting

### Videos not caching?

1. Check browser console for Service Worker errors
2. Verify Service Worker is registered:
   ```javascript
   navigator.serviceWorker.controller
   ```
3. Check cache status:
   ```typescript
   const status = await getCacheStatus();
   console.log(status);
   ```

### Stale data showing?

1. API calls use Network First (always tries fresh data)
2. If seeing stale data, network is likely offline
3. Check Network tab in DevTools
4. Clear API cache if needed:
   ```typescript
   await clearAllCaches();
   ```

### Service Worker not updating?

1. Service Worker updates on page load
2. Force update by unregistering:
   ```typescript
   await unregisterServiceWorker();
   // Refresh page
   ```
3. Or use "Update on reload" in DevTools → Application → Service Workers

---

## Security Considerations

### HTTPS Required

Service Workers **only work on HTTPS** (or localhost for development).

### Scope

Service Worker scope is `/` (entire site).

### Cache Poisoning

- Service Worker only caches responses with `status: 200`
- Failed requests are not cached
- API responses validated before caching

---

## Future Enhancements

- [ ] Background sync for offline meeting bookings
- [ ] Push notifications for meeting reminders
- [ ] Periodic background sync for video updates
- [ ] Cache size limits and quota management
- [ ] Cache analytics and reporting

---

## Related Documentation

- [API.md](./API.md) - API endpoints reference
- [ROOM_DISPLAY.md](./ROOM_DISPLAY.md) - Room display system
- [BUSINESS_PROCESS.md](./BUSINESS_PROCESS.md) - Business workflows

---

**Last Updated:** 2025-01-12
