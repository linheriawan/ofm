import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { getVoucherStats } from '$lib/server/vouchers/import';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const stats = await getVoucherStats(user.companyId || 'IAS');

		return json(success(stats));
	} catch (err: any) {
		console.error('Error fetching voucher stats:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch voucher statistics'), {
			status: 500
		});
	}
};
