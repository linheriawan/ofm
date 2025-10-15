import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { Location } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'isActive'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const result = await listDocuments<Location>('locations', { filter, page, limit });
		return json(result);
	} catch (error) {
		console.error('Error fetching locations:', error);
		return json({ success: false, error: 'Failed to fetch locations' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const location = {
			locationId: body.locationId || `LOC-${Date.now()}`,
			companyId: body.companyId,
			locationName: body.locationName,
			address: body.address,
			city: body.city,
			province: body.province,
			country: body.country,
			postalCode: body.postalCode,
			latitude: body.latitude,
			longitude: body.longitude,
			isActive: body.isActive !== undefined ? body.isActive : true
		};

		const result = await createDocument<Location>('locations', location);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating location:', error);
		return json({ success: false, error: 'Failed to create location' }, { status: 500 });
	}
};
