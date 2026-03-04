import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDeviceAssignment, registerOrUpdateDevice } from '$lib/server/deviceAuth';
import { getDB, collections } from '$lib/server/db/mongodb';

// GET /api/v1/devices/:deviceId/assignment - Check if device is assigned
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { deviceId } = params;

		// Register or update device heartbeat
		await registerOrUpdateDevice(deviceId);

		// Get assignment
		const device = await getDeviceAssignment(deviceId);

		if (device && device.roomId) {
			return json({
				success: true,
				data: {
					assigned: true,
					roomId: device.roomId,
					deviceName: device.deviceName,
					assignedAt: device.assignedAt
				}
			});
		}

		return json({
			success: true,
			data: {
				assigned: false
			}
		});
	} catch (error) {
		console.error('Error checking device assignment:', error);
		return json({ success: false, error: 'Failed to check assignment' }, { status: 500 });
	}
};

// POST /api/v1/devices/:deviceId/assignment - Assign device to room (admin only)
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { deviceId } = params;
		const body = await request.json();
		const { roomId, assignedBy } = body;

		if (!roomId) {
			return json({ success: false, error: 'roomId is required' }, { status: 400 });
		}

		const db = getDB();
		const now = new Date();

		// Get room name for device name
		const room = await db.collection(collections.meetingRooms).findOne({ roomId });
		const deviceName = room ? `Tablet - ${room.roomName}` : `Tablet - ${roomId}`;

		// Update device assignment
		await db.collection(collections.devices).updateOne(
			{ deviceId },
			{
				$set: {
					roomId,
					deviceName,
					assignedAt: now,
					assignedBy: assignedBy || 'admin',
					status: 'active',
					lastSeen: now,
					updatedAt: now
				},
				$setOnInsert: {
					deviceId,
					createdAt: now
				}
			},
			{ upsert: true }
		);

		return json({
			success: true,
			data: {
				deviceId,
				roomId,
				deviceName,
				assignedAt: now
			}
		});
	} catch (error) {
		console.error('Error assigning device:', error);
		return json({ success: false, error: 'Failed to assign device' }, { status: 500 });
	}
};

// DELETE /api/v1/devices/:deviceId/assignment - Unassign device (admin only)
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { deviceId } = params;
		const db = getDB();

		await db.collection(collections.devices).updateOne(
			{ deviceId },
			{
				$set: {
					status: 'pending',
					updatedAt: new Date()
				},
				$unset: {
					roomId: '',
					deviceName: '',
					assignedAt: '',
					assignedBy: ''
				}
			}
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error unassigning device:', error);
		return json({ success: false, error: 'Failed to unassign device' }, { status: 500 });
	}
};
