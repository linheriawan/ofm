/**
 * Cache Manager Utility
 * Client-side interface for interacting with the Service Worker cache
 */

import { browser } from '$app/environment';

export interface CacheStatus {
	videos: {
		count: number;
		size: number;
		urls: string[];
	};
	api: {
		count: number;
		size: number;
	};
	static: {
		count: number;
		size: number;
	};
	total: {
		size: number;
	};
}

export interface PrecacheResult {
	url: string;
	status: 'cached' | 'already-cached' | 'failed';
	error?: string;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!browser || !('serviceWorker' in navigator)) {
		console.warn('[CacheManager] Service Worker not supported');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register('/service-worker.js', {
			scope: '/'
		});

		console.log('[CacheManager] Service Worker registered:', registration.scope);

		// Wait for the service worker to be ready
		await navigator.serviceWorker.ready;
		console.log('[CacheManager] Service Worker ready');

		return registration;
	} catch (error) {
		console.error('[CacheManager] Service Worker registration failed:', error);
		return null;
	}
}

/**
 * Pre-cache videos for offline use
 * Returns a Promise that resolves when caching is complete
 */
export async function precacheVideos(videoUrls: string[]): Promise<PrecacheResult[]> {
	if (!browser || !navigator.serviceWorker.controller) {
		console.warn('[CacheManager] Service Worker not active, skipping pre-cache');
		return [];
	}

	console.log('[CacheManager] Requesting pre-cache for', videoUrls.length, 'videos');

	return new Promise((resolve) => {
		// Listen for completion message
		const handler = (event: MessageEvent) => {
			if (event.data.type === 'PRECACHE_COMPLETE') {
				navigator.serviceWorker.removeEventListener('message', handler);
				resolve(event.data.results || []);
			}
		};

		navigator.serviceWorker.addEventListener('message', handler);

		// Send pre-cache request
		navigator.serviceWorker.controller!.postMessage({
			type: 'PRECACHE_VIDEOS',
			data: { videoUrls }
		});

		// Timeout after 30 seconds
		setTimeout(() => {
			navigator.serviceWorker.removeEventListener('message', handler);
			console.warn('[CacheManager] Pre-cache timeout');
			resolve([]);
		}, 30000);
	});
}

/**
 * Clear video cache
 */
export async function clearVideoCache(): Promise<void> {
	if (!browser || !navigator.serviceWorker.controller) {
		console.warn('[CacheManager] Service Worker not active');
		return;
	}

	console.log('[CacheManager] Clearing video cache');

	navigator.serviceWorker.controller.postMessage({
		type: 'CLEAR_VIDEO_CACHE'
	});
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
	if (!browser || !navigator.serviceWorker.controller) {
		console.warn('[CacheManager] Service Worker not active');
		return;
	}

	console.log('[CacheManager] Clearing all caches');

	navigator.serviceWorker.controller.postMessage({
		type: 'CLEAR_ALL_CACHES'
	});
}

/**
 * Get current cache status
 */
export async function getCacheStatus(): Promise<CacheStatus | null> {
	if (!browser || !navigator.serviceWorker.controller) {
		console.warn('[CacheManager] Service Worker not active');
		return null;
	}

	return new Promise((resolve) => {
		const messageChannel = new MessageChannel();

		messageChannel.port1.onmessage = (event) => {
			resolve(event.data);
		};

		navigator.serviceWorker.controller.postMessage(
			{ type: 'GET_CACHE_STATUS' },
			[messageChannel.port2]
		);

		// Timeout after 5 seconds
		setTimeout(() => {
			resolve(null);
		}, 5000);
	});
}

/**
 * Listen for cache events from Service Worker
 */
export function onCacheEvent(callback: (event: MessageEvent) => void): () => void {
	if (!browser || !('serviceWorker' in navigator)) {
		return () => {};
	}

	const handler = (event: MessageEvent) => {
		if (event.data.type === 'PRECACHE_COMPLETE') {
			callback(event);
		}
	};

	navigator.serviceWorker.addEventListener('message', handler);

	// Return cleanup function
	return () => {
		navigator.serviceWorker.removeEventListener('message', handler);
	};
}

/**
 * Check if Service Worker is supported
 */
export function isServiceWorkerSupported(): boolean {
	return browser && 'serviceWorker' in navigator;
}

/**
 * Check if Service Worker is active
 */
export function isServiceWorkerActive(): boolean {
	return browser && !!navigator.serviceWorker.controller;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Unregister the service worker (for debugging/cleanup)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
	if (!browser || !('serviceWorker' in navigator)) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		if (registration) {
			const success = await registration.unregister();
			console.log('[CacheManager] Service Worker unregistered:', success);
			return success;
		}
		return false;
	} catch (error) {
		console.error('[CacheManager] Failed to unregister Service Worker:', error);
		return false;
	}
}
