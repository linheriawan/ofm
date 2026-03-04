import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { ObjectId } from 'mongodb';

// GET - Get single department
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const department = await db
			.collection(collections.departments)
			.findOne({ _id: new ObjectId(params.id) });

		if (!department) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Department not found'), { status: 404 });
		}

		return json(success({ ...department, _id: department._id?.toString() }));
	} catch (err: any) {
		console.error('Error fetching department:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch department'), { status: 500 });
	}
};

// PUT - Update department
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const db = getDB();

		// Check if department exists
		const existing = await db
			.collection(collections.departments)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Department not found'), { status: 404 });
		}

		// If changing departmentId, check for duplicates
		if (body.departmentId && body.departmentId !== existing.departmentId) {
			const duplicate = await db
				.collection(collections.departments)
				.findOne({ departmentId: body.departmentId });

			if (duplicate) {
				return json(
					apiError(ErrorCode.VALIDATION_ERROR, 'Department with this ID already exists'),
					{ status: 400 }
				);
			}
		}

		const updateData = {
			...(body.departmentId && { departmentId: body.departmentId }),
			...(body.departmentName && { departmentName: body.departmentName }),
			...(body.code !== undefined && { code: body.code }),
			...(body.type && { type: body.type }),
			...(body.companyId && { companyId: body.companyId }),
			...(body.level !== undefined && { level: body.level }),
			...(body.parentDepartmentId !== undefined && { parentDepartmentId: body.parentDepartmentId }),
			...(body.ssoOrgUnitId !== undefined && { ssoOrgUnitId: body.ssoOrgUnitId }),
			...(body.isActive !== undefined && { isActive: body.isActive }),
			updatedAt: new Date(),
			updatedBy: user.email
		};

		await db
			.collection(collections.departments)
			.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });

		return json(success(null, null, 'Department updated successfully'));
	} catch (err: any) {
		console.error('Error updating department:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to update department'), { status: 500 });
	}
};

// DELETE - Delete department
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();

		// Check if department exists
		const existing = await db
			.collection(collections.departments)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Department not found'), { status: 404 });
		}

		// Check if department has child departments
		const childrenCount = await db
			.collection(collections.departments)
			.countDocuments({ parentDepartmentId: existing.departmentId });

		if (childrenCount > 0) {
			return json(
				apiError(
					ErrorCode.VALIDATION_ERROR,
					`Cannot delete department. It has ${childrenCount} child department(s).`
				),
				{ status: 400 }
			);
		}

		// Check if department is used by users
		const usersCount = await db
			.collection('users')
			.countDocuments({ departmentId: existing.departmentId });

		if (usersCount > 0) {
			return json(
				apiError(
					ErrorCode.VALIDATION_ERROR,
					`Cannot delete department. ${usersCount} user(s) are associated with it.`
				),
				{ status: 400 }
			);
		}

		await db.collection(collections.departments).deleteOne({ _id: new ObjectId(params.id) });

		return json(success(null, null, 'Department deleted successfully'));
	} catch (err: any) {
		console.error('Error deleting department:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete department'), { status: 500 });
	}
};
