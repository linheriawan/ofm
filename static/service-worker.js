// OFM Room Display Service Worker
// Hybrid caching strategy: Videos cached, API data always fresh

const CACHE_VERSION = 'ofm-v2';
const VIDEO_CACHE = 'ofm-videos-v2';
const STATIC_CACHE = 'ofm-static-v2';
const API_CACHE = 'ofm-api-v2';

// Cache lifetime
const VIDEO_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_MAX_AGE = 5 * 60 * 1000; // 5 minutes (fallback only)

// Install event - Pre-cache essential static assets
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker...');

	event.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => {
			console.log('[SW] Caching static assets');
			return cache.addAll([
				'/offline.html',
				// Add essential static assets here if needed
			]);
		}).then(() => {
			console.log('[SW] Service worker installed, skipping waiting');
			return self.skipWaiting();
		})
	);
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker...');

	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					// Delete old cache versions
					if (cacheName.startsWith('ofm-') &&
					    cacheName !== VIDEO_CACHE &&
					    cacheName !== STATIC_CACHE &&
					    cacheName !== API_CACHE) {
						console.log('[SW] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		}).then(() => {
			console.log('[SW] Service worker activated');
			return self.clients.claim();
		})
	);
});

// Fetch event - Apply caching strategies
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Strategy 1: Videos - Cache First (Offline-capable)
	if (isVideoRequest(url)) {
		event.respondWith(cacheFirstStrategy(request, VIDEO_CACHE));
		return;
	}

	// Strategy 2: API Data - Network First (Always fresh)
	if (isAPIRequest(url)) {
		event.respondWith(networkFirstStrategy(request, API_CACHE));
		return;
	}

	// Strategy 3: Static Assets - Cache First
	if (isStaticAsset(url)) {
		event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
		return;
	}

	// Default: Network only
	event.respondWith(fetch(request));
});

// Message handler - For cache management commands
self.addEventListener('message', (event) => {
	const { type, data } = event.data;

	switch (type) {
		case 'PRECACHE_VIDEOS':
			event.waitUntil(precacheVideos(data.videoUrls));
			break;

		case 'CLEAR_VIDEO_CACHE':
			event.waitUntil(clearVideoCache());
			break;

		case 'CLEAR_ALL_CACHES':
			event.waitUntil(clearAllCaches());
			break;

		case 'GET_CACHE_STATUS':
			event.waitUntil(getCacheStatus().then((status) => {
				event.ports[0].postMessage(status);
			}));
			break;
	}
});

// ============================================================================
// Helper Functions
// ============================================================================

function isVideoRequest(url) {
	return url.pathname.includes('/videos/') ||
	       url.pathname.endsWith('.mp4') ||
	       url.pathname.endsWith('.webm') ||
	       url.pathname.endsWith('.ogg');
}

function isAPIRequest(url) {
	return url.pathname.startsWith('/api/v1/');
}

function isStaticAsset(url) {
	return url.pathname.endsWith('.js') ||
	       url.pathname.endsWith('.css') ||
	       url.pathname.endsWith('.png') ||
	       url.pathname.endsWith('.jpg') ||
	       url.pathname.endsWith('.svg') ||
	       url.pathname.endsWith('.woff') ||
	       url.pathname.endsWith('.woff2');
}

// ============================================================================
// Caching Strategies
// ============================================================================

/**
 * Cache First Strategy
 * 1. Check cache
 * 2. If found, return cached response
 * 3. If not found, fetch from network and cache
 */
async function cacheFirstStrategy(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	if (cached) {
		console.log('[SW] Cache hit:', request.url);
		return cached;
	}

	console.log('[SW] Cache miss, fetching:', request.url);

	try {
		const response = await fetch(request);

		// Only cache successful responses
		if (response && response.status === 200) {
			// Clone response before caching (can only read once)
			cache.put(request, response.clone());
			console.log('[SW] Cached:', request.url);
		}

		return response;
	} catch (error) {
		console.error('[SW] Fetch failed:', request.url, error);

		// Return offline fallback if available
		const offlineFallback = await cache.match('/offline.html');
		if (offlineFallback) {
			return offlineFallback;
		}

		throw error;
	}
}

