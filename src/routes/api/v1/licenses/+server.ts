/**
 * Meeting Licenses API
 * GET /api/v1/licenses - List meeting licenses (Zoom, Meet, Teams accounts)
 * POST /api/v1/licenses - Create a new license
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, isAdmin } from '$lib/server/api/auth';
import { success, error, ErrorCode } from '$lib/server/api/response';
import { getDB, collections } from '$lib/server/db/mongodb';
import type { MeetingLicense } from '$lib/types';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async (event) => {
	try {
		await requireAuth(event);
		const db = getDB();
		const sp = event.url.searchParams;

		const query: any = {};
		const platform = sp.get('platform');
		const status = sp.get('status');
		const companyId = sp.get('companyId');

		if (platform) query.platform = platform;
		if (status) query.status = status;
		else query.status = { $in: ['active', 'in-use'] }; // default: only usable licenses
		if (companyId) query.companyId = companyId;

		const docs = await db.collection(collections.meetingLicenses)
			.find(query)
			.sort({ platform: 1, licenseId: 1 })
			.toArray();

		const data = docs.map((d) => ({ ...d, _id: d._id.toString() }));
		return json(success(data));
	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to fetch licenses', err.message), { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		if (!isAdmin(user)) {
			return json(error(ErrorCode.FORBIDDEN, 'Admin access required'), { status: 403 });
		}

		const body = await event.request.json();
		const { platform, licenseKey, maxParticipants, maxDuration, expiryDate, purchaseDate, cost, currency, companyId } = body;

		if (!platform || !licenseKey) {
			return json(error(ErrorCode.VALIDATION_ERROR, 'platform and licenseKey are required'), { status: 400 });
		}

		const db = getDB();
		const now = new Date();

		const doc: Omit<MeetingLicense, '_id'> = {
			licenseId: new ObjectId().toHexString(),
			companyId: companyId || user.companyId || 'default',
			platform,
			licenseKey,
			maxParticipants: maxParticipants || 100,
			maxDuration: maxDuration || 60,
			status: 'active',
			expiryDate: expiryDate ? new Date(expiryDate) : undefined,
			purchaseDate: purchaseDate ? new Date(purchaseDate) : now,
			cost: cost || 0,
			currency: currency || 'IDR',
			createdAt: now,
			updatedAt: now,
			createdBy: user.userId,
		};

		const result = await db.collection(collections.meetingLicenses).insertOne(doc as any);
		return json(success({ ...doc, _id: result.insertedId.toString() }), { status: 201 });
	} catch (err: any) {
		if (err instanceof Response) throw err;
		return json(error(ErrorCode.INTERNAL_ERROR, 'Failed to create license', err.message), { status: 500 });
	}
};
