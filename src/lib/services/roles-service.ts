import type { Db } from 'mongodb';
import { collections } from '$lib/server/db/mongodb';
import type { RolePermission } from '$lib/types';

const SYSTEM_ROLES: Array<{ roleId: string; roleName: string; description: string; permission: RolePermission }> = [
	{
		roleId: 'employee',
		roleName: 'Employee',
		description: 'Default role for all employees. Can create and view own requests.',
		permission: 'employee'
	},
	{
		roleId: 'driver',
		roleName: 'Driver',
		description: 'Company driver. Can accept and complete transport trips.',
		permission: 'driver'
	},
	{
		roleId: 'admin',
		roleName: 'Administrator',
		description: 'Can approve requests, manage master data, and access configuration.',
		permission: 'admin'
	}
];

export async function initializeSystemRoles(db: Db): Promise<void> {
	const now = new Date();
	for (const role of SYSTEM_ROLES) {
		await db.collection(collections.roles).updateOne(
			{ roleId: role.roleId },
			{
				$setOnInsert: { createdAt: now, createdBy: 'system' },
				$set: { ...role, updatedAt: now, isActive: true, companyIds: [] }
			},
			{ upsert: true }
		);
	}
}

export async function resolvePermissions(db: Db, roleIds: string[]): Promise<RolePermission[]> {
	if (!roleIds?.length) return ['employee'];

	const roles = await db
		.collection(collections.roles)
		.find({ roleId: { $in: roleIds } })
		.project({ permission: 1 })
		.toArray();

	const resolved = roles
		.map((r: any) => r.permission as RolePermission)
		.filter(Boolean);

	return resolved.length ? [...new Set(resolved)] : ['employee'];
}
