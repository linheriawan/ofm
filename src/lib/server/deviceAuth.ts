import { getDB, collections } from '$lib/server/db/mongodb';
import type { Device } from '$lib/types';

/**
 * Verify if a device is authorized to access a specific room's display
 * @param deviceId - The device ID to check
 * @param roomId - The room ID to check access for
 * @returns true if device is authorized, false otherwise
 */
export async function verifyDeviceAccess(
	deviceId: string,
	roomId: string
): Promise<boolean> {
	try {
		const db = getDB();
		const device = await db.collection<Device>(collections.devices).findOne({
			deviceId,
			roomId,
			status: 'active'
		});

		// Update last seen timestamp if device exists
		if (device) {
			await db.collection(collections.devices).updateOne(
				{ deviceId },
				{
					$set: {
						lastSeen: new Date(),
						updatedAt: new Date()
					}
				}
			);
		}

		return !!device;
	} catch (error) {
		console.error('Error verifying device access:', error);
		return false;
	}
}

/**
 * Check if a device is assigned to any room
 * @param deviceId - The device ID to check
 * @returns Device object if assigned, null otherwise
 */
export async function getDeviceAssignment(deviceId: string): Promise<Device | null> {
	try {
		const db = getDB();
		const device = await db.collection<Device>(collections.devices).findOne({
			deviceId,
			status: { $in: ['active', 'pending'] }
		});

		return device;
	} catch (error) {
		console.error('Error getting device assignment:', error);
		return null;
	}
}

/**
 * Register a new device or update heartbeat
 * @param deviceId - The device ID
 * @returns Device object
 */
export async function registerOrUpdateDevice(deviceId: string): Promise<Device> {
	try {
		const db = getDB();
		const now = new Date();

		const result = await db.collection<Device>(collections.devices).findOneAndUpdate(
			{ deviceId },
			{
				$set: {
					lastSeen: now,
					updatedAt: now
				},
				$setOnInsert: {
					deviceId,
					status: 'pending',
					createdAt: now
				}
			},
			{
				upsert: true,
				returnDocument: 'after'
			}
		);

		return result!;
	} catch (error) {
		console.error('Error registering device:', error);
		throw error;
	}
}
