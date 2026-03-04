/**
 * Approval Workflows API
 * Manage approval workflow configurations
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const db = getDB();
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const skip = (page - 1) * limit;

		const module = url.searchParams.get('module'); // transportation or meeting
		const query: any = {};
		if (module) query.module = module;

		const [workflows, total] = await Promise.all([
			db.collection('approvalWorkflows')
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection('approvalWorkflows').countDocuments(query)
		]);

		return json({
			success: true,
			data: workflows,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching workflows:', error);
		return json(
			{
				success: false,
				error: { code: 'FETCH_ERROR', message: 'Failed to fetch workflows' }
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const db = getDB();

		const newWorkflow = {
			workflowName: data.workflowName,
			module: data.module, // 'transportation' or 'meeting'
			description: data.description || '',

			// Approval rules
			requiredApprovers: data.requiredApprovers || 1,
			approverRoles: data.approverRoles || [], // Array of role IDs that can approve
			approverUsers: data.approverUsers || [], // Specific user IDs that can approve

			// Auto-approval rules
			autoApproveEnabled: data.autoApproveEnabled || false,
			autoApproveConditions: data.autoApproveConditions || {}, // e.g., {amount: {max: 1000000}, daysInAdvance: {min: 3}}

			// Escalation rules
			escalationEnabled: data.escalationEnabled || false,
			escalationHours: data.escalationHours || 24, // Hours before escalating
			escalationToRoles: data.escalationToRoles || [],

			// Notification settings
			notifyOnSubmit: data.notifyOnSubmit !== false,
			notifyOnApproval: data.notifyOnApproval !== false,
			notifyOnRejection: data.notifyOnRejection !== false,

			isActive: data.isActive !== undefined ? data.isActive : true,
			priority: data.priority || 0, // Higher priority workflows are checked first

			createdAt: new Date(),
			updatedAt: new Date()
		};

		const result = await db.collection('approvalWorkflows').insertOne(newWorkflow);

		return json({
			success: true,
			data: { _id: result.insertedId, ...newWorkflow }
		});
	} catch (error) {
		console.error('Error creating workflow:', error);
		return json(
			{
				success: false,
				error: { code: 'CREATE_ERROR', message: 'Failed to create workflow' }
			},
			{ status: 500 }
		);
	}
};
