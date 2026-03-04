import type { Db } from 'mongodb';
import { collections } from './mongodb';

export interface CompanyNode {
	companyId: string;
	companyName: string;
	parentCompanyId?: string;
	level: number;
	children: CompanyNode[];
}

/**
 * Given a list of company IDs, recursively find all descendant companies and
 * return the full flat set (input IDs + all their descendants).
 */
export async function getDescendantCompanyIds(db: Db, rootIds: string[]): Promise<string[]> {
	if (rootIds.length === 0) return [];

	const allIds = new Set<string>(rootIds);
	let queue = [...rootIds];

	while (queue.length > 0) {
		const children = await db
			.collection(collections.companies)
			.find({ parentCompanyId: { $in: queue }, isActive: true }, { projection: { companyId: 1 } })
			.toArray();

		const newIds = children
			.map((c) => c.companyId as string)
			.filter((id) => !allIds.has(id));

		newIds.forEach((id) => allIds.add(id));
		queue = newIds;
	}

	return [...allIds];
}

/**
 * Build a sorted, depth-first flat list from a set of companies,
 * preserving parent-child nesting order and adding a `level` field.
 * Companies whose parent is not in the list are treated as roots.
 */
export function buildCompanyTree(companies: any[]): CompanyNode[] {
	const map = new Map<string, CompanyNode>();

	for (const c of companies) {
		map.set(c.companyId, {
			companyId: c.companyId,
			companyName: c.companyName,
			parentCompanyId: c.parentCompanyId,
			level: 0,
			children: []
		});
	}

	const roots: CompanyNode[] = [];

	for (const node of map.values()) {
		if (node.parentCompanyId && map.has(node.parentCompanyId)) {
			map.get(node.parentCompanyId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	// Assign depth levels and flatten to ordered list (depth-first)
	const flat: CompanyNode[] = [];

	function traverse(nodes: CompanyNode[], level: number) {
		for (const node of nodes) {
			node.level = level;
			flat.push(node);
			traverse(node.children, level + 1);
		}
	}

	traverse(roots, 0);
	return flat;
}

/**
 * Resolve the full list of company IDs a user can access, expanding
 * their `companyAccess` entries to include all descendant companies.
 *
 * Returns null for super_admin / global_admin (means "all companies").
 */
export async function resolveAccessibleCompanyIds(
	db: Db,
	user: { roles: string[]; companyAccess?: string[]; companyId?: string }
): Promise<string[] | null> {
	const isGlobal =
		user.roles.includes('super_admin') || user.roles.includes('global_admin');

	if (isGlobal) return null; // null = unrestricted

	// Exact list only — no automatic descendant expansion.
	// Users must switch company context to manage a specific company's assets.
	if (user.companyAccess?.length) {
		return user.companyAccess;
	}

	if (user.companyId) {
		return [user.companyId];
	}

	return [];
}
