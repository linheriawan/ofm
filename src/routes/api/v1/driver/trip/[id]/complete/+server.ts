/**
 * Driver Trip Complete API
 * POST /api/v1/driver/trip/:id/complete - Confirm trip completion (ATD - Actual Time of Departure/Delivery)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ObjectId } from 'mongodb';
import { requireAuth, isDriver } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody, isValidObjectId } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { TripEvent, Location } from '$lib/server/db/schemas';

interface TripCompleteBody {
	location?: Location;
	notes?: string;
	photos?: string[];
	passengerSignature?: string; // Base64 encoded signature image
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

		const body = await parseBody<TripCompleteBody>(event.request);
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

		// Check if trip was started
		const startEvent = await db.collection(collections.tripEvents)
			.findOne({ requestId: id, eventType: 'started' });

		if (!startEvent) {
			return json(error(ErrorCode.BAD_REQUEST, 'Trip must be started first'), { status: 400 });
		}

		// Check if already completed
		const existingComplete = await db.collection(collections.tripEvents)
			.findOne({ requestId: id, eventType: 'completed' });

		if (existingComplete) {
			return json(error(ErrorCode.CONFLICT, 'Trip already completed'), { status: 409 });
		}

		// Create trip event
		const tripEvent: TripEvent = {
			tripId: id,
			requestId: id,
			driverId: user.userId,
			vehicleId: request.vehicleId || '',

			eventType: 'completed',
			timestamp: now,
			location: body.location,

			actualTime: now,

			notes: body.notes,
			photos: body.photos,

			createdAt: now,
			updatedAt: now,
			createdBy: user.userId
		};

		await db.collection(collections.tripEvents).insertOne(tripEvent);

		// Update request status to completed
		await db.collection(collections.transportationRequests).updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { status: 'completed', updatedAt: now } }
		);

		// Calculate trip duration
		const duration = Math.floor((now.getTime() - startEvent.actualTime.getTime()) / (1000 * 60));

		return json(success({
			message: 'Trip completed successfully',
			tripEvent: {
				...tripEvent,
				_id: tripEvent._id?.toString()
			},
			duration: duration
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to complete trip', err.message), { status: 500 });
	}
};
