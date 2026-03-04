import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

// GET - List companies with pagination
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};

		// Filter by companyId if provided
		const companyId = url.searchParams.get('companyId');
		if (companyId) query.companyId = companyId;

		// Filter by active status
		const isActive = url.searchParams.get('isActive');
		if (isActive !== null && isActive !== undefined) {
			query.isActive = isActive === 'true';
		}

		const [companies, total] = await Promise.all([
			db
				.collection(collections.companies)
				.find(query)
				.sort({ companyName: 1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection(collections.companies).countDocuments(query)
		]);

		const data = companies.map((c) => ({
			...c,
			_id: c._id?.toString()
		}));

		return json(
			success(data, {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			})
		);
	} catch (err: any) {
		console.error('Error fetching companies:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch companies'), { status: 500 });
	}
};

// POST - Create new company
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.companyId || !body.companyName) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'companyId and companyName are required'),
				{ status: 400 }
			);
		}

		const db = getDB();

		// Check if companyId already exists
		const existing = await db
			.collection(collections.companies)
			.findOne({ companyId: body.companyId });

		if (existing) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'Company with this ID already exists'),
				{ status: 400 }
			);
		}

		const now = new Date();
		const newCompany = {
			companyId: body.companyId,
			companyName: body.companyName,
			code: body.code || body.companyId,
			email: body.email,
			phone: body.phone,
			address: body.address,
			parentCompanyId: body.parentCompanyId,
			ssoOrgId: body.ssoOrgId,
			isActive: body.isActive !== false,
			createdAt: now,
			updatedAt: now,
			createdBy: user.email
		};

		const result = await db.collection(collections.companies).insertOne(newCompany);

		return json(
			success(
				{ _id: result.insertedId.toString(), ...newCompany },
				null,
				'Company created successfully'
			),
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to create company'), { status: 500 });
	}
};
