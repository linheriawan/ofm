import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { MeetingRoom } from '$lib/types';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const roomId = params.id;
		const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

		const db = getDB();

		// Get room details
		const room = await db.collection(collections.meetingRooms).findOne({ _id: new ObjectId(roomId) });

		if (!room) {
			return json({
				success: false,
				error: 'Room not found'
			}, { status: 404 });
		}

		// Get bookings for this room today from meeting_requests collection

		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const bookings = await db.collection(collections.meetingRequests)
			.find({
				roomId: room.roomId,
				startTime: {
					$gte: startOfDay,
					$lte: endOfDay
				},
				status: { $in: ['approved', 'assigned', 'in_progress'] }
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
