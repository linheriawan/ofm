import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { User } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'isActive'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const result = await listDocuments<User>('users', { filter, page, limit });

		// Remove password hash from response
		if (result.data) {
			result.data = result.data.map((user: any) => {
				const { passwordHash, ...userData } = user;
				return userData;
			});
		}

		return json(result);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const user = {
			userId: body.userId || `USR-${Date.now()}`,
			email: body.email,
			username: body.username,
			passwordHash: body.passwordHash || 'temp_password', // In production, use proper hashing
			firstName: body.firstName,
			lastName: body.lastName,
			phone: body.phone,
			companyId: body.companyId,
			departmentId: body.departmentId,
			positionId: body.positionId,
			roleIds: body.roleIds || [],
			companyAccess: body.companyAccess || [],
			isActive: body.isActive !== undefined ? body.isActive : true
		};

		const result = await createDocument<User>('users', user);

		// Remove password hash from response
		if (result.data) {
			const { passwordHash, ...userData } = result.data as any;
			result.data = userData;
		}

		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating user:', error);
		return json({ success: false, error: 'Failed to create user' }, { status: 500 });
	}
};
