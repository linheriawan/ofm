import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';
import type { TripPurpose } from '$lib/server/db/schemas';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);

		const purpose = await tripPurposesCollection.findOne({
			_id: new ObjectId(params.id),
			companyId: user.companyId || 'IAS'
		});

		if (!purpose) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Trip purpose not found'), { status: 404 });
		}

		return json(success(purpose));
	} catch (err: any) {
		console.error('Error fetching trip purpose:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch trip purpose'), {
			status: 500
		});
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const { name, category, description, requiresApproval, isActive, sortOrder } = body;

		const db = getDB();
		const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);

		const updateData: Partial<TripPurpose> = {
			...(name && { name }),
			...(category && { category }),
			...(description !== undefined && { description }),
			...(requiresApproval !== undefined && { requiresApproval }),
			...(isActive !== undefined && { isActive }),
			...(sortOrder !== undefined && { sortOrder }),
			updatedAt: new Date(),
			updatedBy: user.userId
		};

		const result = await tripPurposesCollection.findOneAndUpdate(
			{
				_id: new ObjectId(params.id),
				companyId: user.companyId || 'IAS'
			},
			{ $set: updateData },
			{ returnDocument: 'after' }
		);

		if (!result) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Trip purpose not found'), { status: 404 });
		}

		return json(success(result));
	} catch (err: any) {
		console.error('Error updating trip purpose:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to update trip purpose'), {
			status: 500
		});
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);
		const transportationRequestsCollection = db.collection(collections.transportationRequests);

		// Check if any requests use this purpose
		const requestCount = await transportationRequestsCollection.countDocuments({
			purposeId: params.id
		});

		if (requestCount > 0) {
			return json(
				apiError(
					ErrorCode.BAD_REQUEST,
					`Cannot delete. This purpose is used by ${requestCount} transportation request(s). Please set it as inactive instead.`
				),
				{ status: 400 }
			);
		}

		const result = await tripPurposesCollection.deleteOne({
			_id: new ObjectId(params.id),
			companyId: user.companyId || 'IAS'
		});

		if (result.deletedCount === 0) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Trip purpose not found'), { status: 404 });
		}

		return json(success({ deleted: true }));
	} catch (err: any) {
		console.error('Error deleting trip purpose:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete trip purpose'), {
			status: 500
		});
	}
};
