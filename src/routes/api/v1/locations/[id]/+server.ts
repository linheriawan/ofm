import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { Location } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<Location>('locations', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching location:', error);
		return json({ success: false, error: 'Failed to fetch location' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const result = await updateDocument<Location>('locations', params.id, body);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating location:', error);
		return json({ success: false, error: 'Failed to update location' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('locations', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting location:', error);
		return json({ success: false, error: 'Failed to delete location' }, { status: 500 });
	}
};
