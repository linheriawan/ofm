import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { ObjectId } from 'mongodb';

// GET - Get single company
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();
		const company = await db
			.collection(collections.companies)
			.findOne({ _id: new ObjectId(params.id) });

		if (!company) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Company not found'), { status: 404 });
		}

		return json(success({ ...company, _id: company._id?.toString() }));
	} catch (err: any) {
		console.error('Error fetching company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch company'), { status: 500 });
	}
};

// PUT - Update company
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const db = getDB();

		// Check if company exists
		const existing = await db
			.collection(collections.companies)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Company not found'), { status: 404 });
		}

		// If changing companyId, check for duplicates
		if (body.companyId && body.companyId !== existing.companyId) {
			const duplicate = await db
				.collection(collections.companies)
				.findOne({ companyId: body.companyId });

			if (duplicate) {
				return json(
					apiError(ErrorCode.VALIDATION_ERROR, 'Company with this ID already exists'),
					{ status: 400 }
				);
			}
		}

		const updateData = {
			...(body.companyId && { companyId: body.companyId }),
			...(body.companyName && { companyName: body.companyName }),
			...(body.code !== undefined && { code: body.code }),
			...(body.email !== undefined && { email: body.email }),
			...(body.phone !== undefined && { phone: body.phone }),
			...(body.address !== undefined && { address: body.address }),
			...(body.parentCompanyId !== undefined && { parentCompanyId: body.parentCompanyId }),
			...(body.ssoOrgId !== undefined && { ssoOrgId: body.ssoOrgId }),
			...(body.isActive !== undefined && { isActive: body.isActive }),
			updatedAt: new Date(),
			updatedBy: user.email
		};

		await db
			.collection(collections.companies)
			.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData });

		return json(success(null, null, 'Company updated successfully'));
	} catch (err: any) {
		console.error('Error updating company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to update company'), { status: 500 });
	}
};

// DELETE - Delete company
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const db = getDB();

		// Check if company exists
		const existing = await db
			.collection(collections.companies)
			.findOne({ _id: new ObjectId(params.id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Company not found'), { status: 404 });
		}

		// Check if company is used by users, departments, etc.
		const usersCount = await db
			.collection('users')
			.countDocuments({ companyId: existing.companyId });

		if (usersCount > 0) {
			return json(
				apiError(
					ErrorCode.VALIDATION_ERROR,
					`Cannot delete company. ${usersCount} user(s) are associated with it.`
				),
				{ status: 400 }
			);
		}

		await db.collection(collections.companies).deleteOne({ _id: new ObjectId(params.id) });

		return json(success(null, null, 'Company deleted successfully'));
	} catch (err: any) {
		console.error('Error deleting company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete company'), { status: 500 });
	}
};
