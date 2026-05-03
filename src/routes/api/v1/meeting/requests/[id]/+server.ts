/**
 * Meeting Request API
 * GET /api/v1/meeting/requests/[id] - Get single meeting request
 * PATCH /api/v1/meeting/requests/[id] - Update meeting request (approve/reject/assign)
 * DELETE /api/v1/meeting/requests/[id] - Cancel meeting request
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdmin, canApprove } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody } from '$lib/server/api/validation';
import { connectDB, getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';
import { getMeetingRequest, applyAction } from '$lib/services/meeting-request-service';

/**
 * GET /api/v1/meeting/requests/[id]
 * Get single meeting request details
 */
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		await connectDB();
		const db = getDB();

		const request = await getMeetingRequest(db, id);
		if (!request) return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		return json(success(request));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		console.error('Error fetching meeting request:', err);
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch request', err.message), { status: 500 });
	}
};

interface UpdateMeetingRequestBody {
	action?: 'approve' | 'reject' | 'assign_room' | 'assign_license' | 'cancel';
	rejectionReason?: string;
	notes?: string;
	roomId?: string;
	roomName?: string;
	licenseId?: string;
	platform?: 'zoom' | 'google_meet' | 'teams';
	meetingLink?: string;

	// For general updates (editing booking details)
	title?: string;
	description?: string;
	type?: 'online' | 'offline' | 'hybrid';
	startTime?: string;
	endTime?: string;
	participantCount?: number;
	participants?: string[];
	externalParticipants?: number;
	requiredFacilities?: string[];
	cateringRequired?: boolean;
	cateringDetails?: {
		type: 'snack' | 'lunch' | 'dinner';
		itemCount: number;
		notes?: string;
	};
}

export const PATCH: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;
		const body = await parseBody<UpdateMeetingRequestBody>(event.request);

		await connectDB();
		const db = getDB();
		const now = new Date();

		// Check if request exists
		const request = await db.collection(collections.meetingRequests).findOne({ _id: new ObjectId(id) });
		if (!request) return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });

		// Handle general field updates (editing booking details)
		if (!body.action) {
			const updateData: any = { updatedAt: now, updatedBy: user.userId };
			// Only owner or admin can edit
			if (request.userId !== user.userId && !isAdmin(user)) {
				return json(error(ErrorCode.FORBIDDEN, 'You can only edit your own requests'), { status: 403 });
			}

			// Only pending or approved requests can be edited
			if (request.status !== 'pending' && request.status !== 'approved') {
				return json(error(ErrorCode.VALIDATION_ERROR, 'Only pending or approved requests can be edited'), { status: 400 });
			}

			// Update allowed fields
			if (body.title) updateData.title = body.title;
			if (body.description !== undefined) updateData.description = body.description;
			if (body.type) updateData.type = body.type;
			if (body.startTime) {
				updateData.startTime = new Date(body.startTime);
			}
			if (body.endTime) {
				updateData.endTime = new Date(body.endTime);
			}
			if (updateData.startTime && updateData.endTime) {
				updateData.duration = Math.floor((updateData.endTime.getTime() - updateData.startTime.getTime()) / (1000 * 60));
			}
			if (body.participantCount) updateData.participantCount = body.participantCount;
			if (body.participants) updateData.participants = body.participants;
			if (body.externalParticipants !== undefined) updateData.externalParticipants = body.externalParticipants;
			if (body.roomId !== undefined) updateData.roomId = body.roomId;
			if (body.platform) updateData.platform = body.platform;
			if (body.requiredFacilities !== undefined) updateData.requiredFacilities = body.requiredFacilities;
			if (body.cateringRequired !== undefined) updateData.cateringRequired = body.cateringRequired;
			if (body.cateringDetails !== undefined) updateData.cateringDetails = body.cateringDetails;
			if (body.notes !== undefined) updateData.notes = body.notes;

			// Update request
			await db.collection(collections.meetingRequests).updateOne(
				{ _id: new ObjectId(id) },
				{ $set: updateData }
			);

			return json(success({ message: 'Booking updated successfully' }));
		}

		// Handle action-based updates via service
		const result = await applyAction(db, id, request, body, user, canApprove, isAdmin);
		if (result.error) {
			const code = result.status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.VALIDATION_ERROR;
			return json(error(code, result.error), { status: result.status });
		}
		return json(success({ message: 'Request updated successfully' }));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		console.error('Error updating meeting request:', err);
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to update request', err.message), { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		await connectDB();
		const db = getDB();

		// Check if request exists and belongs to user
		const request = await db.collection(collections.meetingRequests).findOne({
			_id: new ObjectId(id)
		});

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		// Only allow users to delete their own pending requests
		if (request.userId !== user.userId && !user.roles.includes('admin')) {
			return json(error(ErrorCode.FORBIDDEN, 'You can only delete your own requests'), { status: 403 });
		}

		if (request.status !== 'pending') {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Only pending requests can be deleted'), { status: 400 });
		}

		await db.collection(collections.meetingRequests).deleteOne({
			_id: new ObjectId(id)
		});

		return json(success({ message: 'Request deleted successfully' }));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		console.error('Error deleting meeting request:', err);
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to delete request', err.message), { status: 500 });
	}
};
