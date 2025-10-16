/**
 * Driver Trip Start API
 * POST /api/v1/driver/trip/:id/start - Confirm trip start (ATA - Actual Time of Arrival at pickup)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ObjectId } from 'mongodb';
import { requireAuth, isDriver } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody, isValidObjectId } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { TripEvent, Location } from '$lib/server/db/schemas';

interface TripStartBody {
	location?: Location;
	notes?: string;
	photos?: string[];
}

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isDriver(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Driver role required'), { status: 403 });
		}

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const body = await parseBody<TripStartBody>(event.request);
		const db = getDB();
		const now = new Date();

		// Get request
		const request = await db.collection(collections.transportationRequests)
			.findOne({ _id: new ObjectId(id) });

		if (!request) {
			return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		}

		// Check if driver is assigned to this trip
		if (request.driverId !== user.userId) {
			return json(error(ErrorCode.FORBIDDEN, 'Not assigned to this trip'), { status: 403 });
		}

		// Check if already started
		const existingEvent = await db.collection(collections.tripEvents)
			.findOne({ requestId: id, eventType: 'started' });

		if (existingEvent) {
			return json(error(ErrorCode.CONFLICT, 'Trip already started'), { status: 409 });
		}

		// Calculate delay
		const scheduledTime = new Date(request.scheduledTime);
		const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / (1000 * 60));

		// Create trip event
		const tripEvent: TripEvent = {
			tripId: id,
			requestId: id,
			driverId: user.userId,
			vehicleId: request.vehicleId || '',

			eventType: 'started',
			timestamp: now,
			location: body.location,

			scheduledTime,
			actualTime: now,
			delayMinutes: delayMinutes > 0 ? delayMinutes : 0,

			notes: body.notes,
			photos: body.photos,

			createdAt: now,
			updatedAt: now,
			createdBy: user.userId
		};

		await db.collection(collections.tripEvents).insertOne(tripEvent);

		// Update request status if needed
		if (request.status !== 'in_progress') {
			await db.collection(collections.transportationRequests).updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { status: 'in_progress', updatedAt: now } }
			);
		}

		return json(success({
			message: 'Trip started successfully',
			tripEvent: {
				...tripEvent,
				_id: tripEvent._id?.toString()
			},
			delayMinutes: tripEvent.delayMinutes
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to start trip', err.message), { status: 500 });
	}
};
