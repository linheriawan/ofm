/**
 * Meeting Requests API
 * POST /api/v1/meeting/requests - Create new meeting request
 * GET /api/v1/meeting/requests - List meeting requests with filters
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api/auth';
import { success, error, ErrorCode, parsePagination, createPaginationMeta } from '$lib/server/api/response';
import { parseBody, validateRequired, throwValidationError, isValidDate } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import { generateRequestNumber, calculateDuration, type MeetingRequest } from '$lib/server/db/schemas';
import { listMeetingRequests } from '$lib/services/meeting-request-service';

interface CreateMeetingRequestBody {
	title: string;
	description?: string;
	type: 'online' | 'offline' | 'hybrid';
	startTime: string;
	endTime: string;
	participantCount: number;
	participants: string[];
	externalParticipants?: number;
	roomId?: string;
	locationId?: string;
	platform?: 'zoom' | 'google_meet' | 'teams';
	requiredFacilities?: string[];
	cateringRequired?: boolean;
	cateringDetails?: {
		type: 'snack' | 'lunch' | 'dinner';
		itemCount: number;
		notes?: string;
	};
}

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await parseBody<CreateMeetingRequestBody>(event.request);

		// Validation
		const errors = validateRequired(body, ['title', 'type', 'startTime', 'endTime', 'participants']);
		if (errors.length > 0) {
			throwValidationError(errors);
		}

		if (!isValidDate(body.startTime) || !isValidDate(body.endTime)) {
			throwValidationError([{ field: 'time', message: 'Invalid date format' }]);
		}

		const startTime = new Date(body.startTime);
		const endTime = new Date(body.endTime);

		if (endTime <= startTime) {
			throwValidationError([{ field: 'endTime', message: 'End time must be after start time' }]);
		}

		// Check duration (max 8 hours)
		const duration = calculateDuration(startTime, endTime);
		if (duration > 480) {
			throwValidationError([{ field: 'duration', message: 'Maximum meeting duration is 8 hours' }]);
		}

		// Validate type-specific requirements
		if ((body.type === 'offline' || body.type === 'hybrid') && !body.roomId) {
			throwValidationError([{ field: 'roomId', message: 'Room is required for offline/hybrid meetings' }]);
		}

		if ((body.type === 'online' || body.type === 'hybrid') && !body.platform) {
			throwValidationError([{ field: 'platform', message: 'Platform is required for online/hybrid meetings' }]);
		}

		// Create request
		const db = getDB();
		const now = new Date();

		const request: MeetingRequest = {
			requestNumber: generateRequestNumber('MR'),
			userId: user.userId,
			userName: user.name || user.email,
			userEmail: user.email,
			companyId: user.companyId || 'default',

			title: body.title,
			description: body.description,
			type: body.type,
			startTime,
			endTime,
			duration,

			participantCount: body.participantCount || body.participants.length,
			participants: body.participants,
			externalParticipants: body.externalParticipants,

			roomId: body.roomId,
			locationId: body.locationId,

			platform: body.platform,

			requiredFacilities: body.requiredFacilities,
			cateringRequired: body.cateringRequired || false,
			cateringDetails: body.cateringDetails,

			status: 'pending',

			createdAt: now,
			updatedAt: now,
			createdBy: user.userId
		};

		const result = await db.collection(collections.meetingRequests).insertOne(request);

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
		await requireAuth(event);
		const { page, limit } = parsePagination(event.url);
		const sp = event.url.searchParams;
		const result = await listMeetingRequests(getDB(), {
			page, limit,
			status:    sp.get('status')   ?? undefined,
			type:      sp.get('type')     ?? undefined,
			roomId:    sp.get('roomId')   ?? undefined,
			startDate: sp.get('startDate') ?? undefined,
			endDate:   sp.get('endDate')  ?? undefined,
			sortDir:  (sp.get('sortDir') as 'asc' | 'desc') ?? 'desc'
		});
		return json(success(result.data, result.meta));
	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch requests', err.message), { status: 500 });
	}
};
