/**
 * Vehicles API
 * GET /api/v1/vehicles - List all vehicles
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

		// Get all active vehicles
		const vehicles = await db
			.collection(collections.vehicles)
			.find({ status: { $ne: 'inactive' } })
			.sort({ brand: 1, model: 1 })
			.toArray();

		// Format response
		const formattedVehicles = vehicles.map((vehicle) => ({
			...vehicle,
			_id: vehicle._id?.toString()
		}));

		return json({
			success: true,
			data: formattedVehicles,
			meta: {
				total: formattedVehicles.length,
				timestamp: new Date().toISOString()
			}
		});
	} catch (err: any) {
		console.error('Failed to fetch vehicles:', err);
		return json(
			{
				success: false,
				error: {
					code: 'server_error',
					message: 'Failed to fetch vehicles',
					details: err.message
				}
			},
			{ status: 500 }
		);
	}
};
