/**
 * Meeting Cancellation Report API
 * GET /api/v1/reports/meeting-cancellations - Cancelled meeting counts grouped by department
 *
 * Query params:
 * - startDate: YYYY-MM-DD (default: 30 days before endDate)
 * - endDate: YYYY-MM-DD, inclusive (default: today)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdmin } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { connectDB, getDB, collections } from '$lib/server/db/mongodb';

export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		if (!isAdmin(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Admin access required'), { status: 403 });
		}

		const startParam = event.url.searchParams.get('startDate');
		const endParam = event.url.searchParams.get('endDate');

		const end = endParam ? new Date(endParam) : new Date();
		if (isNaN(end.getTime())) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid endDate'), { status: 400 });
		}
		end.setHours(23, 59, 59, 999);

		const start = startParam ? new Date(startParam) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
		if (isNaN(start.getTime())) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid startDate'), { status: 400 });
		}
		start.setHours(0, 0, 0, 0);

		if (start > end) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'startDate must be before endDate'), { status: 400 });
		}

		await connectDB();
		const db = getDB();

		// Older cancelled records may predate the cancelledAt field, fall back to updatedAt
		const rows = await db.collection(collections.meetingRequests).aggregate([
			{ $match: { status: 'cancelled' } },
			{ $addFields: { cancelDate: { $ifNull: ['$cancelledAt', '$updatedAt'] } } },
			{ $match: { cancelDate: { $gte: start, $lte: end } } },
			{ $lookup: {
				from: collections.users,
				localField: 'userId',
				foreignField: 'userId',
				as: 'requester'
			} },
			{ $group: {
				_id: { $arrayElemAt: ['$requester.departmentId', 0] },
				cancelledCount: { $sum: 1 }
			} },
			{ $sort: { cancelledCount: -1 } }
		]).toArray();

		// Resolve department names (SCIM-synced docs use externalId/unitName, manual ones departmentId/departmentName)
		const departments = await db.collection(collections.departments).find({}).toArray();
		const nameById = new Map<string, string>();
		for (const d of departments) {
			const name = d.unitName || d.departmentName || '';
			for (const key of [d.externalId, d.departmentId, d._id?.toString()]) {
				if (key && name) nameById.set(key, name);
			}
		}

		const data = rows.map((r) => ({
			departmentId: r._id ?? null,
			departmentName: r._id ? (nameById.get(r._id) || r._id) : 'No Department',
			cancelledCount: r.cancelledCount
		}));

		return json(success({
			startDate: start.toISOString(),
			endDate: end.toISOString(),
			totalCancelled: data.reduce((sum, r) => sum + r.cancelledCount, 0),
			departments: data
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		console.error('Error generating meeting cancellation report:', err);
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to generate report', err.message), { status: 500 });
	}
};
