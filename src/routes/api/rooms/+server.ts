import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { MeetingRoom } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'status', 'locationId', 'roomType'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const result = await listDocuments<MeetingRoom>('meeting_rooms', { filter, page, limit });
		return json(result);
	} catch (error) {
		console.error('Error fetching rooms:', error);
		return json({ success: false, error: 'Failed to fetch rooms' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const room = {
			roomId: body.roomId || `ROOM-${Date.now()}`,
			companyId: body.companyId,
			locationId: body.locationId,
			roomName: body.roomName,
			roomNumber: body.roomNumber,
			floor: body.floor,
			capacity: parseInt(body.capacity),
			roomType: body.roomType,
			facilities: body.facilities || [],
			hasVideoConference: body.hasVideoConference || false,
			tabletDeviceId: body.tabletDeviceId,
			status: body.status || 'available'
		};

		const result = await createDocument<MeetingRoom>('meeting_rooms', room);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating room:', error);
		return json({ success: false, error: 'Failed to create room' }, { status: 500 });
	}
};
