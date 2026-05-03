/**
 * Transportation Request Detail API
 * GET /api/v1/transport/requests/:id - Get request details
 * PATCH /api/v1/transport/requests/:id - Update request (approve/reject/cancel)
 * DELETE /api/v1/transport/requests/:id - Cancel request
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdmin, canApprove } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { parseBody, isValidObjectId } from '$lib/server/api/validation';
import { getDB } from '$lib/server/db/mongodb';
import { getTransportRequest, applyAction } from '$lib/services/transport-request-service';

export const GET: RequestHandler = async (event) => {
	try {
		await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const request = await getTransportRequest(getDB(), id);
		if (!request) return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });
		return json(success(request));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch request', err.message), { status: 500 });
	}
};

export const PATCH: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const body = await parseBody<{
			action?: 'approve' | 'reject' | 'cancel' | 'assign_driver' | 'assign_voucher';
			rejectionReason?: string;
			vehicleId?: string;
			vehicleName?: string;
			driverId?: string;
			driverName?: string;
			voucherCode?: string;
			voucherAmount?: number;
			notes?: string;
		}>(event.request);

		const db = getDB();
		const request = await getTransportRequest(db, id);
		if (!request) return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });

		if (!body.action) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'action is required'), { status: 400 });
		}

		const result = await applyAction(db, id, request, body as any, user, canApprove, isAdmin);
		if (result.error) {
			const code = result.status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.VALIDATION_ERROR;
			return json(error(code, result.error), { status: result.status });
		}

		return json(success({ message: 'Request updated successfully' }));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to update request', err.message), { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { id } = event.params;

		if (!isValidObjectId(id)) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'Invalid request ID'), { status: 400 });
		}

		const db = getDB();
		const request = await getTransportRequest(db, id);
		if (!request) return json(error(ErrorCode.NOT_FOUND, 'Request not found'), { status: 404 });

		const result = await applyAction(db, id, request, { action: 'cancel' }, user, canApprove, isAdmin);
		if (result.error) {
			const code = result.status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.VALIDATION_ERROR;
			return json(error(code, result.error), { status: result.status });
		}

		return json(success({ message: 'Request cancelled successfully' }));

	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to delete request', err.message), { status: 500 });
	}
};
