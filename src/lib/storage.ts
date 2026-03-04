import { createClient } from '@supabase/supabase-js';
import {
	PUBLIC_STORAGE_TYPE,
	PUBLIC_STORAGE_URL,
	PUBLIC_STORAGE_ANON_KEY,
	PUBLIC_STORAGE_BUCKET
} from '$env/static/public';

export interface StorageProvider {
	upload(
		path: string,
		data: Blob | File,
		contentType: string
	): Promise<{ path: string; error?: string }>;
	getPublicUrl(path: string): string;
	remove(paths: string[]): Promise<boolean>;
}

// --- Supabase implementation ---

class SupabaseStorageProvider implements StorageProvider {
	private client = createClient(PUBLIC_STORAGE_URL, PUBLIC_STORAGE_ANON_KEY);

	async upload(path: string, data: Blob | File, contentType: string) {
		const { data: result, error } = await this.client.storage
			.from(PUBLIC_STORAGE_BUCKET)
			.upload(path, data, { contentType, upsert: false });

		if (error) return { path: '', error: error.message };
		return { path: result.path };
	}

	getPublicUrl(path: string): string {
		const { data } = this.client.storage.from(PUBLIC_STORAGE_BUCKET).getPublicUrl(path);
		return data.publicUrl;
	}

	async remove(paths: string[]): Promise<boolean> {
		const { error } = await this.client.storage.from(PUBLIC_STORAGE_BUCKET).remove(paths);
		if (error) {
			console.error('Storage remove error:', error);
			return false;
		}
		return true;
	}
}

// --- S3 implementation ---
//
// AWS credentials (STORAGE_KEY_ID, STORAGE_SECRET_KEY, STORAGE_REGION) are server-side only.
// Uploads go through: browser → POST /api/v1/storage/presign → signed URL → PUT directly to S3.
// Deletes go through: browser → POST /api/v1/storage/delete → S3 DeleteObjects.
//
// PUBLIC_STORAGE_URL must be your S3 base endpoint (path-style) or CloudFront/CDN base URL.
// getPublicUrl always embeds the bucket in the path so path extraction in deleteFromStorage works:
//   e.g. PUBLIC_STORAGE_URL=https://s3.ap-southeast-1.amazonaws.com
//        getPublicUrl('rooms/img.jpg') → https://s3.ap-southeast-1.amazonaws.com/ofm/rooms/img.jpg
//
// Required S3 bucket CORS: allow PUT from your app origin.

class S3StorageProvider implements StorageProvider {
	async upload(path: string, data: Blob | File, contentType: string) {
		// Step 1: get a pre-signed upload URL from the server
		const presignRes = await fetch('/api/v1/storage/presign', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path, contentType })
		});

		const presign = await presignRes.json();
		if (!presign.success) return { path: '', error: presign.error ?? 'Failed to get upload URL' };

		// Step 2: PUT file directly to S3 using the signed URL
		const uploadRes = await fetch(presign.data.url, {
			method: 'PUT',
			headers: { 'Content-Type': contentType },
			body: data
		});

		if (!uploadRes.ok) {
			return { path: '', error: `S3 upload failed: ${uploadRes.status} ${uploadRes.statusText}` };
		}

		return { path };
	}

	getPublicUrl(path: string): string {
		// Always include bucket in path so deleteFromStorage can extract the key
		return `${PUBLIC_STORAGE_URL}/${PUBLIC_STORAGE_BUCKET}/${path}`;
	}

	async remove(paths: string[]): Promise<boolean> {
		const res = await fetch('/api/v1/storage/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ paths })
		});
		const result = await res.json();
		return result.success === true;
	}
}

// --- Factory ---

function createStorageProvider(): StorageProvider {
	switch (PUBLIC_STORAGE_TYPE) {
		case 's3':
			return new S3StorageProvider();
		case 'supabase':
		default:
			return new SupabaseStorageProvider();
	}
}

export const storage: StorageProvider = createStorageProvider();