/**
 * Network First Strategy
 * 1. Try to fetch from network
 * 2. If successful, update cache and return
 * 3. If failed, return cached version (if available)
 */
async function networkFirstStrategy(request, cacheName) {
	const cache = await caches.open(cacheName);

	try {
		console.log('[SW] Fetching from network:', request.url);
		const response = await fetch(request);

		// Cache successful API responses
		if (response && response.status === 200) {
			cache.put(request, response.clone());
			console.log('[SW] Updated cache:', request.url);
		}

		return response;
	} catch (error) {
		console.warn('[SW] Network failed, trying cache:', request.url);

		const cached = await cache.match(request);

		if (cached) {
			console.log('[SW] Returning stale cache:', request.url);
			return cached;
		}

		console.error('[SW] No cache available for:', request.url);
		throw error;
	}
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Pre-cache videos for offline use
 */
async function precacheVideos(videoUrls) {
	if (!Array.isArray(videoUrls) || videoUrls.length === 0) {
		console.log('[SW] No videos to pre-cache');
		return;
	}

	console.log('[SW] Pre-caching', videoUrls.length, 'videos...');
	const cache = await caches.open(VIDEO_CACHE);

	const results = await Promise.allSettled(
		videoUrls.map(async (url) => {
			try {
				// Check if already cached
				const cached = await cache.match(url);
				if (cached) {
					console.log('[SW] Video already cached:', url);
					return { url, status: 'already-cached' };
				}

				// Fetch and cache
				const response = await fetch(url);
				if (response && response.status === 200) {
					await cache.put(url, response);
					console.log('[SW] Video cached:', url);
					return { url, status: 'cached' };
				}

				return { url, status: 'failed', error: 'Bad response' };
			} catch (error) {
				console.error('[SW] Failed to cache video:', url, error);
				return { url, status: 'failed', error: error.message };
			}
		})
	);

	console.log('[SW] Pre-caching complete:', results);

	// Notify all clients
	const clients = await self.clients.matchAll();
	clients.forEach((client) => {
		client.postMessage({
			type: 'PRECACHE_COMPLETE',
			results
		});
	});
}

/**
 * Clear video cache
 */
async function clearVideoCache() {
	console.log('[SW] Clearing video cache...');
	await caches.delete(VIDEO_CACHE);
	console.log('[SW] Video cache cleared');
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
	console.log('[SW] Clearing all caches...');
	const cacheNames = await caches.keys();
	await Promise.all(cacheNames.map((name) => caches.delete(name)));
	console.log('[SW] All caches cleared');
}

/**
 * Get cache status
 */
async function getCacheStatus() {
	const videoCache = await caches.open(VIDEO_CACHE);
	const apiCache = await caches.open(API_CACHE);
	const staticCache = await caches.open(STATIC_CACHE);

	const videoKeys = await videoCache.keys();
	const apiKeys = await apiCache.keys();
	const staticKeys = await staticCache.keys();

	// Calculate approximate cache sizes
	let videoSize = 0;
	let apiSize = 0;
	let staticSize = 0;

	for (const request of videoKeys) {
		const response = await videoCache.match(request);
		if (response) {
			const blob = await response.blob();
			videoSize += blob.size;
		}
	}

	for (const request of apiKeys) {
		const response = await apiCache.match(request);
		if (response) {
			const blob = await response.blob();
			apiSize += blob.size;
		}
	}

	for (const request of staticKeys) {
		const response = await staticCache.match(request);
		if (response) {
			const blob = await response.blob();
			staticSize += blob.size;
		}
	}

	return {
		videos: {
			count: videoKeys.length,
			size: videoSize,
			urls: videoKeys.map((r) => r.url)
		},
		api: {
			count: apiKeys.length,
			size: apiSize
		},
		static: {
			count: staticKeys.length,
			size: staticSize
		},
		total: {
			size: videoSize + apiSize + staticSize
		}
	};
}

console.log('[SW] Service worker script loaded');
