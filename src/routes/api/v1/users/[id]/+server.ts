import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDocument, updateDocument, deleteDocument } from '$lib/utils/api';
import type { User } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await getDocument<User>('users', params.id);

		// Remove password hash from response
		if (result.data) {
			const { passwordHash, ...userData } = result.data as any;
			result.data = userData;
		}

		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		// Remove sensitive fields that shouldn't be updated directly
		const { passwordHash, ...updateData } = body;

		const result = await updateDocument<User>('users', params.id, updateData);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error updating user:', error);
		return json({ success: false, error: 'Failed to update user' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const result = await deleteDocument('users', params.id);
		return json(result, { status: result.status || 200 });
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ success: false, error: 'Failed to delete user' }, { status: 500 });
	}
};
