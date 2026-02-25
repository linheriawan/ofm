import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode, parsePagination } from '$lib/server/api/response';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { TripPurpose } from '$lib/server/db/schemas';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);

		// Parse pagination parameters
		const { page, limit, skip } = parsePagination(url);

		// Build query - show all trip purposes (no company filter for now)
		const query: any = {};

		console.log('Trip Purposes Query:', JSON.stringify(query));
		console.log('User companyId:', user.companyId);

		// Get total count
		const total = await tripPurposesCollection.countDocuments(query);
		console.log('Trip Purposes Total:', total);

		// Get paginated trip purposes
		const purposes = await tripPurposesCollection
			.find(query)
			.sort({ sortOrder: 1, name: 1 })
			.skip(skip)
			.limit(limit)
			.toArray();

		const totalPages = Math.ceil(total / limit);

		return json({
			success: true,
			data: purposes,
			meta: {
				page,
				limit,
				total,
				totalPages
			}
		});
	} catch (err: any) {
		console.error('Error fetching trip purposes:', err);
		return json(
			apiError(ErrorCode.INTERNAL_ERROR, `Failed to fetch trip purposes: ${err.message}`),
			{
				status: 500
			}
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const { name, category, description, requiresApproval, sortOrder } = body;

		if (!name || !category) {
			return json(apiError(ErrorCode.BAD_REQUEST, 'Name and category are required'), {
				status: 400
			});
		}

		const db = getDB();
		const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);

		// Generate purposeId
		const count = await tripPurposesCollection.countDocuments();
		const purposeId = `TP-${String(count + 1).padStart(3, '0')}`;

		const newPurpose: TripPurpose = {
			purposeId,
			name,
			category,
			description: description || undefined,
			requiresApproval: requiresApproval || false,
			isActive: true,
			sortOrder: sortOrder || 999,
			companyId: user.companyId || '',
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: user.userId,
			updatedBy: user.userId
		};

		const result = await tripPurposesCollection.insertOne(newPurpose);

		return json(success({ ...newPurpose, _id: result.insertedId }), { status: 201 });
	} catch (err: any) {
		console.error('Error creating trip purpose:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to create trip purpose'), {
			status: 500
		});
	}
};
