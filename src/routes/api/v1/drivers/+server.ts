/**
 * Drivers API
 * GET /api/v1/drivers - List all drivers
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Check authentication
		const user = locals.user;
		if (!user) {
			return json(
				{
					success: false,
					error: {
						code: 'unauthorized',
						message: 'You must be logged in'
					}
				},
				{ status: 401 }
			);
		}

		const db = getDB();

		// Get all active drivers
		const drivers = await db
			.collection(collections.drivers)
			.find({ status: { $ne: 'inactive' } })
			.sort({ name: 1 })
			.toArray();

		// Format response
		const formattedDrivers = drivers.map((driver) => ({
			...driver,
			_id: driver._id?.toString()
		}));

		return json({
			success: true,
			data: formattedDrivers,
			meta: {
				total: formattedDrivers.length,
				timestamp: new Date().toISOString()
			}
		});
	} catch (err: any) {
		console.error('Failed to fetch drivers:', err);
		return json(
			{
				success: false,
				error: {
					code: 'server_error',
					message: 'Failed to fetch drivers',
					details: err.message
				}
			},
			{ status: 500 }
		);
	}
};
