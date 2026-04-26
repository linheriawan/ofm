import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDocuments, createDocument, buildFilterFromParams, getPaginationParams } from '$lib/utils/api';
import { getCollection } from '$lib/db/mongodb';
import { ObjectId } from 'mongodb';
import type { Driver } from '$lib/types';

async function syncDriverRole(userId: string, add: boolean) {
	if (!userId) return;
	try {
		const users = await getCollection('users');
		const id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
		const query = id ? { _id: id } : { userId };
		if (add) {
			await users.updateOne(query, { $addToSet: { roleIds: 'driver' } } as any);
		} else {
			await users.updateOne(query, { $pull: { roleIds: 'driver' } } as any);
		}
	} catch (e) {
		console.error('syncDriverRole failed', e);
	}
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const allowedFilters = ['companyId', 'status', 'locationId'];
		const filter = buildFilterFromParams(url.searchParams, allowedFilters);
		const { page, limit } = getPaginationParams(url.searchParams);

		// userId filter — match by ObjectId or string
		const userId = url.searchParams.get('userId');
		if (userId) {
			filter['userId'] = ObjectId.isValid(userId)
				? { $in: [userId, new ObjectId(userId)] }
				: userId;
		}

		const result = await listDocuments<Driver>('drivers', { filter, page, limit });

		// Enrich each driver with the linked user's name
		if (result.data?.length) {
			const users = await getCollection('users');
			const userIds = (result.data as any[])
				.map(d => d.userId)
				.filter(Boolean)
				.map((id: string) => ObjectId.isValid(id) ? new ObjectId(id) : id);

			const userDocs = userIds.length
				? await users.find({ _id: { $in: userIds } }).toArray() as any[]
				: [];

			const userMap = Object.fromEntries(userDocs.map(u => [u._id.toString(), u]));

			result.data = (result.data as any[]).map(d => {
				const user = userMap[d.userId?.toString()];
				return {
					...d,
					userName: d.userName || (user
						? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
						: d.userId || '—')
				};
			});
		}

		return json(result);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		return json({ success: false, error: 'Failed to fetch drivers' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Resolve userName from users collection if not provided
		let userName = body.userName || '';
		if (!userName && body.userId) {
			const users = await getCollection('users');
			const id = ObjectId.isValid(body.userId) ? new ObjectId(body.userId) : null;
			const user = id ? await users.findOne({ _id: id }) as any : null;
			if (user) userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || '';
		}

		const driver = {
			driverId: body.driverId || `DRV-${Date.now()}`,
			userId: body.userId,
			userName,
			companyId: body.companyId,
			licenseNumber: body.licenseNumber,
			licenseExpiry: new Date(body.licenseExpiry),
			status: body.status || 'available',
			locationId: body.locationId,
			rating: body.rating || 0
		};

		const result = await createDocument<Driver>('drivers', driver);
		if (body.userId) await syncDriverRole(body.userId, true);
		return json(result, { status: result.status });
	} catch (error) {
		console.error('Error creating driver:', error);
		return json({ success: false, error: 'Failed to create driver' }, { status: 500 });
	}
};
