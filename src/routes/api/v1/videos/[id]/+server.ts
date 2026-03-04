import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';
import type { BackgroundVideo } from '$lib/types';

// GET /api/v1/videos/:id - Get specific video
export const GET: RequestHandler = async ({ params }) => {
	try {
		const db = getDB();
		const video = await db
			.collection<BackgroundVideo>(collections.backgroundVideos)
			.findOne({ _id: new ObjectId(params.id) });

		if (!video) {
			return json({ success: false, error: 'Video not found' }, { status: 404 });
		}

		return json({ success: true, data: video });
	} catch (error) {
		console.error('Error fetching video:', error);
		return json({ success: false, error: 'Failed to fetch video' }, { status: 500 });
	}
};

// PUT /api/v1/videos/:id - Update video
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const { videoName, description, thumbnailUrl, areaTag, isActive } = body;

		const db = getDB();
		const updateData: any = {
			updatedAt: new Date()
		};

		if (videoName !== undefined) updateData.videoName = videoName;
		if (description !== undefined) updateData.description = description;
		if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
		if (areaTag !== undefined) updateData.areaTag = areaTag;
		if (isActive !== undefined) updateData.isActive = isActive;

		const result = await db.collection(collections.backgroundVideos).findOneAndUpdate(
			{ _id: new ObjectId(params.id) },
			{ $set: updateData },
			{ returnDocument: 'after' }
		);

		if (!result) {
			return json({ success: false, error: 'Video not found' }, { status: 404 });
		}

		return json({ success: true, data: result });
	} catch (error) {
		console.error('Error updating video:', error);
		return json({ success: false, error: 'Failed to update video' }, { status: 500 });
	}
};

// DELETE /api/v1/videos/:id - Delete video
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const db = getDB();

		// First get the video to retrieve the videoUrl for deletion from storage
		const video = await db
			.collection<BackgroundVideo>(collections.backgroundVideos)
			.findOne({ _id: new ObjectId(params.id) });

		if (!video) {
			return json({ success: false, error: 'Video not found' }, { status: 404 });
		}

		// Delete from database
		await db.collection(collections.backgroundVideos).deleteOne({ _id: new ObjectId(params.id) });

		// TODO: Delete from storage (implement later)
		// await deleteFromStorage(video.videoUrl);

		return json({ success: true, message: 'Video deleted successfully' });
	} catch (error) {
		console.error('Error deleting video:', error);
		return json({ success: false, error: 'Failed to delete video' }, { status: 500 });
	}
};
