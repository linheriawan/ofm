import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

// POST /api/v1/meetings/:id/checkin - Check in to a meeting
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const meetingId = params.id;
		const { employeeId, method } = await request.json();

		const db = getDB();

		// Find the meeting
		const meeting = await db.collection(collections.meetingRequests).findOne({
			_id: new ObjectId(meetingId)
		});

		if (!meeting) {
			return json(
				{ success: false, error: 'Meeting not found' },
				{ status: 404 }
			);
		}

		// Check if meeting is happening now
		const now = new Date();
		const startTime = new Date(meeting.startTime);
		const endTime = new Date(meeting.endTime);

		// Allow check-in 15 minutes before and during the meeting
		const checkInWindow = new Date(startTime.getTime() - 15 * 60 * 1000);

		if (now < checkInWindow) {
			return json(
				{ success: false, error: 'Check-in window not yet open. You can check in 15 minutes before the meeting.' },
				{ status: 400 }
			);
		}

		if (now > endTime) {
			return json(
				{ success: false, error: 'Meeting has already ended' },
				{ status: 400 }
			);
		}

		// Verify employee (if employeeId provided)
		// TODO: Verify employee is in meeting participants list
		// For now, we'll just record the check-in

		// Update meeting with check-in info
		const result = await db.collection(collections.meetingRequests).updateOne(
			{ _id: new ObjectId(meetingId) },
			{
				$set: {
					checkedIn: true,
					checkInTime: now,
					checkInEmployeeId: employeeId || 'unknown',
					checkInMethod: method || 'manual', // 'qr', 'manual', 'nfc'
					updatedAt: now
				}
			}
		);

		if (result.matchedCount === 0) {
			return json(
				{ success: false, error: 'Failed to update meeting' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Check-in successful',
			data: {
				meetingId,
				checkInTime: now,
				meetingTitle: meeting.meetingTitle
			}
		});
	} catch (error) {
		console.error('Error checking in:', error);
		return json(
			{ success: false, error: 'Failed to check in' },
			{ status: 500 }
		);
	}
};
