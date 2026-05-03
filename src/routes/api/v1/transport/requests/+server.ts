/**
 * Transportation Requests API
 * POST /api/v1/transport/requests - Create new transport request
 * GET /api/v1/transport/requests - List transport requests with filters
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/api/auth';
import { success, error, ErrorCode, parsePagination } from '$lib/server/api/response';
import { parseBody, validateRequired, throwValidationError, isValidDate } from '$lib/server/api/validation';
import { getDB, collections } from '$lib/server/db/mongodb';
import { generateRequestNumber, type TransportationRequest } from '$lib/server/db/schemas';
import { listTransportRequests } from '$lib/services/transport-request-service';

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
	purposeId?: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	specialRequirements?: string;
	driverShouldWait?: boolean;
	vehicleId?: string;
	vehicleName?: string;
	transportCompanyId?: string;
	voucherProvider?: string;
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

		// Resolve driver from vehicle if a vehicle was pre-selected
		let resolvedVehicleId: string | undefined;
		let resolvedVehicleName: string | undefined;
		let resolvedDriverId: string | undefined;
		let resolvedDriverName: string | undefined;

		if (body.vehicleId && body.type === 'company_car') {
			const { ObjectId } = await import('mongodb');
			const vehicle = await db.collection(collections.vehicles).findOne(
				{ _id: new ObjectId(body.vehicleId) }
			);
			if (vehicle) {
				resolvedVehicleId = body.vehicleId;
				resolvedVehicleName = body.vehicleName || `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
				resolvedDriverId = vehicle.driverId || undefined;
				resolvedDriverName = vehicle.driverName || undefined;
			}
		}

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
			purposeId: body.purposeId,
			priority: body.priority || 'medium',
			specialRequirements: body.specialRequirements,
			driverShouldWait: body.driverShouldWait,
			transportCompanyId: body.transportCompanyId,
			voucherProvider: body.voucherProvider,

			vehicleId: resolvedVehicleId,
			vehicleName: resolvedVehicleName,
			driverId: resolvedDriverId,
			driverName: resolvedDriverName,

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
		await requireAuth(event);
		const { page, limit } = parsePagination(event.url);
		const sp = event.url.searchParams;
		const result = await listTransportRequests(getDB(), {
			page, limit,
			status:    sp.get('status')    ?? undefined,
			type:      sp.get('type')      ?? undefined,
			userId:    sp.get('userId')    ?? undefined,
			startDate: sp.get('startDate') ?? undefined,
			endDate:   sp.get('endDate')   ?? undefined,
		});
		return json(success(result.data, result.meta));
	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch requests', err.message), { status: 500 });
	}
};
