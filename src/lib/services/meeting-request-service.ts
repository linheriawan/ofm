import { ObjectId, type Db } from 'mongodb';
import { collections } from '$lib/server/db/mongodb';
import { createPaginationMeta } from '$lib/server/api/response';

export interface ListParams {
	page?: number;
	limit?: number;
	status?: string;
	type?: string;
	roomId?: string;
	startDate?: string;
	endDate?: string;
	sortDir?: 'asc' | 'desc';
}

// Normalise a raw DB document for API responses
function normalise(req: any) {
	return {
		...req,
		_id: req._id?.toString(),
		// Merge legacy 'assigned' into 'approved'
		status: req.status === 'assigned' ? 'approved' : req.status
	};
}

// Expand 'approved' filter to include legacy 'assigned' docs
function buildStatusQuery(status: string) {
	return status === 'approved' ? { $in: ['approved', 'assigned'] } : status;
}

export async function listMeetingRequests(db: Db, params: ListParams) {
	const {
		page = 1,
		limit = 20,
		status,
		type,
		roomId,
		startDate,
		endDate,
		sortDir = 'desc'   // default: newest meeting first
	} = params;

	const skip = (page - 1) * limit;
	const query: any = {};

	if (status) query.status = buildStatusQuery(status);
	if (type)   query.type   = type;
	if (roomId) query.roomId = roomId;

	if (startDate || endDate) {
		query.startTime = {};
		if (startDate) query.startTime.$gte = new Date(startDate);
		if (endDate)   query.startTime.$lte = new Date(endDate);
	}

	const sort = sortDir === 'asc' ? 1 : -1;

	const [docs, total] = await Promise.all([
		db.collection(collections.meetingRequests)
			.find(query)
			.sort({ startTime: sort })
			.skip(skip)
			.limit(limit)
			.toArray(),
		db.collection(collections.meetingRequests).countDocuments(query)
	]);

	return {
		data: docs.map(normalise),
		meta: createPaginationMeta(page, limit, total)
	};
}

export async function getMeetingRequest(db: Db, id: string) {
	const doc = await db.collection(collections.meetingRequests).findOne({
		_id: new ObjectId(id)
	});
	return doc ? normalise(doc) : null;
}

export interface ActionParams {
	action: string;
	roomId?: string;
	roomName?: string;
	licenseId?: string;
	platform?: string;
	meetingLink?: string;
	rejectionReason?: string;
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
			update.status = 'approved';
			update.approvedBy = user.userId;
			update.approverName = user.name || user.email;
			update.approvalDate = now;
			if (params.notes) update.approvalNotes = params.notes;
			break;

		case 'reject':
			if (!canApprove(user)) return { error: 'Insufficient permissions', status: 403 };
			if (request.status !== 'pending') return { error: 'Only pending requests can be rejected', status: 400 };
			if (!params.rejectionReason) return { error: 'Rejection reason is required', status: 400 };
			update.status = 'rejected';
			update.rejectedBy = user.userId;
			update.rejectionReason = params.rejectionReason;
			update.rejectionDate = now;
			break;

		case 'assign_room':
			if (request.status !== 'approved') return { error: 'Only approved requests can have rooms assigned', status: 400 };
			if (!params.roomId) return { error: 'Room ID is required', status: 400 };

			const conflict = await db.collection(collections.meetingRequests).findOne({
				roomId: params.roomId,
				status: { $in: ['approved', 'assigned', 'in_progress'] },
				_id: { $ne: new ObjectId(id) },
				startTime: { $lt: request.endTime },
				endTime:   { $gt: request.startTime }
			});
			if (conflict) return { error: 'Room is not available for the selected time', status: 400 };

			update.roomId   = params.roomId;
			update.roomName = params.roomName;
			update.assignedAt = now;
			update.assignedBy = user.userId;
			break;

		case 'assign_license':
			if (request.status !== 'approved') return { error: 'Only approved requests can have licenses assigned', status: 400 };
			if (!params.licenseId) return { error: 'License ID is required', status: 400 };
			update.licenseId    = params.licenseId;
			update.platform     = params.platform;
			update.meetingLink  = params.meetingLink;
			update.assignedAt   = now;
			update.assignedBy   = user.userId;
			break;

		case 'cancel':
			if (['completed', 'cancelled'].includes(request.status))
				return { error: 'Cannot cancel completed or already cancelled requests', status: 400 };
			update.status          = 'cancelled';
			update.cancelledBy     = user.userId;
			update.cancelledAt     = now;
			if (params.notes) update.cancellationReason = params.notes;
			break;

		default:
			return { error: 'Invalid action', status: 400 };
	}

	await db.collection(collections.meetingRequests).updateOne(
		{ _id: new ObjectId(id) },
		{ $set: update }
	);

	return {};
}
