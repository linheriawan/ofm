import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { TransportationBooking } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<TransportationBooking>('transportation_bookings', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching booking:', error);
		return json({ success: false, error: 'Failed to fetch booking' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const result = await updateDocument<TransportationBooking>('transportation_bookings', params.id, body);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating booking:', error);
		return json({ success: false, error: 'Failed to update booking' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('transportation_bookings', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting booking:', error);
		return json({ success: false, error: 'Failed to delete booking' }, { status: 500 });
	}
};
