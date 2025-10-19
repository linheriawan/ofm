import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { Driver } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'status', 'locationId'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const result = await listDocuments<Driver>('drivers', { filter, page, limit });
		return json(result);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		return json({ success: false, error: 'Failed to fetch drivers' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const driver = {
			driverId: body.driverId || `DRV-${Date.now()}`,
			userId: body.userId,
			companyId: body.companyId,
			licenseNumber: body.licenseNumber,
			licenseExpiry: new Date(body.licenseExpiry),
			status: body.status || 'available',
			locationId: body.locationId,
			rating: body.rating || 0
		};

		const result = await createDocument<Driver>('drivers', driver);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating driver:', error);
		return json({ success: false, error: 'Failed to create driver' }, { status: 500 });
	}
};
