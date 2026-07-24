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

/**
 * Validate App Role names asserted by the SSO (via the OIDC `roles` claim)
 * against OFM's own roles collection, matched by `roleId`. Unknown names are
 * dropped — the SSO can only grant roles that already exist here, it can't
 * inject arbitrary permission strings.
 */
export async function resolveSsoRoles(db: Db, ssoRoleNames: string[] | undefined): Promise<string[]> {
	if (!ssoRoleNames?.length) return [];

	const roles = await db
		.collection(collections.roles)
		.find({ roleId: { $in: ssoRoleNames }, isActive: true })
		.project({ roleId: 1 })
		.toArray();

	return roles.map((r) => r.roleId);
}

export async function resolvePermissions(db: Db, roleIds: string[]): Promise<string[]> {
	if (!roleIds?.length) return ['employee'];

	const roles = await db
		.collection(collections.roles)
		.find({ roleId: { $in: roleIds } })
		.project({ permission: 1, permissions: 1 })
		.toArray();

	// System-tier values that may only come from the singular `permission` field (set by system code).
	// If these appear in the plural `permissions[]` array, they were injected and must be ignored.
	const SYSTEM_TIER = new Set(['admin', 'employee', 'driver']);

	const result = new Set<string>();
	for (const r of roles) {
		// singular `permission` field — set only by initializeSystemRoles / sync code
		if (r.permission) result.add(r.permission);
		// plural `permissions[]` — set via UI; strip system-tier values to prevent injection
		if (Array.isArray(r.permissions)) {
			(r.permissions as string[])
				.filter(p => typeof p === 'string' && !SYSTEM_TIER.has(p))
				.forEach(p => result.add(p));
		}
	}

	return result.size ? [...result] : ['employee'];
}
