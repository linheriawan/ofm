/**
 * Driver Location API
 * POST /api/v1/driver/location - Update driver GPS location
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isDriver } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody, validateRequired, throwValidationError } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { DriverLocation } from '$lib/server/db/schemas';

interface LocationUpdateBody {
	latitude: number;
	longitude: number;
	accuracy?: number;
	speed?: number;
	heading?: number;
	tripId?: string;
	isOnDuty: boolean;
}

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Only drivers can update location
		if (!isDriver(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Driver role required'), { status: 403 });
		}

		const body = await parseBody<LocationUpdateBody>(event.request);

		// Validation
		const errors = validateRequired(body, ['latitude', 'longitude', 'isOnDuty']);
		if (errors.length > 0) {
			throwValidationError(errors);
		}

		// Validate coordinates
		if (body.latitude < -90 || body.latitude > 90) {
			throwValidationError([{ field: 'latitude', message: 'Invalid latitude' }]);
		}
		if (body.longitude < -180 || body.longitude > 180) {
			throwValidationError([{ field: 'longitude', message: 'Invalid longitude' }]);
		}

		const db = getDB();
		const now = new Date();

		// Get driver profile for vehicle info
		const driverProfile = await db.collection(collections.driverProfiles)
			.findOne({ userId: user.userId });

		// Create location record
		const location: DriverLocation = {
			driverId: user.userId,
			vehicleId: driverProfile?.assignedVehicleId,
			tripId: body.tripId,

			latitude: body.latitude,
			longitude: body.longitude,
			accuracy: body.accuracy,
			speed: body.speed,
			heading: body.heading,

			timestamp: now,
			isOnDuty: body.isOnDuty,

			createdAt: now,
			updatedAt: now
		};

		await db.collection(collections.driverLocations).insertOne(location);

		// Update driver profile's current location
		await db.collection(collections.driverProfiles).updateOne(
			{ userId: user.userId },
			{
				$set: {
					currentLocation: {
						address: '', // TODO: Reverse geocoding
						latitude: body.latitude,
						longitude: body.longitude
					},
					lastLocationUpdate: now,
					isOnDuty: body.isOnDuty
				}
			}
		);

		return json(success({
			message: 'Location updated successfully',
			timestamp: now
		}));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to update location', err.message), { status: 500 });
	}
};
