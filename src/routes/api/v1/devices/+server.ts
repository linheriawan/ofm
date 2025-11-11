import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments } from '$lib/utils/api';
import type { Device } from '$lib/types';

// GET /api/v1/devices - List all devices (admin only)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const result = await listDocuments<Device>('devices', {
			page: 1,
			limit: 100,
			sort: { lastSeen: -1 } // Most recent first
		});
		return json(result);
	} catch (error) {
		console.error('Error fetching devices:', error);
		return json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
	}
};
