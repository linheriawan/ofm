import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import { getCollection } from '$lib/db/mongodb';
import { ObjectId } from 'mongodb';
import type { Driver } from '$lib/types';

async function syncDriverRole(userId: string, add: boolean) {
	if (!userId) return;
	try {
		const users = await getCollection('users');
		const id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
		const query = id ? { _id: id } : { userId };
		if (add) {
			await users.updateOne(query, { $addToSet: { roleIds: 'driver' } } as any);
		} else {
			await users.updateOne(query, { $pull: { roleIds: 'driver' } } as any);
		}
	} catch (e) {
		console.error('syncDriverRole failed', e);
	}
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<Driver>('drivers', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching driver:', error);
		return json({ success: false, error: 'Failed to fetch driver' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		// Sync role: get old userId before update, compare with new
		const existing = await getDocument<Driver>('drivers', params.id);
		const oldUserId = (existing.data as any)?.userId ?? '';
		const newUserId = body.userId ?? '';

		const result = await updateDocument<Driver>('drivers', params.id, body);

		if (oldUserId !== newUserId) {
			if (oldUserId) await syncDriverRole(oldUserId, false);
			if (newUserId) await syncDriverRole(newUserId, true);
		} else if (newUserId) {
			await syncDriverRole(newUserId, true);
		}

		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating driver:', error);
		return json({ success: false, error: 'Failed to update driver' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const existing = await getDocument<Driver>('drivers', params.id);
		const userId = (existing.data as any)?.userId;

		const result = await deleteDocument('drivers', params.id);
		if (userId) await syncDriverRole(userId, false);

		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting driver:', error);
		return json({ success: false, error: 'Failed to delete driver' }, { status: 500 });
	}
};
