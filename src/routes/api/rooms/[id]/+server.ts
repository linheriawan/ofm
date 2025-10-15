import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { MeetingRoom } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<MeetingRoom>('meeting_rooms', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching room:', error);
		return json({ success: false, error: 'Failed to fetch room' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();
		const result = await updateDocument<MeetingRoom>('meeting_rooms', params.id, body);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating room:', error);
		return json({ success: false, error: 'Failed to update room' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('meeting_rooms', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting room:', error);
		return json({ success: false, error: 'Failed to delete room' }, { status: 500 });
	}
};
