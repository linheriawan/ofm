/**
 * SCIM Data Synchronization
 *
 * Syncs users and organizational units from Aksara SSO to OFM local database
 */

import { connectDB } from '$lib/server/db/mongodb';
import { scimClient, type SCIMUser, type SCIMGroup } from './client';
import type { User } from '$lib/types';

interface SyncStats {
	usersCreated: number;
	usersUpdated: number;
	usersDeactivated: number;
	orgUnitsCreated: number;
	orgUnitsUpdated: number;
	errors: string[];
}

/**
 * Sync organizational units from SCIM Groups
 * This should be run BEFORE syncing users since users reference org units
 */
export async function syncOrganizationalUnits(groups: SCIMGroup[]): Promise<{
	created: number;
	updated: number;
	errors: string[];
}> {
	const db = await connectDB();
	const orgUnitsCollection = db.collection('organizationalUnits');

	let created = 0;
	let updated = 0;
	const errors: string[] = [];

	for (const group of groups) {
		try {
			const orgUnitExt = group['x-orgUnit'];

			const orgUnitData = {
				unitName: group.displayName,
				unitType: orgUnitExt?.unitType || 'department',
				level: orgUnitExt?.level || 1,
				parentUnitId: orgUnitExt?.parentUnitId || null,
				managerId: orgUnitExt?.managerId || null,
				externalId: group.externalId,
				syncedAt: new Date(),
				updatedAt: new Date()
			};

			const existing = await orgUnitsCollection.findOne({ _id: group.id });

			if (existing) {
				await orgUnitsCollection.updateOne(
					{ _id: group.id },
					{ $set: orgUnitData }
				);
				updated++;
			} else {
				await orgUnitsCollection.insertOne({
					_id: group.id,
					...orgUnitData,
					createdAt: new Date()
				});
				created++;
			}
		} catch (error) {
			const errorMsg = `Failed to sync org unit ${group.displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
			console.error(errorMsg);
			errors.push(errorMsg);
		}
	}

	console.log(`✅ Synced ${groups.length} organizational units (${created} created, ${updated} updated)`);

	return { created, updated, errors };
}

/**
 * Sync users from SCIM Users
 */
export async function syncUsers(users: SCIMUser[]): Promise<{
	created: number;
	updated: number;
	deactivated: number;
	errors: string[];
}> {
	const db = await connectDB();
	const usersCollection = db.collection<User>('users');

	let created = 0;
	let updated = 0;
	let deactivated = 0;
	const errors: string[] = [];

	for (const scimUser of users) {
		try {
			const enterpriseExt = scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
			const positionExt = scimUser['x-position'];

			// Determine role based on email or position
			const isAdminUser = scimUser.userName === 'admin@ias.co.id';
			const roleName = isAdminUser ? 'super_admin' : 'employee';
			const userRole = await db.collection('roles').findOne({ roleId: roleName });

			const userData: Partial<User> = {
				userId: enterpriseExt?.employeeNumber || scimUser.userName.split('@')[0],
				email: scimUser.emails?.[0]?.value || scimUser.userName,
				username: scimUser.userName.split('@')[0],
				firstName: scimUser.name?.givenName || scimUser.displayName.split(' ')[0] || 'User',
				lastName: scimUser.name?.familyName || scimUser.displayName.split(' ').slice(1).join(' ') || '',
				phone: scimUser.phoneNumbers?.[0]?.value,
				companyId: enterpriseExt?.organization || 'IAS',
				departmentId: enterpriseExt?.department || null,
				positionId: positionExt?.id || null,
				managerId: enterpriseExt?.manager?.value || null,
				ssoUserId: scimUser.id,
				isActive: scimUser.active,
				roleIds: userRole ? [userRole._id!.toString()] : [],
				syncedAt: new Date(),
				updatedAt: new Date()
			};

			// Check if user exists by ssoUserId OR email (handle duplicates)
			const existingUser = await usersCollection.findOne({
				$or: [
					{ ssoUserId: scimUser.id },
					{ email: userData.email }
				]
			});

			if (existingUser) {
				// Update existing user
				await usersCollection.updateOne(
					{ _id: existingUser._id },
					{
						$set: {
							...userData,
							// Ensure ssoUserId is set if it wasn't before
							ssoUserId: scimUser.id
						}
					}
				);
				updated++;

				// Track deactivation
				if (existingUser.isActive && !scimUser.active) {
					deactivated++;
				}
			} else {
				// Create new user
				await usersCollection.insertOne({
					...userData,
					createdAt: new Date()
				} as User);
				created++;
			}
		} catch (error) {
			const errorMsg = `Failed to sync user ${scimUser.userName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
			console.error(errorMsg);
			errors.push(errorMsg);
		}
	}

	console.log(`✅ Synced ${users.length} users (${created} created, ${updated} updated, ${deactivated} deactivated)`);

	return { created, updated, deactivated, errors };
}

/**
 * Full synchronization from SCIM
 * Fetches all users and groups from SSO and syncs to local database
 */
export async function performFullSync(): Promise<SyncStats> {
	console.log('🔄 Starting SCIM full synchronization...');

	const stats: SyncStats = {
		usersCreated: 0,
		usersUpdated: 0,
		usersDeactivated: 0,
		orgUnitsCreated: 0,
		orgUnitsUpdated: 0,
		errors: []
	};

	try {
		// Test connection first
		const connectionTest = await scimClient.testConnection();
		if (!connectionTest.success) {
			throw new Error(`SCIM connection failed: ${connectionTest.message}`);
		}

		console.log('✅ Connected to Aksara SSO');

		// Fetch data from SCIM with pagination
		console.log('📥 Fetching organizational units...');
		const groups = await scimClient.fetchAllGroups();
		console.log(`📥 Fetched ${groups.length} organizational units`);

		console.log('📥 Fetching users...');
		// Fetch all users with pagination (handles more than 1000 users)
		const users = await scimClient.fetchAllUsers();
		console.log(`📥 Fetched ${users.length} users`);

		// Sync organizational units first (users reference them)
		const orgUnitStats = await syncOrganizationalUnits(groups);
		stats.orgUnitsCreated = orgUnitStats.created;
		stats.orgUnitsUpdated = orgUnitStats.updated;
		stats.errors.push(...orgUnitStats.errors);

		// Sync users
		const userStats = await syncUsers(users);
		stats.usersCreated = userStats.created;
		stats.usersUpdated = userStats.updated;
		stats.usersDeactivated = userStats.deactivated;
		stats.errors.push(...userStats.errors);

		console.log('✅ SCIM synchronization complete!');
		console.log(`📊 Stats: ${stats.usersCreated} users created, ${stats.usersUpdated} updated, ${stats.usersDeactivated} deactivated`);
		console.log(`📊 Stats: ${stats.orgUnitsCreated} org units created, ${stats.orgUnitsUpdated} updated`);

		if (stats.errors.length > 0) {
			console.warn(`⚠️ ${stats.errors.length} errors occurred during sync`);
		}

		// Store sync history
		const db = await connectDB();
		await db.collection('syncHistory').insertOne({
			type: 'scim_full_sync',
			startedAt: new Date(),
			completedAt: new Date(),
			stats,
			errors: stats.errors
		});

		return stats;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ SCIM synchronization failed:', errorMsg);
		stats.errors.push(errorMsg);

		// Store failed sync attempt
		const db = await connectDB();
		await db.collection('syncHistory').insertOne({
			type: 'scim_full_sync',
			startedAt: new Date(),
			completedAt: new Date(),
			status: 'failed',
			error: errorMsg,
			stats
		});

		throw error;
	}
}

/**
 * Get last sync information
 */
export async function getLastSyncInfo(): Promise<{
	lastSync: Date | null;
	status: 'success' | 'failed' | 'never';
	stats?: SyncStats;
	error?: string;
}> {
	const db = await connectDB();
	const lastSync = await db.collection('syncHistory')
		.findOne(
			{ type: 'scim_full_sync' },
			{ sort: { completedAt: -1 } }
		);

	if (!lastSync) {
		return {
			lastSync: null,
			status: 'never'
		};
	}

	return {
		lastSync: lastSync.completedAt,
		status: lastSync.status || (lastSync.errors?.length > 0 ? 'failed' : 'success'),
		stats: lastSync.stats,
		error: lastSync.error
	};
}
