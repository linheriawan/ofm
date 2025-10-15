import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollection } from '$lib/db/mongodb';
import type { Vehicle } from '$lib/types';
import { ObjectId } from 'mongodb';

// GET - Get single vehicle by ID
export const GET: RequestHandler = async ({ params }) => {
	try {
		const collection = await getCollection<Vehicle>('vehicles');
		const vehicle = await collection.findOne({ _id: new ObjectId(params.id) });

		if (!vehicle) {
			return json({
				success: false,
				error: 'Vehicle not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			data: vehicle
		});
	} catch (error) {
		console.error('Error fetching vehicle:', error);
		return json({
			success: false,
			error: 'Failed to fetch vehicle'
		}, { status: 500 });
	}
};

// PUT - Update vehicle
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const collection = await getCollection<Vehicle>('vehicles');
		const body = await request.json();

		const updateData: Partial<Vehicle> = {
			...body,
			updatedAt: new Date()
		};

		// Remove _id from update if present
		delete (updateData as any)._id;

		const result = await collection.updateOne(
			{ _id: new ObjectId(params.id) },
			{ $set: updateData }
		);

		if (result.matchedCount === 0) {
			return json({
				success: false,
				error: 'Vehicle not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			message: 'Vehicle updated successfully'
		});
	} catch (error) {
		console.error('Error updating vehicle:', error);
		return json({
			success: false,
			error: 'Failed to update vehicle'
		}, { status: 500 });
	}
};

// DELETE - Delete vehicle
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const collection = await getCollection<Vehicle>('vehicles');
		const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

		if (result.deletedCount === 0) {
			return json({
				success: false,
				error: 'Vehicle not found'
			}, { status: 404 });
		}

		return json({
			success: true,
			message: 'Vehicle deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting vehicle:', error);
		return json({
			success: false,
			error: 'Failed to delete vehicle'
		}, { status: 500 });
	}
};
