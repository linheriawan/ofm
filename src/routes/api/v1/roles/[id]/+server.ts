import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

const SYSTEM_TIER_PERMISSIONS = new Set(['admin', 'employee', 'driver']);

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

export const PUT: RequestHandler = async ({ params, request, locals }) => {
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

		const safePermissions = sanitizePermissions(data.permissions, callerPerms);

		const updateData: any = {
			roleName: data.roleName,
			description: data.description || '',
			permissions: safePermissions,
			companyIds: Array.isArray(data.companyIds) ? data.companyIds : [],
			isActive: data.isActive,
			updatedAt: new Date()
		};

		// If roleId is being changed, check for duplicates
		if (data.roleId) {
			const existing = await db.collection('roles').findOne({
				roleId: data.roleId,
				_id: { $ne: new ObjectId(params.id) }
			});
			if (existing) {
				return json(
					{ success: false, error: { code: 'DUPLICATE_ROLE', message: 'Role ID already exists' } },
					{ status: 400 }
				);
			}
			updateData.roleId = data.roleId;
		}

		const result = await db.collection('roles').updateOne(
			{ _id: new ObjectId(params.id) },
			{ $set: updateData }
		);

		if (result.matchedCount === 0) {
			return json(
				{ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
				{ status: 404 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating role:', error);
		return json(
			{ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update role' } },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
		}

		const callerPerms = locals.user.permissions ?? [];
		const callerIsAdmin = callerPerms.includes('*') || callerPerms.includes('admin');
		if (!callerIsAdmin) {
			return json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
		}

		const db = getDB();

		// Check if role is assigned to any users
		const usersWithRole = await db.collection('users').findOne({ roles: params.id });
		if (usersWithRole) {
			return json(
				{ success: false, error: { code: 'ROLE_IN_USE', message: 'Cannot delete role that is assigned to users' } },
				{ status: 400 }
			);
		}

		const result = await db.collection('roles').deleteOne({ _id: new ObjectId(params.id) });

		if (result.deletedCount === 0) {
			return json(
				{ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
				{ status: 404 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting role:', error);
		return json(
			{ success: false, error: { code: 'DELETE_ERROR', message: 'Failed to delete role' } },
			{ status: 500 }
		);
	}
};
