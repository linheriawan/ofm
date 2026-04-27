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

// Fields managed by OFM — all others are owned by SSO/SCIM and must not be overwritten here
const OFM_FIELDS = new Set(['roleIds', 'locationId', 'companyAccess']);

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const body = await request.json();

		const updateData = Object.fromEntries(
			Object.entries(body).filter(([k]) => OFM_FIELDS.has(k))
		);

		if (Object.keys(updateData).length === 0) {
			return json({ success: false, error: 'No OFM-managed fields to update' }, { status: 400 });
		}

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
