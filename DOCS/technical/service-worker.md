# Service Worker Caching

Hybrid caching strategy for the Room Display system ([M6](../modules/M6-room-display.md)).

---

## Strategies

| Content | Strategy | Behavior |
|---------|----------|----------|
| Videos | Cache First | Download once, serve from cache. Instant playback, works offline. |
| API data | Network First | Always try fresh data. Falls back to stale cache if offline. |
| Static assets | Cache First | Standard cache-first for `.js`, `.css`, `.png`. |

---

## Cache Names

| Cache | Content | Lifetime |
|-------|---------|----------|
| `ofm-videos-v2` | Video files | 7 days |
| `ofm-api-v2` | API responses (fallback) | 5 minutes |
| `ofm-static-v2` | Static assets | Until version change |

---

## Client API

```typescript
import {
  registerServiceWorker,
  precacheVideos,
  getCacheStatus,
  clearVideoCache,
  clearAllCaches,
  unregisterServiceWorker
} from '$lib/utils/cache-manager';
```

---

## How It Works

1. User opens `/display/room/R101`
2. Service Worker registers
3. Room schedule loads (Network First, refreshes every 30s)
4. Videos pre-cached (Cache First)
5. Subsequent loads: videos instant from cache, API always fresh

**Offline:** Videos play from cache, schedule shows last known state, offline fallback page auto-retries.

---

## Performance

| Metric | Before | After |
|--------|--------|-------|
| Video per load | ~50MB download | Instant from cache |
| Load time | 5-10s | < 1s |
| 10 displays, 30 days | ~30GB/month | ~1GB/month |

---

## Key Files

```
static/service-worker.js                                    # Main Service Worker
static/offline.html                                         # Offline fallback page
src/lib/utils/cache-manager.ts                              # Client-side utilities
src/routes/(fullscreen)/display/room/[roomId]/+page.svelte  # Registers SW
```

Requires HTTPS (or localhost). Only caches responses with status 200.
