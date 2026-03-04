import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';

// GET - List positions with pagination
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

		// Filter by level if provided
		const level = url.searchParams.get('level');
		if (level) query.level = parseInt(level);

		// Filter by grade if provided
		const grade = url.searchParams.get('grade');
		if (grade) query.grade = grade;

		// Filter by active status
		const isActive = url.searchParams.get('isActive');
		if (isActive !== null && isActive !== undefined) {
			query.isActive = isActive === 'true';
		}

		const [positions, total] = await Promise.all([
			db
				.collection(collections.positions)
				.find(query)
				.sort({ level: -1, positionName: 1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection(collections.positions).countDocuments(query)
		]);

		const data = positions.map((p) => ({
			...p,
			_id: p._id?.toString()
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
		console.error('Error fetching positions:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch positions'), { status: 500 });
	}
};

// POST - Create new position
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.positionId || !body.positionName || !body.companyId) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'positionId, positionName, and companyId are required'),
				{ status: 400 }
			);
		}

		const db = getDB();

		// Check if positionId already exists
		const existing = await db
			.collection(collections.positions)
			.findOne({ positionId: body.positionId });

		if (existing) {
			return json(
				apiError(ErrorCode.VALIDATION_ERROR, 'Position with this ID already exists'),
				{ status: 400 }
			);
		}

		const now = new Date();
		const newPosition = {
			positionId: body.positionId,
			positionName: body.positionName,
			code: body.code || body.positionId,
			level: body.level,
			grade: body.grade,
			companyId: body.companyId,
			ssoPositionId: body.ssoPositionId,
			isActive: body.isActive !== false,
			createdAt: now,
			updatedAt: now,
			createdBy: user.email
		};

		const result = await db.collection(collections.positions).insertOne(newPosition);

		return json(
			success(
				{ _id: result.insertedId.toString(), ...newPosition },
				null,
				'Position created successfully'
			),
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating position:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to create position'), { status: 500 });
	}
};
