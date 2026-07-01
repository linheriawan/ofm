import { ObjectId, type Db } from 'mongodb';
import { collections } from '$lib/server/db/mongodb';
import { createPaginationMeta } from '$lib/server/api/response';
import { sendEmail, getUserInfo, getAdminEmails } from '$lib/server/email';
import {
	transportApprovedEmail,
	transportRejectedEmail,
	transportCancelledEmail,
	type TransportEmailData
} from '$lib/server/email/templates';

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

	// Fire-and-forget email notifications for status-changing actions
	const emailAction = params.action;
	if (['approve', 'reject', 'cancel'].includes(emailAction)) {
		sendTransportNotification(db, request, params, user, emailAction).catch((e) =>
			console.error('[Email] Transport notification failed:', e)
		);
	}

	return {};
}

async function sendTransportNotification(
	db: Db,
	request: any,
	params: ActionParams,
	actor: any,
	action: string
): Promise<void> {
	console.log(`[Email] Transport ${action} notification — userId: ${request.userId}`);
	const requester = await getUserInfo(request.userId);
	if (!requester) {
		console.warn(`[Email] User not found for userId: ${request.userId} — skipping notification`);
		return;
	}
	console.log(`[Email] Sending ${action} notification to ${requester.email}`);

	const emailData: TransportEmailData = {
		requestId: request._id?.toString(),
		purpose: request.purpose || request.tripPurpose || '-',
		scheduledTime: request.scheduledTime || request.departureTime,
		pickup: request.pickupAddress || request.pickupLocation?.address || '-',
		destination: request.destinationAddress || request.destination?.address || '-',
		type: request.type || request.transportType || '-',
		requesterName: requester.name,
		approverName: actor.name || actor.email,
		vehicleName: params.vehicleName,
		driverName: params.driverName,
		voucherCode: params.voucherCode,
		rejectionReason: params.rejectionReason,
	};

	if (action === 'approve') {
		const tpl = transportApprovedEmail(emailData);
		await sendEmail({ to: requester.email, ...tpl });
	} else if (action === 'reject') {
		const tpl = transportRejectedEmail(emailData);
		await sendEmail({ to: requester.email, ...tpl });
	} else if (action === 'cancel') {
		const cancelledByAdmin = actor.userId !== request.userId;
		if (cancelledByAdmin) {
			const tpl = transportCancelledEmail(emailData, true);
			await sendEmail({ to: requester.email, ...tpl });
		} else {
			const adminEmails = await getAdminEmails(request.companyId);
			if (adminEmails.length) {
				const tpl = transportCancelledEmail(emailData, false);
				await sendEmail({ to: adminEmails, ...tpl });
			}
		}
	}
}
