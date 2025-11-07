/**
 * Meeting Request Update API
 * PATCH /api/v1/meeting/requests/[id] - Update meeting request (approve/reject/assign)
 * DELETE /api/v1/meeting/requests/[id] - Cancel meeting request
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody } from '$lib/server/api/validation';
import { connectDB, getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

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
		const request = await db.collection(collections.meetingRequests).findOne({
			_id: new ObjectId(id)
		});

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		let updateData: any = {
			updatedAt: now,
			updatedBy: user.userId
		};

		// Handle general field updates (editing booking details)
		if (!body.action) {
			// Only owner or admin can edit
			if (request.userId !== user.userId && !user.roles?.includes('admin')) {
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

		// Handle action-based updates
		switch (body.action) {
			case 'approve':
				if (request.status !== 'pending') {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Only pending requests can be approved'), { status: 400 });
				}

				updateData.status = 'approved';
				updateData.approvedBy = user.userId;
				updateData.approverName = user.name || user.email;
				updateData.approvalDate = now;
				if (body.notes) updateData.approvalNotes = body.notes;
				break;

			case 'reject':
				if (request.status !== 'pending') {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Only pending requests can be rejected'), { status: 400 });
				}

				if (!body.rejectionReason) {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Rejection reason is required'), { status: 400 });
				}

				updateData.status = 'rejected';
				updateData.rejectedBy = user.userId;
				updateData.rejectionReason = body.rejectionReason;
				updateData.rejectionDate = now;
				break;

			case 'assign_room':
				if (request.status !== 'approved') {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Only approved requests can have rooms assigned'), { status: 400 });
				}

				if (!body.roomId) {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Room ID is required'), { status: 400 });
				}

				// Check room availability
				const conflictingBooking = await db.collection(collections.meetingRequests).findOne({
					roomId: body.roomId,
					status: { $in: ['assigned', 'in_progress'] },
					$or: [
						{
							startTime: { $lt: request.endTime },
							endTime: { $gt: request.startTime }
						}
					]
				});

				if (conflictingBooking) {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Room is not available for the selected time'), { status: 400 });
				}

				updateData.roomId = body.roomId;
				updateData.roomName = body.roomName;
				updateData.status = 'assigned';
				updateData.assignedAt = now;
				updateData.assignedBy = user.userId;
				break;

			case 'assign_license':
				if (request.status !== 'approved' && request.status !== 'assigned') {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Only approved/assigned requests can have licenses assigned'), { status: 400 });
				}

				if (!body.licenseId) {
					return json(error(ErrorCode.VALIDATION_ERROR, 'License ID is required'), { status: 400 });
				}

				updateData.licenseId = body.licenseId;
				updateData.platform = body.platform;
				updateData.meetingLink = body.meetingLink;
				updateData.status = 'assigned';
				updateData.assignedAt = now;
				updateData.assignedBy = user.userId;
				break;

			case 'cancel':
				if (request.status === 'completed' || request.status === 'cancelled') {
					return json(error(ErrorCode.VALIDATION_ERROR, 'Cannot cancel completed or already cancelled requests'), { status: 400 });
				}

				updateData.status = 'cancelled';
				updateData.cancelledBy = user.userId;
				updateData.cancelledAt = now;
				if (body.notes) updateData.cancellationReason = body.notes;
				break;

			default:
				return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid action'), { status: 400 });
		}

		// Update request
		await db.collection(collections.meetingRequests).updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updateData }
		);

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
