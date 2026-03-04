import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { Vehicle } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<Vehicle>('vehicles', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching vehicle:', error);
		return json({ success: false, error: 'Failed to fetch vehicle' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const result = await updateDocument<Vehicle>('vehicles', params.id, body);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating vehicle:', error);
		return json({ success: false, error: 'Failed to update vehicle' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('vehicles', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting vehicle:', error);
		return json({ success: false, error: 'Failed to delete vehicle' }, { status: 500 });
	}
};
