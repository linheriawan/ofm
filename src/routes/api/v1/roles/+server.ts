import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import type { Role } from '$lib/types';

// Permissions that are system-only and must never be set via the UI/API on permissions[].
// 'admin', 'employee', 'driver' are tier values stored in the singular `permission` field by system code.
// '*' is the super-admin wildcard and may only be granted by an existing super-admin.
const SYSTEM_TIER_PERMISSIONS = new Set(['admin', 'employee', 'driver']);

/**
 * Filter submitted permissions[] to only those the caller is allowed to grant.
 * - '*' requires the caller to already have '*'.
 * - System tier values ('admin', 'employee', 'driver') are never allowed in permissions[].
 * - All other granular strings ('meeting.approve', etc.) pass through.
 */
function sanitizePermissions(submitted: unknown, callerPerms: string[]): string[] {
	if (!Array.isArray(submitted)) return [];
	const callerIsSuperAdmin = callerPerms.includes('*');
	return (submitted as unknown[])
		.filter((p): p is string => typeof p === 'string')
		.filter(p => {
			if (p === '*') return callerIsSuperAdmin;
			if (SYSTEM_TIER_PERMISSIONS.has(p)) return false;
			return true;
		});
}

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
		}

		const db = getDB();
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const search = url.searchParams.get('search') || '';
		const skip = (page - 1) * limit;

		const userPerms = locals.user.permissions ?? [];
		const isSuperAdmin =
			userPerms.includes('*') || userPerms.includes('admin') ||
			locals.user.roles.includes('super_admin') ||
			locals.user.roles.includes('global_admin');

		const query: any = {};
		if (search) {
			query.$or = [
				{ roleId: { $regex: search, $options: 'i' } },
				{ roleName: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}

		// Company filter: only apply when NOT super/global admin.
		// Matches roles that are global (empty/missing companyIds) OR contain the company.
		const companyId = url.searchParams.get('companyId');
		if (companyId && !isSuperAdmin) {
			query.$or = [
				...(query.$or || []),
				{ companyIds: { $size: 0 } },
				{ companyIds: { $exists: false } },
				{ companyIds: companyId }
			];
		}

		const [roles, total] = await Promise.all([
			db.collection<Role>('roles')
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection('roles').countDocuments(query)
		]);

		return json({
			success: true,
			data: roles,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching roles:', error);
		return json(
			{ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch roles' } },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
		}

		const callerPerms = locals.user.permissions ?? [];
		const callerIsAdmin = callerPerms.includes('*') || callerPerms.includes('admin');
		if (!callerIsAdmin) {
			return json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
		}

		const data = await request.json();
		const db = getDB();

		// Check if roleId already exists
		const existing = await db.collection('roles').findOne({ roleId: data.roleId });
		if (existing) {
			return json(
				{ success: false, error: { code: 'DUPLICATE_ROLE', message: 'Role ID already exists' } },
				{ status: 400 }
			);
		}

		const safePermissions = sanitizePermissions(data.permissions, callerPerms);

		const newRole: Omit<Role, '_id'> = {
			roleId: data.roleId,
			roleName: data.roleName,
			description: data.description || '',
			permission: data.permission || 'employee',
			permissions: safePermissions,
			companyIds: Array.isArray(data.companyIds) ? data.companyIds : [],
			isActive: data.isActive !== undefined ? data.isActive : true,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const result = await db.collection('roles').insertOne(newRole);

		return json({ success: true, data: { _id: result.insertedId, ...newRole } });
	} catch (error) {
		console.error('Error creating role:', error);
		return json(
			{ success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create role' } },
			{ status: 500 }
		);
	}
};
