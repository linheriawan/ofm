import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollection } from '$lib/db/mongodb';
import type { MeetingBooking, MeetingRoom } from '$lib/types';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const roomId = params.id;
		const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

		// Get room details
		const roomsCollection = await getCollection<MeetingRoom>('meeting_rooms');
		const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) });

		if (!room) {
			return json({
				success: false,
				error: 'Room not found'
			}, { status: 404 });
		}

		// Get bookings for this room today
		const bookingsCollection = await getCollection<MeetingBooking>('meeting_bookings');

		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const bookings = await bookingsCollection
			.find({
				roomId: room.roomId,
				startTime: {
					$gte: startOfDay,
					$lte: endOfDay
				},
				status: { $in: ['scheduled', 'ongoing', 'in-progress'] }
			})
			.sort({ startTime: 1 })
			.toArray();

		// Determine current meeting
		const now = new Date();
		const currentMeeting = bookings.find(booking => {
			const start = new Date(booking.startTime);
			const end = new Date(booking.endTime);
			return start <= now && end >= now;
		});

		// Find next meeting
		const upcomingBookings = bookings.filter(booking => {
			const start = new Date(booking.startTime);
			return start > now;
		});

		const nextMeeting = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

		// Calculate room availability
		let availableUntil = null;
		if (!currentMeeting && nextMeeting) {
			availableUntil = new Date(nextMeeting.startTime);
		}

		return json({
			success: true,
			data: {
				room: {
					roomId: room.roomId,
					roomName: room.roomName,
					roomNumber: room.roomNumber,
					floor: room.floor,
					capacity: room.capacity,
					facilities: room.facilities,
					status: room.status
				},
				current: currentMeeting || null,
				next: nextMeeting || null,
				todaySchedule: bookings,
				isAvailable: !currentMeeting,
				availableUntil: availableUntil,
				date: date
			}
		});
	} catch (error) {
		console.error('Error fetching room schedule:', error);
		return json({
			success: false,
			error: 'Failed to fetch room schedule'
		}, { status: 500 });
	}
};
