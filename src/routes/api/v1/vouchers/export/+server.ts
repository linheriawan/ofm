import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { exportUsedVouchers } from '$lib/server/vouchers/import';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const billingMonth = url.searchParams.get('billingMonth') || undefined;
		const provider = url.searchParams.get('provider') || undefined;

		const result = await exportUsedVouchers(user.companyId || 'IAS', billingMonth, provider);

		return json(success(result));
	} catch (err: any) {
		console.error('Error exporting vouchers:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to export vouchers'), { status: 500 });
	}
};
