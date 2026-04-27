import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scimClient } from '$lib/server/scim/client';
import { getDB } from '$lib/server/db/mongodb';

// GET /api/v1/sync/user?q=... — search SSO users, return list with sync status
export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') || '').toLowerCase().trim();
	if (!q || q.length < 2) {
		return json({ success: true, results: [] });
	}

	try {
		// Push filter to SCIM server — SSO now supports co (contains) and or-joined conditions
		const scimFilter = `displayName co "${q}" or userName co "${q}" or externalId co "${q}"`;
		const scimUsers = await scimClient.fetchUsers({ filter: scimFilter, count: 50 });
		const matches = scimUsers;

		// Check which users are already synced in OFM
		const db = getDB();
		const ssoIds = matches.map((u) => u.id);
		const existingUsers = await db
			.collection('users')
			.find({ ssoUserId: { $in: ssoIds } })
			.toArray();
		const syncedMap = new Map(existingUsers.map((u) => [u.ssoUserId, u]));

		const results = matches.map((u) => {
			const synced = syncedMap.get(u.id);
			const ext = u['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
			return {
				ssoId: u.id,
				email: u.emails?.[0]?.value || u.userName,
				username: u.userName,
				displayName: u.displayName,
				firstName: u.name?.givenName || '',
				lastName: u.name?.familyName || '',
				employeeNumber: ext?.employeeNumber || '',
				isActive: u.active,
				isSynced: !!synced,
				syncedAt: synced?.syncedAt || null
			};
		});

		return json({ success: true, results });
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Search failed';
		return json({ success: false, error: msg }, { status: 500 });
	}
};

// POST /api/v1/sync/user — sync a specific user by SSO ID
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { ssoId } = await request.json();
		if (!ssoId) {
			return json({ success: false, error: 'ssoId is required' }, { status: 400 });
		}

		const scimUser = await scimClient.fetchUser(ssoId);
		const db = getDB();
		const usersCollection = db.collection('users');

		const ext = scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
		const positionExt = scimUser['x-position'];

		const isAdminUser = scimUser.userName === 'admin@ias.co.id';
		const roleName = isAdminUser ? 'super_admin' : 'employee';
		const userRole = await db.collection('roles').findOne({ roleId: roleName });

		const ssoFields: any = {
			userId: ext?.employeeNumber || scimUser.userName.split('@')[0],
			email: scimUser.emails?.[0]?.value || scimUser.userName,
			username: scimUser.userName.split('@')[0],
			firstName: scimUser.name?.givenName || scimUser.displayName?.split(' ')[0] || 'User',
			lastName: scimUser.name?.familyName || scimUser.displayName?.split(' ').slice(1).join(' ') || '',
			phone: scimUser.phoneNumbers?.[0]?.value,
			companyId: ext?.organization || 'IAS',
			departmentId: ext?.department || null,
			positionId: positionExt?.id || null,
			managerId: ext?.manager?.value || null,
			ssoUserId: scimUser.id,
			isActive: scimUser.active,
			syncedAt: new Date(),
			updatedAt: new Date()
		};

		const existingUser = await usersCollection.findOne({
			$or: [{ ssoUserId: scimUser.id }, { email: ssoFields.email }]
		});

		let action: 'created' | 'updated';
		if (existingUser) {
			await usersCollection.updateOne({ _id: existingUser._id }, { $set: ssoFields });
			action = 'updated';
		} else {
			await usersCollection.insertOne({
				...ssoFields,
				roleIds: userRole ? [userRole._id!.toString()] : [],
				locationId: null,
				companyAccess: [],
				createdAt: new Date()
			});
			action = 'created';
		}

		return json({
			success: true,
			action,
			user: {
				email: ssoFields.email,
				username: ssoFields.username,
				firstName: ssoFields.firstName,
				lastName: ssoFields.lastName,
				isActive: ssoFields.isActive
			}
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Sync failed';
		console.error('Individual user sync failed:', msg);
		return json({ success: false, error: msg }, { status: 500 });
	}
};
