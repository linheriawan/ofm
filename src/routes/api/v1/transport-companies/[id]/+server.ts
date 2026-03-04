import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { ObjectId } from 'mongodb';

// GET - Get single transport company
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const db = getDB();

		const company = await db
			.collection(collections.transportCompanies)
			.findOne({ _id: new ObjectId(id) });

		if (!company) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Transport company not found'), { status: 404 });
		}

		return json(
			success({
				...company,
				_id: company._id?.toString()
			})
		);
	} catch (err: any) {
		console.error('Error fetching transport company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch transport company'), {
			status: 500
		});
	}
};

// PUT - Update transport company
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const { id } = params;
		const body = await request.json();
		const db = getDB();

		// Check if exists
		const existing = await db
			.collection(collections.transportCompanies)
			.findOne({ _id: new ObjectId(id) });

		if (!existing) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Transport company not found'), { status: 404 });
		}

		const update: any = {
			name: body.name,
			type: body.type,
			contactPerson: body.contactPerson,
			contactPhone: body.contactPhone,
			contactEmail: body.contactEmail,
			contractNumber: body.contractNumber,
			contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : undefined,
			contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : undefined,
			billingCycle: body.billingCycle,
			billingContactEmail: body.billingContactEmail,
			isActive: body.isActive,
			notes: body.notes,
			updatedAt: new Date(),
			updatedBy: user.userId
		};

		await db
			.collection(collections.transportCompanies)
			.updateOne({ _id: new ObjectId(id) }, { $set: update });

		const updated = await db
			.collection(collections.transportCompanies)
			.findOne({ _id: new ObjectId(id) });

		return json(
			success({
				...updated,
				_id: updated?._id?.toString()
			})
		);
	} catch (err: any) {
		console.error('Error updating transport company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to update transport company'), {
			status: 500
		});
	}
};

// DELETE - Delete transport company
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const { id } = params;
		const db = getDB();

		// Check if company has vouchers
		const voucherCount = await db
			.collection(collections.vouchers)
			.countDocuments({ transportCompanyId: id });

		if (voucherCount > 0) {
			return json(
				apiError(
					ErrorCode.BAD_REQUEST,
					`Cannot delete company with ${voucherCount} vouchers. Set to inactive instead.`
				),
				{ status: 400 }
			);
		}

		const result = await db
			.collection(collections.transportCompanies)
			.deleteOne({ _id: new ObjectId(id) });

		if (result.deletedCount === 0) {
			return json(apiError(ErrorCode.NOT_FOUND, 'Transport company not found'), { status: 404 });
		}

		return json(success({ message: 'Transport company deleted successfully' }));
	} catch (err: any) {
		console.error('Error deleting transport company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete transport company'), {
			status: 500
		});
	}
};
