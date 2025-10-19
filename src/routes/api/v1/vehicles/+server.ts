import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { Vehicle } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'status', 'locationId', 'vehicleType'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const result = await listDocuments<Vehicle>('vehicles', { filter, page, limit });
		return json(result);
	} catch (error) {
		console.error('Error fetching vehicles:', error);
		return json({ success: false, error: 'Failed to fetch vehicles' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const vehicle = {
			vehicleId: body.vehicleId || `VEH-${Date.now()}`,
			companyId: body.companyId,
			licensePlate: body.licensePlate,
			vehicleType: body.vehicleType,
			brand: body.brand,
			model: body.model,
			year: parseInt(body.year),
			capacity: parseInt(body.capacity),
			fuelType: body.fuelType,
			isElectric: body.isElectric || body.fuelType === 'electric',
			status: body.status || 'available',
			locationId: body.locationId,
			hasGPS: body.hasGPS || false,
			hasOBD: body.hasOBD || false,
			arduinoDeviceId: body.arduinoDeviceId
		};

		const result = await createDocument<Vehicle>('vehicles', vehicle);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating vehicle:', error);
		return json({ success: false, error: 'Failed to create vehicle' }, { status: 500 });
	}
};
