import { ObjectId, type Db } from 'mongodb';
import { collections } from '$lib/server/db/mongodb';
import { createPaginationMeta } from '$lib/server/api/response';

export interface ListParams {
	page?: number;
	limit?: number;
	status?: string;
	type?: string;
	userId?: string;
	startDate?: string;
	endDate?: string;
}

function normalise(req: any) {
	return { ...req, _id: req._id?.toString() };
}

export async function listTransportRequests(db: Db, params: ListParams) {
	const { page = 1, limit = 20, status, type, userId, startDate, endDate } = params;
	const skip = (page - 1) * limit;
	const query: any = {};

	if (status) query.status = status;
	if (type)   query.type   = type;
	if (userId) query.userId = userId;

	if (startDate || endDate) {
		query.scheduledTime = {};
		if (startDate) query.scheduledTime.$gte = new Date(startDate);
		if (endDate)   query.scheduledTime.$lte = new Date(endDate);
	}

	const [docs, total] = await Promise.all([
		db.collection(collections.transportationRequests)
			.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray(),
		db.collection(collections.transportationRequests).countDocuments(query)
	]);

	return {
		data: docs.map(normalise),
		meta: createPaginationMeta(page, limit, total)
	};
}

export async function getTransportRequest(db: Db, id: string) {
	const doc = await db.collection(collections.transportationRequests).findOne({
		_id: new ObjectId(id)
	});
	return doc ? normalise(doc) : null;
}

export interface ActionParams {
	action: string;
	rejectionReason?: string;
	vehicleId?: string;
	vehicleName?: string;
	driverId?: string;
	driverName?: string;
	voucherCode?: string;
	voucherAmount?: number;
	notes?: string;
}

export async function applyAction(
	db: Db,
	id: string,
	request: any,
	params: ActionParams,
	user: any,
	canApprove: (u: any) => boolean,
	isAdmin: (u: any) => boolean
): Promise<{ error?: string; status?: number }> {
	const now = new Date();
	const update: any = { updatedAt: now, updatedBy: user.userId };

	switch (params.action) {
		case 'approve':
			if (!canApprove(user)) return { error: 'Insufficient permissions', status: 403 };
			if (request.status !== 'pending') return { error: 'Only pending requests can be approved', status: 400 };
			update.status = request.vehicleId ? 'assigned' : 'approved';
			update.approvedBy = user.userId;
			update.approvedAt = now;
			if (request.vehicleId) update.assignedAt = now;
			if (params.notes) update.approvalNotes = params.notes;
			break;

		case 'reject':
			if (!canApprove(user)) return { error: 'Insufficient permissions', status: 403 };
			if (request.status !== 'pending') return { error: 'Only pending requests can be rejected', status: 400 };
			update.status = 'rejected';
			update.rejectionReason = params.rejectionReason || 'No reason provided';
			break;

		case 'assign_driver':
			if (!canApprove(user)) return { error: 'Insufficient permissions', status: 403 };
			if (!params.driverId || !params.vehicleId) return { error: 'driverId and vehicleId are required', status: 400 };
			update.driverId    = params.driverId;
			update.driverName  = params.driverName;
			update.vehicleId   = params.vehicleId;
			update.vehicleName = params.vehicleName;
			update.assignedAt  = now;
			update.status      = 'assigned';
			break;

		case 'assign_voucher':
			if (!canApprove(user)) return { error: 'Insufficient permissions', status: 403 };
			if (!params.voucherCode) return { error: 'voucherCode is required', status: 400 };
			update.voucherCode   = params.voucherCode;
			update.voucherAmount = params.voucherAmount;
			update.assignedAt    = now;
			update.status        = 'assigned';
			break;

		case 'cancel':
			if (request.userId !== user.userId && !isAdmin(user))
				return { error: 'Access denied', status: 403 };
			if (['completed', 'cancelled'].includes(request.status))
				return { error: 'Cannot cancel completed or already cancelled requests', status: 400 };
			update.status = 'cancelled';
			break;

		default:
			return { error: 'Invalid action', status: 400 };
	}

	await db.collection(collections.transportationRequests).updateOne(
		{ _id: new ObjectId(id) },
		{ $set: update }
	);

	return {};
}
