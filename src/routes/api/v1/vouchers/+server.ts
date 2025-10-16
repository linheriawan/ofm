import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

// GET - List vouchers with filters
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {
			companyId: user.companyId || 'IAS'
		};

		const status = url.searchParams.get('status');
		if (status) query.status = status;

		const provider = url.searchParams.get('provider');
		if (provider) query.provider = provider.toLowerCase();

		const billingMonth = url.searchParams.get('billingMonth');
		if (billingMonth) query.billingMonth = billingMonth;

		const [vouchers, total] = await Promise.all([
			db
				.collection(collections.vouchers)
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection(collections.vouchers).countDocuments(query)
		]);

		const data = vouchers.map((v) => ({
			...v,
			_id: v._id?.toString()
		}));

		return json(
			success(data, {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			})
		);
	} catch (err: any) {
		console.error('Error fetching vouchers:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch vouchers'), { status: 500 });
	}
};
