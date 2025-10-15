import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { TransportationBooking } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'userId', 'status', 'vehicleId', 'driverId'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		// Add date range filtering if provided
		const fromDate = url.searchParams.get('fromDate');
		const toDate = url.searchParams.get('toDate');

		if (fromDate || toDate) {
			filter.scheduledTime = {};
			if (fromDate) {
				filter.scheduledTime.$gte = new Date(fromDate);
			}
			if (toDate) {
				filter.scheduledTime.$lte = new Date(toDate);
			}
		}

		const result = await listDocuments<TransportationBooking>('transportation_bookings', {
			filter,
			page,
			limit,
			sort: { scheduledTime: -1 }
		});
		return json(result);
	} catch (error) {
		console.error('Error fetching transportation bookings:', error);
		return json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const booking = {
			bookingId: body.bookingId || `TRP-${Date.now()}`,
			companyId: body.companyId,
			userId: body.userId,
			vehicleId: body.vehicleId,
			driverId: body.driverId,
			bookingDate: new Date(),
			scheduledTime: new Date(body.scheduledTime),
			estimatedEndTime: body.estimatedEndTime ? new Date(body.estimatedEndTime) : undefined,
			fromLocation: body.fromLocation,
			toLocation: body.toLocation,
			numberOfPassengers: parseInt(body.numberOfPassengers),
			status: body.status || 'scheduled',
			notes: body.notes
		};

		const result = await createDocument<TransportationBooking>('transportation_bookings', booking);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating transportation booking:', error);
		return json({ success: false, error: 'Failed to create booking' }, { status: 500 });
	}
};
