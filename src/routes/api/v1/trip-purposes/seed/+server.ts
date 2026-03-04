import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { seedTripPurposes } from '$lib/server/db/seed-trip-purposes';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const result = await seedTripPurposes(user.companyId || 'IAS');

		return json(success(result), { status: 201 });
	} catch (err: any) {
		console.error('Error seeding trip purposes:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to seed trip purposes'), {
			status: 500
		});
	}
};
