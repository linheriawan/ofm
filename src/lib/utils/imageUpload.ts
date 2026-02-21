import { supabase } from '$lib/supabase';
import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';

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
 * Upload image to Supabase Storage
 * @param file - Image file to upload
 * @param folder - Folder path in bucket (e.g., 'rooms', 'vehicles')
 * @param fileName - Optional custom filename (will be sanitized)
 * @returns Public URL of uploaded image
 */
export async function uploadImageToSupabase(
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

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage
			.from(PUBLIC_SUPABASE_BUCKET)
			.upload(filePath, compressedBlob, {
				contentType: 'image/jpeg',
				upsert: false // Don't overwrite existing files
			});

		if (error) {
			console.error('Supabase upload error:', error);
			return { url: '', error: error.message };
		}

		// Get public URL
		const {
			data: { publicUrl }
		} = supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(data.path);

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
 * Delete image from Supabase Storage
 * @param url - Public URL of the image to delete
 */
export async function deleteImageFromSupabase(url: string): Promise<boolean> {
	try {
		// Extract path from URL
		// URL format: https://xxx.supabase.co/storage/v1/object/public/[bucket]/folder/file.jpg
		const bucketPath = `/${PUBLIC_SUPABASE_BUCKET}/`;
		const urlParts = url.split(bucketPath);
		if (urlParts.length !== 2) {
			console.error('Invalid Supabase URL format');
			return false;
		}

		const filePath = urlParts[1];

		const { error } = await supabase.storage.from(PUBLIC_SUPABASE_BUCKET).remove([filePath]);

		if (error) {
			console.error('Supabase delete error:', error);
			return false;
		}

		console.log(`Deleted image: ${filePath}`);
		return true;
	} catch (error) {
		console.error('Image delete error:', error);
		return false;
	}
}

/**
 * Check if URL is a Supabase Storage URL
 */
export function isSupabaseUrl(url: string): boolean {
	return url.includes('.supabase.co/storage/');
}

/**
 * Check if URL is a base64 data URL
 */
export function isBase64Url(url: string): boolean {
	return url.startsWith('data:image/');
}

/**
 * Upload video to Supabase Storage
 * @param file - Video file to upload
 * @param folder - Folder path in bucket (e.g., 'background-videos')
 * @param fileName - Optional custom filename (will be sanitized)
 * @returns Public URL of uploaded video
 */
export async function uploadVideoToSupabase(
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

		// Upload to Supabase Storage
		const { data, error } = await supabase.storage
			.from(PUBLIC_SUPABASE_BUCKET)
			.upload(filePath, file, {
				contentType: file.type,
				upsert: false // Don't overwrite existing files
			});

		if (error) {
			console.error('Supabase video upload error:', error);
			return { url: '', error: error.message };
		}

		// Get public URL
		const {
			data: { publicUrl }
		} = supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(data.path);

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
