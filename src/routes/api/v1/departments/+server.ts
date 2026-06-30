import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

// GET - List departments with pagination
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

		// Filter by type if provided
		const type = url.searchParams.get('type');
		if (type) query.type = type;

		// Filter by active status
		const isActive = url.searchParams.get('isActive');
		if (isActive !== null && isActive !== undefined) {
			query.isActive = isActive === 'true';
		}

		// Org units are SCIM-synced into organizational_units; departments is for manually created ones.
		// Merge both sources, mapping org unit fields to the department shape.
		const [orgUnits, orgUnitCount, manualDepts, manualCount] = await Promise.all([
			db.collection(collections.organizationalUnits).find({}).toArray(),
			db.collection(collections.organizationalUnits).countDocuments({}),
			db.collection(collections.departments).find(query).sort({ level: 1, departmentName: 1 }).toArray(),
			db.collection(collections.departments).countDocuments(query)
		]);
		const total = orgUnitCount + manualCount;

		const fromOrgUnits = orgUnits.map((u: any) => ({
			_id: u._id?.toString(),
			departmentId: u.externalId || u._id?.toString(),
			departmentName: u.unitName,
			code: u.externalId || '',
			type: u.unitType || 'department',
			level: u.level ?? 1,
			parentDepartmentId: u.parentUnitId?.toString() || null,
			isActive: true,
			source: 'scim',
			syncedAt: u.syncedAt
		}));

		const fromManual = manualDepts.map((d: any) => ({
			...d,
			_id: d._id?.toString(),
			source: 'manual'
		}));

		const data = [...fromOrgUnits, ...fromManual].slice(skip, skip + limit);

		return json(
			success(data, {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			})
		);
	} catch (err: any) {
		console.error('Error fetching departments:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch departments'), { status: 500 });
	}
};

// POST - Create new department
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.departmentId || !body.departmentName || !body.companyId) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'departmentId, departmentName, and companyId are required'),
				{ status: 400 }
			);
		}

		const db = getDB();

		// Check if departmentId already exists
		const existing = await db
			.collection(collections.departments)
			.findOne({ departmentId: body.departmentId });

		if (existing) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'Department with this ID already exists'),
				{ status: 400 }
			);
		}

		const now = new Date();
		const newDepartment = {
			departmentId: body.departmentId,
			departmentName: body.departmentName,
			code: body.code || body.departmentId,
			type: body.type || 'department',
			companyId: body.companyId,
			level: body.level || 1,
			parentDepartmentId: body.parentDepartmentId,
			ssoOrgUnitId: body.ssoOrgUnitId,
			isActive: body.isActive !== false,
			createdAt: now,
			updatedAt: now,
			createdBy: user.email
		};

		const result = await db.collection(collections.departments).insertOne(newDepartment);

		return json(
			success(
				{ _id: result.insertedId.toString(), ...newDepartment },
				null,
				'Department created successfully'
			),
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating department:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to create department'), { status: 500 });
	}
};
