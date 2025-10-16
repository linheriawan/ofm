/**
 * Facility Requests API (NEW MODULE)
 * POST /api/v1/facility/requests - Create new facility request (ATK, equipment)
 * GET /api/v1/facility/requests - List facility requests with filters
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api/auth';
import { success, error, ErrorCode, parsePagination, createPaginationMeta } from '$lib/server/api/response';
import { parseBody, validateRequired, throwValidationError } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import { generateRequestNumber, type FacilityRequest, type FacilityRequestItem } from '$lib/server/db/schemas';

interface CreateFacilityRequestBody {
	type: 'atk' | 'equipment' | 'furniture' | 'other';
	category: string;
	items: FacilityRequestItem[];
	deliveryLocation: string;
	deliveryDate?: string;
	urgency?: 'low' | 'medium' | 'high' | 'urgent';
	purpose: string;
	notes?: string;
}

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await parseBody<CreateFacilityRequestBody>(event.request);

		// Validation
		const errors = validateRequired(body, ['type', 'category', 'items', 'deliveryLocation', 'purpose']);
		if (errors.length > 0) {
			throwValidationError(errors);
		}

		if (!body.items || body.items.length === 0) {
			throwValidationError([{ field: 'items', message: 'At least one item is required' }]);
		}

		// Validate each item
		for (const item of body.items) {
			if (!item.itemName || !item.quantity || !item.unit) {
				throwValidationError([{
					field: 'items',
					message: 'Each item must have itemName, quantity, and unit'
				}]);
			}
		}

		// Create request
		const db = getDB();
		const now = new Date();

		const request: FacilityRequest = {
			requestNumber: generateRequestNumber('FR'),
			userId: user.userId,
			userName: user.name || user.email,
			userEmail: user.email,
			companyId: user.companyId || 'default',

			type: body.type,
			category: body.category,
			items: body.items,

			deliveryLocation: body.deliveryLocation,
			deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
			urgency: body.urgency || 'medium',

			purpose: body.purpose,
			notes: body.notes,

			status: 'pending',

			createdAt: now,
			updatedAt: now,
			createdBy: user.userId
		};

		// Calculate estimated cost if item prices are provided
		const estimatedCost = request.items.reduce((total, item) => {
			return total + (item.estimatedPrice || 0) * item.quantity;
		}, 0);

		if (estimatedCost > 0) {
			request.estimatedCost = estimatedCost;
		}

		const result = await db.collection(collections.facilityRequests).insertOne(request);

		return json(success({
			...request,
			_id: result.insertedId.toString()
		}), { status: 201 });

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to create request', err.message), { status: 500 });
	}
};

export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const db = getDB();

		// Parse pagination
		const { page, limit, skip } = parsePagination(event.url);

		// Parse filters
		const status = event.url.searchParams.get('status');
		const type = event.url.searchParams.get('type');
		const category = event.url.searchParams.get('category');
		const urgency = event.url.searchParams.get('urgency');

		// Build query
		const query: any = {};

		// Regular users can only see their own requests
		if (!user.roles.includes('admin') && !user.roles.includes('regional_admin')) {
			query.userId = user.userId;
		}

		if (status) query.status = status;
		if (type) query.type = type;
		if (category) query.category = category;
		if (urgency) query.urgency = urgency;

		// Execute query
		const [requests, total] = await Promise.all([
			db.collection(collections.facilityRequests)
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection(collections.facilityRequests).countDocuments(query)
		]);

		// Format response
		const formattedRequests = requests.map(req => ({
			...req,
			_id: req._id?.toString()
		}));

		return json(success(
			formattedRequests,
			createPaginationMeta(page, limit, total)
		));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch requests', err.message), { status: 500 });
	}
};
