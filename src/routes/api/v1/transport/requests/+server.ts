/**
 * Transportation Requests API
 * POST /api/v1/transport/requests - Create new transport request
 * GET /api/v1/transport/requests - List transport requests with filters
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api/auth';
import { success, error, ErrorCode, parsePagination, createPaginationMeta } from '$lib/server/api/response';
import { parseBody, validateRequired, throwValidationError, isValidDate } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import { generateRequestNumber, type TransportationRequest } from '$lib/server/db/schemas';

interface CreateTransportRequestBody {
	type: 'company_car' | 'voucher';
	pickup: {
		address: string;
		latitude?: number;
		longitude?: number;
		notes?: string;
	};
	destination: {
		address: string;
		latitude?: number;
		longitude?: number;
		notes?: string;
	};
	scheduledTime: string;
	returnTime?: string;
	isRoundTrip: boolean;
	passengerCount: number;
	passengers?: string[];
	purpose: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	specialRequirements?: string;
}

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await parseBody<CreateTransportRequestBody>(event.request);

		// Validation
		const errors = validateRequired(body, ['type', 'pickup', 'destination', 'scheduledTime', 'purpose']);
		if (errors.length > 0) {
			throwValidationError(errors);
		}

		if (!isValidDate(body.scheduledTime)) {
			throwValidationError([{ field: 'scheduledTime', message: 'Invalid date format' }]);
		}

		// Create request
		const db = getDB();
		const now = new Date();

		const request: TransportationRequest = {
			requestNumber: generateRequestNumber('TR'),
			type: body.type,
			userId: user.userId,
			userName: user.name || user.email,
			userEmail: user.email,
			companyId: user.companyId || 'default',

			pickup: body.pickup,
			destination: body.destination,
			scheduledTime: new Date(body.scheduledTime),
			returnTime: body.returnTime ? new Date(body.returnTime) : undefined,
			isRoundTrip: body.isRoundTrip || false,
			passengerCount: body.passengerCount || 1,
			passengers: body.passengers,

			purpose: body.purpose,
			priority: body.priority || 'medium',
			specialRequirements: body.specialRequirements,

			status: 'pending',

			createdAt: now,
			updatedAt: now,
			createdBy: user.userId
		};

		const result = await db.collection(collections.transportationRequests).insertOne(request);

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
		const startDate = event.url.searchParams.get('startDate');
		const endDate = event.url.searchParams.get('endDate');
		const userId = event.url.searchParams.get('userId');

		// Build query
		const query: any = {};

		// Check if user is admin
		const userRoles = user.roles || [];
		const isAdmin = userRoles.includes('admin') || userRoles.includes('regional_admin') || userRoles.includes('super_admin');

		console.log('🔍 Transport requests query - User:', user.email, 'Roles:', userRoles, 'isAdmin:', isAdmin);

		// Regular users can only see their own requests
		// Admins can see all requests or filter by userId
		if (!isAdmin) {
			query.userId = user.userId;
			console.log('   👤 Non-admin: filtering by userId:', user.userId);
		} else if (userId) {
			query.userId = userId;
			console.log('   👨‍💼 Admin: filtering by requested userId:', userId);
		} else {
			console.log('   👨‍💼 Admin: showing all requests (no userId filter)');
		}

		if (status) query.status = status;
		if (type) query.type = type;
		if (startDate || endDate) {
			query.scheduledTime = {};
			if (startDate) query.scheduledTime.$gte = new Date(startDate);
			if (endDate) query.scheduledTime.$lte = new Date(endDate);
		}

		console.log('   🔎 Final query:', JSON.stringify(query));
		console.log('   📄 Pagination: page', page, 'limit', limit, 'skip', skip);

		// Execute query
		const [requests, total] = await Promise.all([
			db.collection(collections.transportationRequests)
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection(collections.transportationRequests).countDocuments(query)
		]);

		console.log('   ✅ Found', total, 'requests, returning', requests.length, 'items');

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
