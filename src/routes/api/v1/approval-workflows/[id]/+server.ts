import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();
		const db = getDB();

		const updateData = {
			workflowName: data.workflowName,
			module: data.module,
			description: data.description || '',
			requiredApprovers: data.requiredApprovers || 1,
			approverRoles: data.approverRoles || [],
			approverUsers: data.approverUsers || [],
			autoApproveEnabled: data.autoApproveEnabled || false,
			autoApproveConditions: data.autoApproveConditions || {},
			escalationEnabled: data.escalationEnabled || false,
			escalationHours: data.escalationHours || 24,
			escalationToRoles: data.escalationToRoles || [],
			notifyOnSubmit: data.notifyOnSubmit !== false,
			notifyOnApproval: data.notifyOnApproval !== false,
			notifyOnRejection: data.notifyOnRejection !== false,
			isActive: data.isActive,
			priority: data.priority || 0,
			updatedAt: new Date()
		};

		const result = await db.collection('approvalWorkflows').updateOne(
			{ _id: new ObjectId(params.id) },
			{ $set: updateData }
		);

		if (result.matchedCount === 0) {
			return json(
				{
					success: false,
					error: { code: 'NOT_FOUND', message: 'Workflow not found' }
				},
				{ status: 404 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating workflow:', error);
		return json(
			{
				success: false,
				error: { code: 'UPDATE_ERROR', message: 'Failed to update workflow' }
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const db = getDB();

		const result = await db.collection('approvalWorkflows').deleteOne({
			_id: new ObjectId(params.id)
		});

		if (result.deletedCount === 0) {
			return json(
				{
					success: false,
					error: { code: 'NOT_FOUND', message: 'Workflow not found' }
				},
				{ status: 404 }
			);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting workflow:', error);
		return json(
			{
				success: false,
				error: { code: 'DELETE_ERROR', message: 'Failed to delete workflow' }
			},
			{ status: 500 }
		);
	}
};
