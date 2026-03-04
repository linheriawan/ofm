/**
 * Transportation Request Detail API
 * GET /api/v1/transport/requests/:id - Get request details
 * PATCH /api/v1/transport/requests/:id - Update request (approve/reject/cancel)
 * DELETE /api/v1/transport/requests/:id - Cancel request
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ObjectId } from 'mongodb';
import { requireAuth, isAdmin } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody, isValidObjectId } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';

export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const db = getDB();
		const request = await db.collection(collections.transportationRequests)
			.findOne({ _id: new ObjectId(id) });

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		// Check permissions: user can only see their own requests (unless admin)
		if (request.userId !== user.userId && !isAdmin(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Access denied'), { status: 403 });
		}

		return json(success({
			...request,
			_id: request._id?.toString()
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch request', err.message), { status: 500 });
	}
};

export const PATCH: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const body = await parseBody<{
			status?: 'approved' | 'rejected' | 'cancelled';
			rejectionReason?: string;
			vehicleId?: string;
			driverId?: string;
			voucherCode?: string;
			voucherAmount?: number;
		}>(event.request);

		const db = getDB();
		const request = await db.collection(collections.transportationRequests)
			.findOne({ _id: new ObjectId(id) });

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		// Check permissions
		const isOwner = request.userId === user.userId;
		const canApprove = isAdmin(user);
		const canCancel = isOwner || isAdmin(user);

		// Build update
		const update: any = {
			updatedAt: new Date(),
			updatedBy: user.userId
		};

		if (body.status === 'approved' && canApprove) {
			update.status = 'approved';
			update.approvedBy = user.userId;
			update.approvedAt = new Date();

			if (body.vehicleId) update.vehicleId = body.vehicleId;
			if (body.driverId) update.driverId = body.driverId;
			if (body.driverId || body.vehicleId) update.assignedAt = new Date();

			if (body.voucherCode) update.voucherCode = body.voucherCode;
			if (body.voucherAmount) update.voucherAmount = body.voucherAmount;

		} else if (body.status === 'rejected' && canApprove) {
			update.status = 'rejected';
			update.rejectionReason = body.rejectionReason || 'No reason provided';

		} else if (body.status === 'cancelled' && canCancel) {
			update.status = 'cancelled';

		} else {
			return json(error(ErrorCode.FORBIDDEN, 'Insufficient permissions'), { status: 403 });
		}

		// Update request
		await db.collection(collections.transportationRequests)
			.updateOne({ _id: new ObjectId(id) }, { $set: update });

		const updatedRequest = await db.collection(collections.transportationRequests)
			.findOne({ _id: new ObjectId(id) });

		return json(success({
			...updatedRequest,
			_id: updatedRequest?._id?.toString()
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to update request', err.message), { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const db = getDB();
		const request = await db.collection(collections.transportationRequests)
			.findOne({ _id: new ObjectId(id) });

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		// Only owner or admin can delete
		if (request.userId !== user.userId && !isAdmin(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Access denied'), { status: 403 });
		}

		// Soft delete: mark as cancelled instead of actual deletion
		await db.collection(collections.transportationRequests).updateOne(
			{ _id: new ObjectId(id) },
			{
				$set: {
					status: 'cancelled',
					updatedAt: new Date(),
					updatedBy: user.userId
				}
			}
		);

		return json(success({ message: 'Request cancelled successfully' }));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to delete request', err.message), { status: 500 });
	}
};
