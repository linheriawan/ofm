/**
 * Driver Assignments API
 * GET /api/v1/driver/assignments - Get assigned trips for driver
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isDriver } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { getDB, collections } from '$lib/server/db/mongodb';

export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Only drivers can access this endpoint
		if (!isDriver(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Driver role required'), { status: 403 });
		}

		const db = getDB();

		// Get driver profile to find assigned vehicle
		const driverProfile = await db.collection(collections.driverProfiles)
			.findOne({ userId: user.userId });

		if (!driverProfile) {
			return json(error(ErrorCode.NOT_FOUND, 'Driver profile not found'), { status: 404 });
		}

		// Parse date filter (default: today)
		const date = event.url.searchParams.get('date') || new Date().toISOString().split('T')[0];
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		// Get assigned trips
		const trips = await db.collection(collections.transportationRequests)
			.find({
				driverId: user.userId,
				status: { $in: ['approved', 'completed'] },
				scheduledTime: {
					$gte: startOfDay,
					$lte: endOfDay
				}
			})
			.sort({ scheduledTime: 1 })
			.toArray();

		// Format trips
		const formattedTrips = trips.map(trip => ({
			_id: trip._id?.toString(),
			requestNumber: trip.requestNumber,
			type: trip.type,
			status: trip.status,
			scheduledTime: trip.scheduledTime,
			returnTime: trip.returnTime,
			isRoundTrip: trip.isRoundTrip,
			pickup: trip.pickup,
			destination: trip.destination,
			passengerName: trip.userName,
			passengerEmail: trip.userEmail,
			passengerCount: trip.passengerCount,
			passengers: trip.passengers,
			purpose: trip.purpose,
			specialRequirements: trip.specialRequirements,
			vehicleId: trip.vehicleId
		}));

		return json(success({
			date,
			driverId: user.userId,
			driverName: driverProfile.name,
			assignedVehicleId: driverProfile.assignedVehicleId,
			trips: formattedTrips,
			totalTrips: formattedTrips.length
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch assignments', err.message), { status: 500 });
	}
};
