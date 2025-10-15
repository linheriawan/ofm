import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollection } from '$lib/db/mongodb';
import type { Vehicle } from '$lib/types';
import { ObjectId } from 'mongodb';

// GET - List all vehicles with optional filters
export const GET: RequestHandler = async ({ url }) => {
	try {
		const collection = await getCollection<Vehicle>('vehicles');

		// Get query parameters
		const companyId = url.searchParams.get('companyId');
		const status = url.searchParams.get('status');
		const locationId = url.searchParams.get('locationId');
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		// Build filter
		const filter: any = {};
		if (companyId) filter.companyId = companyId;
		if (status) filter.status = status;
		if (locationId) filter.locationId = locationId;

		// Get total count
		const total = await collection.countDocuments(filter);

		// Get paginated data
		const vehicles = await collection
			.find(filter)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.toArray();

		return json({
			success: true,
			data: vehicles,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		});
	} catch (error) {
		console.error('Error fetching vehicles:', error);
		return json({
			success: false,
			error: 'Failed to fetch vehicles'
		}, { status: 500 });
	}
};

// POST - Create new vehicle
export const POST: RequestHandler = async ({ request }) => {
	try {
		const collection = await getCollection<Vehicle>('vehicles');
		const body = await request.json();

		const vehicle: Vehicle = {
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
			arduinoDeviceId: body.arduinoDeviceId,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const result = await collection.insertOne(vehicle as any);

		return json({
			success: true,
			data: { _id: result.insertedId, ...vehicle },
			message: 'Vehicle created successfully'
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating vehicle:', error);
		return json({
			success: false,
			error: 'Failed to create vehicle'
		}, { status: 500 });
	}
};

// PUT - Update vehicle (handled in [id]/+server.ts)
// DELETE - Delete vehicle (handled in [id]/+server.ts)
