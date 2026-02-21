/**
 * SCIM Webhook Receiver for Real-Time Updates
 *
 * Receives webhook events from Aksara SSO when users or groups are created/updated/deleted
 * Provides instant synchronization without polling
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import { getSCIMConfig } from '$lib/server/settings';
import crypto from 'crypto';
import type { User } from '$lib/types';

interface WebhookEvent {
	event: 'user.created' | 'user.updated' | 'user.deleted' | 'group.created' | 'group.updated' | 'group.deleted';
	timestamp: string;
	resourceType: 'User' | 'Group';
	resourceId: string;
	action: 'create' | 'update' | 'delete';
	data: any;
	previousData?: any;
}

/**
 * Verify webhook signature using HMAC SHA-256
 */
function verifySignature(payload: string, signature: string | null, webhookSecret: string): boolean {
	if (!signature || !webhookSecret) {
		console.warn('⚠️ Webhook signature verification disabled (missing secret)');
		return true; // Allow in development, but log warning
	}

	const hmac = crypto.createHmac('sha256', webhookSecret);
	hmac.update(payload);
	const expectedSignature = `sha256=${hmac.digest('hex')}`;

	return signature === expectedSignature;
}

/**
 * Handle user webhook events
 */
async function handleUserEvent(event: WebhookEvent): Promise<void> {
	const db = getDB();
	const usersCollection = db.collection<User>('users');

	if (event.action === 'create' || event.action === 'update') {
		const user = event.data;
		const enterpriseExt = user['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
		const positionExt = user['x-position'];

		// Determine role
		const isAdminUser = user.userName === 'admin@ias.co.id';
		const roleName = isAdminUser ? 'super_admin' : 'employee';
		const userRole = await db.collection('roles').findOne({ roleId: roleName });

		const userData: Partial<User> = {
			userId: enterpriseExt?.employeeNumber || user.userName.split('@')[0],
			email: user.emails?.[0]?.value || user.userName,
			username: user.userName.split('@')[0],
			firstName: user.name?.givenName || user.displayName.split(' ')[0] || 'User',
			lastName: user.name?.familyName || user.displayName.split(' ').slice(1).join(' ') || '',
			phone: user.phoneNumbers?.[0]?.value,
			companyId: enterpriseExt?.organization || 'IAS',
			departmentId: enterpriseExt?.department || null,
			positionId: positionExt?.id || null,
			managerId: enterpriseExt?.manager?.value || null,
			ssoUserId: user.id,
			isActive: user.active,
			roleIds: userRole ? [userRole._id!.toString()] : [],
			syncedAt: new Date(),
			updatedAt: new Date()
		};

		await usersCollection.updateOne(
			{ ssoUserId: user.id },
			{
				$set: userData,
				$setOnInsert: { createdAt: new Date() }
			},
			{ upsert: true }
		);

		console.log(`✅ User ${event.action === 'create' ? 'created' : 'updated'} via webhook: ${user.userName}`);
	}

	if (event.action === 'delete') {
		// Soft delete - mark as inactive
		await usersCollection.updateOne(
			{ ssoUserId: event.resourceId },
			{
				$set: {
					isActive: false,
					syncedAt: new Date(),
					updatedAt: new Date()
				}
			}
		);

		console.log(`✅ User deactivated via webhook: ${event.resourceId}`);
	}
}

/**
 * Handle group (organizational unit) webhook events
 */
async function handleGroupEvent(event: WebhookEvent): Promise<void> {
	const db = getDB();
	const orgUnitsCollection = db.collection('organizationalUnits');

	if (event.action === 'create' || event.action === 'update') {
		const group = event.data;
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

		await orgUnitsCollection.updateOne(
			{ _id: group.id },
			{
				$set: orgUnitData,
				$setOnInsert: { createdAt: new Date() }
			},
			{ upsert: true }
		);

		console.log(`✅ Organizational unit ${event.action === 'create' ? 'created' : 'updated'} via webhook: ${group.displayName}`);
	}

	if (event.action === 'delete') {
		// Soft delete - mark as inactive
		await orgUnitsCollection.updateOne(
			{ _id: event.resourceId },
			{
				$set: {
					isActive: false,
					syncedAt: new Date(),
					updatedAt: new Date()
				}
			}
		);

		console.log(`✅ Organizational unit deleted via webhook: ${event.resourceId}`);
	}
}

/**
 * POST /api/v1/scim/webhook
 * Receive webhook events from Aksara SSO
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const scimConfig = await getSCIMConfig();
		const webhookSecret = scimConfig.webhookSecret || '';
		const signature = request.headers.get('x-scim-signature');
		const payload = await request.text();

		// Verify signature
		if (!verifySignature(payload, signature, webhookSecret)) {
			console.error('❌ Invalid webhook signature');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const event: WebhookEvent = JSON.parse(payload);

		console.log(`📥 Webhook received: ${event.event} (${event.resourceType})`);

		// Handle based on resource type
		if (event.resourceType === 'User') {
			await handleUserEvent(event);
		} else if (event.resourceType === 'Group') {
			await handleGroupEvent(event);
		} else {
			console.warn(`⚠️ Unknown resource type: ${event.resourceType}`);
			return json({ error: 'Unknown resource type' }, { status: 400 });
		}

		// Log webhook event
		const db = getDB();
		await db.collection('webhookEvents').insertOne({
			event: event.event,
			resourceType: event.resourceType,
			resourceId: event.resourceId,
			action: event.action,
			receivedAt: new Date(),
			processedAt: new Date(),
			status: 'success'
		});

		return json({
			received: true,
			event: event.event,
			resourceId: event.resourceId,
			processedAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('❌ Webhook processing failed:', error);

		// Log failed webhook
		const db = getDB();
		await db.collection('webhookEvents').insertOne({
			receivedAt: new Date(),
			processedAt: new Date(),
			status: 'failed',
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		return json(
			{
				error: 'Webhook processing failed',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
