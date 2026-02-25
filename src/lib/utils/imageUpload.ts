import { storage } from '$lib/storage';
import { PUBLIC_STORAGE_BUCKET, PUBLIC_STORAGE_URL } from '$env/static/public';

/**
 * Compress image using Canvas API before upload
 * Resizes to max 1200px and compresses to 80% quality
 */
async function compressImage(file: File): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				// Create canvas
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Calculate new dimensions (max 1200px width/height, maintain aspect ratio)
				const maxDimension = 1200;
				let width = img.width;
				let height = img.height;

				if (width > height) {
					if (width > maxDimension) {
						height = (height * maxDimension) / width;
						width = maxDimension;
					}
				} else {
					if (height > maxDimension) {
						width = (width * maxDimension) / height;
						height = maxDimension;
					}
				}

				// Set canvas size
				canvas.width = width;
				canvas.height = height;

				// Draw and compress (0.8 quality = 80%)
				ctx.drawImage(img, 0, 0, width, height);

				// Convert to blob
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to create blob'));
						}
					},
					'image/jpeg',
					0.8
				);
			};

			img.onerror = () => {
				reject(new Error('Failed to load image'));
			};

			img.src = e.target?.result as string;
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsDataURL(file);
	});
}

/**
 * Upload image to object storage
 * @param file - Image file to upload
 * @param folder - Folder path in bucket (e.g., 'rooms', 'vehicles')
 * @param fileName - Optional custom filename (will be sanitized)
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
	file: File,
	folder: string = 'rooms',
	fileName?: string
): Promise<{ url: string; error?: string }> {
	try {
		// Compress image first
		const compressedBlob = await compressImage(file);

		// Generate unique filename if not provided
		const timestamp = Date.now();
		const randomStr = Math.random().toString(36).substring(2, 9);
		const sanitizedFileName = fileName
			? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
			: `${timestamp}-${randomStr}.jpg`;

		const filePath = `${folder}/${sanitizedFileName}`;

		// Upload to storage
		const { path, error } = await storage.upload(filePath, compressedBlob, 'image/jpeg');

		if (error) {
			console.error('Storage upload error:', error);
			return { url: '', error };
		}

		const publicUrl = storage.getPublicUrl(path);

		console.log(`Uploaded image: ${file.name} → ${publicUrl}`);

		return { url: publicUrl };
	} catch (error) {
		console.error('Image upload error:', error);
		return {
			url: '',
			error: error instanceof Error ? error.message : 'Failed to upload image'
		};
	}
}

/**
 * Delete a file from object storage
 * @param url - Public URL of the file to delete
 */
export async function deleteFromStorage(url: string): Promise<boolean> {
	try {
		// Extract path after the bucket name
		const bucketPath = `/${PUBLIC_STORAGE_BUCKET}/`;
		const urlParts = url.split(bucketPath);
		if (urlParts.length !== 2) {
			console.error('Invalid storage URL format');
			return false;
		}

		const filePath = urlParts[1];

		const ok = await storage.remove([filePath]);
		if (!ok) return false;

		console.log(`Deleted from storage: ${filePath}`);
		return true;
	} catch (error) {
		console.error('Storage delete error:', error);
		return false;
	}
}

/**
 * Check if a URL points to our configured object storage
 */
export function isStorageUrl(url: string): boolean {
	return url.startsWith(PUBLIC_STORAGE_URL);
}

/**
 * Check if URL is a base64 data URL
 */
export function isBase64Url(url: string): boolean {
	return url.startsWith('data:image/');
}

/**
 * Upload video to object storage
 * @param file - Video file to upload
 * @param folder - Folder path in bucket (e.g., 'background-videos')
 * @param fileName - Optional custom filename (will be sanitized)
 * @returns Public URL of uploaded video
 */
export async function uploadVideo(
	file: File,
	folder: string = 'background-videos',
	fileName?: string
): Promise<{ url: string; error?: string }> {
	try {
		// Validate file type
		if (!file.type.startsWith('video/')) {
			return { url: '', error: 'Please upload a video file' };
		}

		// Check file size (max 50MB for videos)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return {
				url: '',
				error: `Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`
			};
		}

		// Generate unique filename if not provided
		const timestamp = Date.now();
		const randomStr = Math.random().toString(36).substring(2, 9);
		const extension = file.name.split('.').pop() || 'mp4';
		const sanitizedFileName = fileName
			? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
			: `${timestamp}-${randomStr}.${extension}`;

		const filePath = `${folder}/${sanitizedFileName}`;

		// Upload to storage
		const { path, error } = await storage.upload(filePath, file, file.type);

		if (error) {
			console.error('Storage video upload error:', error);
			return { url: '', error };
		}

		const publicUrl = storage.getPublicUrl(path);

		console.log(`Uploaded video: ${file.name} → ${publicUrl}`);

		return { url: publicUrl };
	} catch (error) {
		console.error('Video upload error:', error);
		return {
			url: '',
			error: error instanceof Error ? error.message : 'Failed to upload video'
		};
	}
}
