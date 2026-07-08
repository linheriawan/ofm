import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

export const POST: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
	}

	try {
		const db = getDB();
		const touAcceptedAt = new Date();

		// Stamp acceptance time; a re-accept after the terms change updates the timestamp
		await db.collection(collections.users).updateOne(
			{ userId: user.userId },
			{ $set: { touAcceptedAt, updatedAt: touAcceptedAt } }
		);

		return json(success({ touAcceptedAt }));
	} catch (err) {
		console.error('Error saving TOU consent:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to save consent'), { status: 500 });
	}
};
