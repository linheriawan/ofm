import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/v1/meetings/{id}/checkin
 * Record meeting attendance by adding to attendees array
 */
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const meetingId = params.id;
		const body = await request.json();
		const { employeeId, name, email, method, isExternal } = body;

		// Validate method
		if (!method || !['qr', 'manual'].includes(method)) {
			return json(
				{
					success: false,
					error: 'Invalid method. Must be "qr" or "manual"'
				},
				{ status: 400 }
			);
		}

		const db = getDB();

		// Find the meeting
		const meeting = await db.collection(collections.meetingRequests).findOne({
			_id: new ObjectId(meetingId)
		});

		if (!meeting) {
			return json({ success: false, error: 'Meeting not found' }, { status: 404 });
		}

		// Check if meeting is happening now
		const now = new Date();
		const startTime = new Date(meeting.startTime);
		const endTime = new Date(meeting.endTime);

		// Allow check-in 15 minutes before and during the meeting
		const checkInWindow = new Date(startTime.getTime() - 15 * 60 * 1000);

		if (now < checkInWindow) {
			return json(
				{
					success: false,
					error: 'Check-in window not yet open. You can check in 15 minutes before the meeting.'
				},
				{ status: 400 }
			);
		}

		if (now > endTime) {
			return json(
				{ success: false, error: 'Meeting has already ended' },
				{ status: 400 }
			);
		}

		let attendee: any;
		let attendeeName = '';
		let attendeeEmail = '';

		if (isExternal) {
			// External participant (no user account)
			if (!name?.trim()) {
				return json(
					{ success: false, error: 'Name is required for external participants' },
					{ status: 400 }
				);
			}

			attendeeName = name.trim();
			attendeeEmail = email?.trim() || '';

			// Check if already checked in by name
			const alreadyCheckedIn = meeting.attendees?.some(
				(att: any) => att.type === 'external' && att.name.toLowerCase() === attendeeName.toLowerCase()
			);

			if (alreadyCheckedIn) {
				return json({ success: false, error: 'Already checked in' }, { status: 409 });
			}

			attendee = {
				type: 'external',
				userId: null,
				name: attendeeName,
				email: attendeeEmail,
				checkinTime: now,
				method: method
			};
		} else {
			// Internal participant (has user account)
			if (!employeeId?.trim()) {
				return json(
					{ success: false, error: 'NIK is required for internal participants' },
					{ status: 400 }
				);
			}

			// Validate employee exists (userId is the NIK/employee number)
			const employee = await db.collection(collections.users).findOne({
				userId: employeeId.trim()
			});

			if (!employee) {
				return json({ success: false, error: 'Employee not found' }, { status: 400 });
			}

			attendeeName = employee.name || 'Unknown';
			attendeeEmail = employee.email || '';

			// Check if already checked in
			const alreadyCheckedIn = meeting.attendees?.some(
				(att: any) => att.userId === employeeId.trim()
			);

			if (alreadyCheckedIn) {
				return json({ success: false, error: 'Already checked in' }, { status: 409 });
			}

			attendee = {
				type: 'internal',
				userId: employeeId.trim(),
				name: attendeeName,
				email: attendeeEmail,
				checkinTime: now,
				method: method
			};
		}

		const result = await db.collection(collections.meetingRequests).updateOne(
			{ _id: new ObjectId(meetingId) },
			{
				$push: { attendees: attendee },
				$set: { updatedAt: now }
			}
		);

		if (result.matchedCount === 0) {
			return json({ success: false, error: 'Failed to update meeting' }, { status: 500 });
		}

		return json({
			success: true,
			message: 'Check-in successful',
			data: {
				meetingId,
				meetingTitle: meeting.title || meeting.meetingTitle || 'Untitled Meeting',
				type: attendee.type,
				userId: attendee.userId,
				name: attendeeName,
				email: attendeeEmail,
				checkinTime: now.toISOString(),
				method: method
			}
		});
	} catch (error) {
		console.error('Error checking in:', error);
		return json({ success: false, error: 'Failed to check in' }, { status: 500 });
	}
};

/**
 * GET /api/v1/meetings/{id}/checkin
 * Get attendance list for a meeting with statistics
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const meetingId = params.id;
		const db = getDB();

		// Find the meeting with attendees
		const meeting = await db.collection(collections.meetingRequests).findOne({
			_id: new ObjectId(meetingId)
		});

		if (!meeting) {
			return json({ success: false, error: 'Meeting not found' }, { status: 404 });
		}

		// Get attendees array (default to empty if not exists)
		const attendees = meeting.attendees || [];

		// Enrich attendees with employee data
		const enrichedAttendees = await Promise.all(
			attendees.map(async (attendee: any) => {
				if (attendee.type === 'external') {
					// External participant - use stored name/email
					return {
						type: 'external',
						userId: null,
						name: attendee.name || 'Unknown',
						email: attendee.email || '',
						checkinTime: attendee.checkinTime,
						method: attendee.method
					};
				} else {
					// Internal participant - lookup from users collection
					const employee = await db.collection(collections.users).findOne({
						userId: attendee.userId
					});

					return {
						type: 'internal',
						userId: attendee.userId,
						name: employee?.name || attendee.name || 'Unknown',
						email: employee?.email || attendee.email || '',
						checkinTime: attendee.checkinTime,
						method: attendee.method
					};
				}
			})
		);

		// Calculate statistics
		const totalInvited = (meeting.participants?.length || 0) + 1; // +1 for organizer
		const totalCheckedIn = enrichedAttendees.length;
		const attendanceRate = totalInvited > 0 ? (totalCheckedIn / totalInvited) * 100 : 0;

		return json({
			success: true,
			data: {
				meetingId: meetingId,
				meetingTitle: meeting.title || meeting.meetingTitle || 'Untitled Meeting',
				startTime: meeting.startTime,
				endTime: meeting.endTime,
				totalInvited: totalInvited,
				totalCheckedIn: totalCheckedIn,
				attendanceRate: Math.round(attendanceRate * 100) / 100,
				attendees: enrichedAttendees
			}
		});
	} catch (error) {
		console.error('Error fetching attendance:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch attendance records'
			},
			{ status: 500 }
		);
	}
};
