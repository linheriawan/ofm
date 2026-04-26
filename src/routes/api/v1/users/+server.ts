import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import type { User } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'isActive'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		const { getCollection } = await import('$lib/db/mongodb');
		const { ObjectId } = await import('mongodb');

		// Build a lookup map: roleId string → [string value, ObjectId] so we match both storage formats
		const rolesCol = await getCollection('roles');
		const allRoles = await rolesCol.find({}).toArray() as any[];
		const roleIdToValues = (roleIdStr: string) => {
			const r = allRoles.find(x => x.roleId === roleIdStr);
			if (!r) return [roleIdStr];
			const vals: any[] = [r.roleId];
			if (r._id) vals.push(r._id, r._id.toString());
			return vals;
		};

		// Role filter: match both string 'driver' and any ObjectId forms stored for that role
		const role = url.searchParams.get('role');
		if (role) {
			filter['roleIds'] = { $in: roleIdToValues(role) };
		}

		// Search
		const search = url.searchParams.get('search');
		if (search) {
			filter['$or'] = [
				{ userId: { $regex: search, $options: 'i' } },
				{ firstName: { $regex: search, $options: 'i' } },
				{ lastName: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ username: { $regex: search, $options: 'i' } },
				{ phone: { $regex: search, $options: 'i' } }
			];
		}

		// Counts per role for tab badges — resolve ObjectId entries back to roleId strings
		let roleCounts: Record<string, number> | undefined;
		if (!role) {
			const usersCol = await getCollection('users');
			const counts = await usersCol.aggregate([
				{ $unwind: { path: '$roleIds', preserveNullAndEmptyArrays: true } },
				{ $group: { _id: '$roleIds', count: { $sum: 1 } } }
			]).toArray() as any[];

			roleCounts = {};
			for (const c of counts) {
				if (!c._id) continue;
				const idStr = c._id.toString();
				// Try to resolve ObjectId to roleId string
				const matched = allRoles.find(r => r._id?.toString() === idStr || r.roleId === idStr);
				const key = matched ? matched.roleId : idStr;
				roleCounts[key] = (roleCounts[key] ?? 0) + c.count;
			}
		}

		const result = await listDocuments<User>('users', { filter, page, limit });

		if (result.data) {
			result.data = result.data.map((user: any) => {
				const { passwordHash, ...userData } = user;
				return userData;
			});
		}

		return json({ ...result, roleCounts });
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
