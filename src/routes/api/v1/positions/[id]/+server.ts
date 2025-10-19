import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { ObjectId } from 'mongodb';

// GET - Get single position
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const position = await db
			.collection(collections.positions)
			.findOne({ _id: new ObjectId(params.id) });

		if (!position) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Position not found'), { status: 404 });
		}

		return json(success({ ...position, _id: position._id?.toString() }));
	} catch (err: any) {
		console.error('Error fetching position:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch position'), { status: 500 });
	}
};

// PUT - Update position
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const db = getDB();

		// Check if position exists
		const existing = await db
			.collection(collections.positions)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Position not found'), { status: 404 });
		}

		// If changing positionId, check for duplicates
		if (body.positionId && body.positionId !== existing.positionId) {
			const duplicate = await db
				.collection(collections.positions)
				.findOne({ positionId: body.positionId });

			if (duplicate) {
				return json(
					apiError(ErrorCode.VALIDATION_ERROR, 'Position with this ID already exists'),
					{ status: 400 }
				);
			}
		}

		const updateData = {
			...(body.positionId && { positionId: body.positionId }),
			...(body.positionName && { positionName: body.positionName }),
			...(body.code !== undefined && { code: body.code }),
			...(body.level !== undefined && { level: body.level }),
			...(body.grade !== undefined && { grade: body.grade }),
			...(body.companyId && { companyId: body.companyId }),
			...(body.ssoPositionId !== undefined && { ssoPositionId: body.ssoPositionId }),
			...(body.isActive !== undefined && { isActive: body.isActive }),
			updatedAt: new Date(),
			updatedBy: user.email
		};

		await db
			.collection(collections.positions)
			.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });

		return json(success(null, null, 'Position updated successfully'));
	} catch (err: any) {
		console.error('Error updating position:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to update position'), { status: 500 });
	}
};

// DELETE - Delete position
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();

		// Check if position exists
		const existing = await db
			.collection(collections.positions)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Position not found'), { status: 404 });
		}

		// Check if position is used by users
		const usersCount = await db
			.collection('users')
			.countDocuments({ positionId: existing.positionId });

		if (usersCount > 0) {
			return json(
				apiError(
					ErrorCode.VALIDATION_ERROR,
					`Cannot delete position. ${usersCount} user(s) are associated with it.`
				),
				{ status: 400 }
			);
		}

		await db.collection(collections.positions).deleteOne({ _id: new ObjectId(params.id) });

		return json(success(null, null, 'Position deleted successfully'));
	} catch (err: any) {
		console.error('Error deleting position:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete position'), { status: 500 });
	}
};
