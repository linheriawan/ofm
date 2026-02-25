import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { updateSelectedCompany } from '$lib/server/auth/session';
import { resolveAccessibleCompanyIds } from '$lib/server/db/company-utils';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

	const user = locals.user;
	if (!user) {
		return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
	}

	try {
		const body = await request.json();
		const { companyId } = body;

		if (!companyId) {
			return json(apiError(ErrorCode.VALIDATION_ERROR, 'companyId is required'), { status: 400 });
		}

		const db = getDB();

		// Resolve the full set of companies this user can access (including descendants)
		const accessibleIds = await resolveAccessibleCompanyIds(db, user);

		let hasAccess = false;
		if (accessibleIds === null) {
			// super_admin / global_admin — any active company is valid
			const company = await db
				.collection(collections.companies)
				.findOne({ companyId, isActive: true });
			hasAccess = !!company;
		} else {
			hasAccess = accessibleIds.includes(companyId);
		}

		if (!hasAccess) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Access to this company is not allowed'), {
				status: 403
			});
		}

		await updateSelectedCompany(event, companyId);

		return json(success({ selectedCompanyId: companyId }));
	} catch (err: any) {
		console.error('Error switching company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to switch company'), { status: 500 });
	}
};
