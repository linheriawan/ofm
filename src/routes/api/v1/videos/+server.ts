import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { BackgroundVideo } from '$lib/types';
import { listDocuments } from '$lib/utils/api';

// GET /api/v1/videos - List all background videos
export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const areaTag = url.searchParams.get('areaTag');
		const activeOnly = url.searchParams.get('activeOnly') === 'true';

		const filters: any = {};
		if (areaTag) {
			filters.areaTag = areaTag;
		}
		if (activeOnly) {
			filters.isActive = true;
		}

		const result = await listDocuments<BackgroundVideo>(collections.backgroundVideos, {
			page,
			limit,
			filters,
			sort: { createdAt: -1 }
		});

		return json(result);
	} catch (error) {
		console.error('Error fetching videos:', error);
		return json({ success: false, error: 'Failed to fetch videos' }, { status: 500 });
	}
};

// POST /api/v1/videos - Create new background video
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			videoId,
			videoName,
			description,
			videoUrl,
			thumbnailUrl,
			duration,
			fileSize,
			areaTag,
			isActive
		} = body;

		// Validation
		if (!videoId || !videoName || !videoUrl) {
			return json(
				{ success: false, error: 'videoId, videoName, and videoUrl are required' },
				{ status: 400 }
			);
		}

		const db = getDB();
		const now = new Date();

		// Check if videoId already exists
		const existing = await db.collection(collections.backgroundVideos).findOne({ videoId });
		if (existing) {
			return json(
				{ success: false, error: 'Video with this ID already exists' },
				{ status: 409 }
			);
		}

		const newVideo: Partial<BackgroundVideo> = {
			videoId,
			videoName,
			description: description || '',
			videoUrl,
			thumbnailUrl: thumbnailUrl || '',
			duration: duration || 0,
			fileSize: fileSize || 0,
			areaTag: areaTag || 'all',
			isActive: isActive !== false,
			createdAt: now,
			updatedAt: now
		};

		const result = await db.collection(collections.backgroundVideos).insertOne(newVideo);

		return json({
			success: true,
			data: {
				_id: result.insertedId,
				...newVideo
			}
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating video:', error);
		return json({ success: false, error: 'Failed to create video' }, { status: 500 });
	}
};
