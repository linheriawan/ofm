import type { LayoutServerLoad } from './$types';
import { connectDB, collections } from '$lib/server/db/mongodb';
import { buildCompanyTree } from '$lib/server/db/company-utils';
import type { CompanyNode } from '$lib/server/db/company-utils';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const user = locals.user;

	if (!user) {
		return { ...parentData, accessibleCompanies: [], companyTree: [], selectedCompanyId: null };
	}

	try {
		const db = await connectDB();
		const isGlobalAdmin =
			user.roles.includes('super_admin') || user.roles.includes('global_admin');

		let companies: any[] = [];

		if (isGlobalAdmin) {
			// Super/global admins see every active company
			companies = await db
				.collection(collections.companies)
				.find({ isActive: true })
				.sort({ companyName: 1 })
				.toArray();
		} else if (user.companyAccess?.length) {
			// Regional admin: exactly the companies they were granted access to
			companies = await db
				.collection(collections.companies)
				.find({ companyId: { $in: user.companyAccess }, isActive: true })
				.sort({ companyName: 1 })
				.toArray();
		} else if (user.companyId) {
			// Single-company user: only their own company
			companies = await db
				.collection(collections.companies)
				.find({ companyId: user.companyId, isActive: true })
				.toArray();
		}

		const selectedCompanyId =
			user.selectedCompanyId || user.companyId || companies[0]?.companyId || null;

		// Build tree for forms (company access picker, role scope picker)
		const companyTree: CompanyNode[] = buildCompanyTree(companies);

		return {
			...parentData,
			accessibleCompanies: companies.map((c) => ({
				companyId: c.companyId,
				companyName: c.companyName,
				parentCompanyId: c.parentCompanyId
			})),
			companyTree,
			selectedCompanyId
		};
	} catch (err) {
		console.error('Error loading accessible companies:', err);
		return {
			...parentData,
			accessibleCompanies: [],
			companyTree: [],
			selectedCompanyId: user.companyId || null
		};
	}
};
