import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, collections } from '$lib/server/db/mongodb';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import type { TransportCompany } from '$lib/server/db/schemas';
import { ObjectId } from 'mongodb';

// GET - List all transport companies
export const GET: RequestHandler = async () => {
	try {
		const db = getDB();

		const companies = await db
			.collection(collections.transportCompanies)
			.find({})
			.sort({ name: 1 })
			.toArray();

		// Convert ObjectId to string
		const data = companies.map((company) => ({
			...company,
			_id: company._id?.toString()
		}));

		return json(success(data));
	} catch (err: any) {
		console.error('Error fetching transport companies:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch transport companies'), {
			status: 500
		});
	}
};

// POST - Create new transport company
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const body = await request.json();

		// Validation
		if (!body.name || !body.type) {
			return json(apiError(ErrorCode.VALIDATION_ERROR, 'Name and type are required'), {
				status: 400
			});
		}

		const db = getDB();
		const now = new Date();

		// Generate company ID
		const count = await db.collection(collections.transportCompanies).countDocuments();
		const companyId = `TRANS-${String(count + 1).padStart(3, '0')}`;

		const company: TransportCompany = {
			companyId,
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
			isActive: body.isActive !== false,
			notes: body.notes,
			companyId_org: user.companyId || '',
			createdAt: now,
			updatedAt: now,
			createdBy: user.userId,
			updatedBy: user.userId
		};

		const result = await db.collection(collections.transportCompanies).insertOne(company);

		return json(
			success({
				...company,
				_id: result.insertedId.toString()
			}),
			{ status: 201 }
		);
	} catch (err: any) {
		console.error('Error creating transport company:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to create transport company'), {
			status: 500
		});
	}
};
