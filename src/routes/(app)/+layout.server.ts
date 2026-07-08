import type { LayoutServerLoad } from './$types';
import { connectDB, collections } from '$lib/server/db/mongodb';
import { buildCompanyTree } from '$lib/server/db/company-utils';
import type { CompanyNode } from '$lib/server/db/company-utils';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const user = locals.user;

	if (!user) {
		return {
			...parentData,
			accessibleCompanies: [],
			companyTree: [],
			selectedCompanyId: null,
			touAcceptedAt: null
		};
	}

	try {
		const db = await connectDB();

		// Terms of Usage consent timestamp (persisted on the user document)
		const dbUser = await db
			.collection(collections.users)
			.findOne({ userId: user.userId }, { projection: { touAcceptedAt: 1 } });
		const touAcceptedAt: Date | null = dbUser?.touAcceptedAt ?? null;

		const userPerms = user.permissions ?? [];
		const isGlobalAdmin =
			userPerms.includes('*') || userPerms.includes('admin') ||
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
		} else if (user.companyCode) {
			// Single-company user: only their own company
			companies = await db
				.collection(collections.companies)
				.find({ companyId: user.companyCode, isActive: true })
				.toArray();
		}

		const selectedCompanyId =
			user.selectedCompanyId || user.companyCode || companies[0]?.code || null;

		// Build tree for forms (company access picker, role scope picker)
		const companyTree: CompanyNode[] = buildCompanyTree(companies);

		return {
			...parentData,
			accessibleCompanies: companies.map((c) => ({
				companyId: c.companyId,
				companyName: c.companyName,
				parentCompanyId: c.parentCompanyId
			})),
			ssoBaseUrl: env.SSO_ISSUER || 'https://sso.ias.id',
			companyTree,
			selectedCompanyId,
			touAcceptedAt
		};
	} catch (err) {
		console.error('Error loading accessible companies:', err);
		return {
			...parentData,
			accessibleCompanies: [],
			companyTree: [],
			selectedCompanyId: user.companyId || null,
			touAcceptedAt: null
		};
	}
};
