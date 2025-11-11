import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerOrUpdateDevice } from '$lib/server/deviceAuth';

// POST /api/v1/devices/:deviceId/heartbeat - Update device last seen timestamp
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { deviceId } = params;
		await registerOrUpdateDevice(deviceId);

		return json({ success: true });
	} catch (error) {
		console.error('Error updating device heartbeat:', error);
		return json({ success: false, error: 'Failed to update heartbeat' }, { status: 500 });
	}
};
