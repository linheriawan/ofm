/**
 * Server-Sent Events (SSE) endpoint for real-time sync progress
 */

import type { RequestHandler } from './$types';
import { scimClient } from '$lib/server/scim/client';
import { syncOrganizationalUnits, syncUsers } from '$lib/server/scim/sync';
import { getDB } from '$lib/server/db/mongodb';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
	const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	controller.enqueue(new TextEncoder().encode(message));
}

export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		async start(controller) {
			try {
				sendSSE(controller, 'status', { message: '🔄 Starting SCIM synchronization...' });

				// Test connection
				sendSSE(controller, 'status', { message: '🔌 Testing SSO connection...' });
				const connectionTest = await scimClient.testConnection();
				if (!connectionTest.success) {
					throw new Error(`Connection failed: ${connectionTest.message}`);
				}
				sendSSE(controller, 'status', { message: '✅ Connected to Aksara SSO' });

				// Fetch organizational units with pagination (optional — skip if endpoint unavailable)
				let groups: any[] = [];
				try {
					sendSSE(controller, 'status', { message: '📥 Fetching organizational units...' });
					groups = await scimClient.fetchAllGroups();
					sendSSE(controller, 'progress', {
						phase: 'fetch_groups',
						total: groups.length,
						message: `📥 Fetched ${groups.length} organizational units`
					});
				} catch (groupErr) {
					const msg = groupErr instanceof Error ? groupErr.message : String(groupErr);
					sendSSE(controller, 'status', { message: `⚠️ Skipping org units (${msg.slice(0, 80)})` });
				}

				// Fetch users with pagination (handles 1500+ users)
				sendSSE(controller, 'status', { message: '📥 Fetching users with pagination...' });
				const users = await scimClient.fetchAllUsers();
				sendSSE(controller, 'progress', {
					phase: 'fetch_users',
					total: users.length,
					message: `📥 Fetched ${users.length} users`
				});

				// Sync organizational units
				sendSSE(controller, 'status', { message: '🔄 Syncing organizational units...' });
				const orgUnitStats = await syncOrganizationalUnits(groups);
				sendSSE(controller, 'progress', {
					phase: 'sync_groups',
					created: orgUnitStats.created,
					updated: orgUnitStats.updated,
					errors: orgUnitStats.errors.length,
					message: `✅ Synced ${groups.length} organizational units (${orgUnitStats.created} created, ${orgUnitStats.updated} updated)`
				});

				// Sync users with progress updates
				sendSSE(controller, 'status', { message: '🔄 Syncing users...' });

				const db = getDB();
				const usersCollection = db.collection('users');
				let created = 0;
				let updated = 0;
				let deactivated = 0;
				const errors: string[] = [];

				for (let i = 0; i < users.length; i++) {
					const scimUser = users[i];

					try {
						const enterpriseExt = scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
						const positionExt = scimUser['x-position'];

						const isAdminUser = scimUser.userName === 'admin@ias.co.id';
						const roleName = isAdminUser ? 'super_admin' : 'employee';
						const userRole = await db.collection('roles').findOne({ roleId: roleName });

						// SSO-owned fields — always overwritten from SCIM
						const ssoFields: any = {
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
							syncedAt: new Date(),
							updatedAt: new Date()
						};

						const existingUser = await usersCollection.findOne({
							$or: [
								{ ssoUserId: scimUser.id },
								{ email: ssoFields.email }
							]
						});

						if (existingUser) {
							// Preserve OFM-managed fields (roleIds, locationId, companyAccess)
							await usersCollection.updateOne(
								{ _id: existingUser._id },
								{ $set: ssoFields }
							);
							updated++;

							if (existingUser.isActive && !scimUser.active) {
								deactivated++;
							}
						} else {
							// New user — set SSO fields + OFM defaults
							await usersCollection.insertOne({
								...ssoFields,
								roleIds: userRole ? [userRole._id!.toString()] : [],
								locationId: null,
								companyAccess: [],
								createdAt: new Date()
							});
							created++;
						}

						// Send progress every 10 users
						if ((i + 1) % 10 === 0 || i === users.length - 1) {
							sendSSE(controller, 'progress', {
								phase: 'sync_users',
								current: i + 1,
								total: users.length,
								created,
								updated,
								deactivated,
								errors: errors.length,
								message: `Syncing users: ${i + 1}/${users.length}`
							});
						}
					} catch (error) {
						const errorMsg = `Failed to sync user ${scimUser.userName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
						console.error(errorMsg);
						errors.push(errorMsg);
					}
				}

				// Final summary
				const stats = {
					usersCreated: created,
					usersUpdated: updated,
					usersDeactivated: deactivated,
					orgUnitsCreated: orgUnitStats.created,
					orgUnitsUpdated: orgUnitStats.updated,
					errors: [...orgUnitStats.errors, ...errors]
				};

				// Store sync history
				await db.collection('syncHistory').insertOne({
					type: 'scim_full_sync',
					startedAt: new Date(),
					completedAt: new Date(),
					stats,
					errors: stats.errors
				});

				sendSSE(controller, 'complete', {
					stats,
					message: '✅ Synchronization completed!'
				});

				controller.close();
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Unknown error';
				sendSSE(controller, 'error', {
					message: `❌ Synchronization failed: ${errorMsg}`
				});
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
