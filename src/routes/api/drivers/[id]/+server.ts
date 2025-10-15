import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { Driver } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<Driver>('drivers', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching driver:', error);
		return json({ success: false, error: 'Failed to fetch driver' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const result = await updateDocument<Driver>('drivers', params.id, body);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating driver:', error);
		return json({ success: false, error: 'Failed to update driver' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('drivers', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting driver:', error);
		return json({ success: false, error: 'Failed to delete driver' }, { status: 500 });
	}
};
