import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { MeetingBooking } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'organizerId', 'roomId', 'status', 'meetingType'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		// Add date range filtering if provided
		const fromDate = url.searchParams.get('fromDate');
		const toDate = url.searchParams.get('toDate');

		if (fromDate || toDate) {
			filter.startTime = {};
			if (fromDate) {
				filter.startTime.$gte = new Date(fromDate);
			}
			if (toDate) {
				filter.startTime.$lte = new Date(toDate);
			}
		}

		const result = await listDocuments<MeetingBooking>('meeting_bookings', {
			filter,
			page,
			limit,
			sort: { startTime: -1 }
		});
		return json(result);
	} catch (error) {
		console.error('Error fetching meeting bookings:', error);
		return json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const booking = {
			bookingId: body.bookingId || `MTG-${Date.now()}`,
			companyId: body.companyId,
			roomId: body.roomId,
			organizerId: body.organizerId,
			meetingTitle: body.meetingTitle,
			meetingType: body.meetingType,
			startTime: new Date(body.startTime),
			endTime: new Date(body.endTime),
			duration: body.duration || 60,
			participants: body.participants || [],
			status: body.status || 'scheduled',
			isRecurring: body.isRecurring || false,
			cateringNeeded: body.cateringNeeded || false,
			approvalRequired: body.approvalRequired || false,
			notes: body.notes
		};

		const result = await createDocument<MeetingBooking>('meeting_bookings', booking);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating meeting booking:', error);
		return json({ success: false, error: 'Failed to create booking' }, { status: 500 });
	}
};
