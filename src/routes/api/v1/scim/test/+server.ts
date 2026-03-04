/**
 * SCIM Connection Test API
 * Test SCIM credentials and connectivity
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scimClient } from '$lib/server/scim/client';

/**
 * POST /api/v1/scim/test
 * Test SCIM connection and credentials
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Require authentication
		if (!locals.user) {
			return json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}

		// Test the connection
		const result = await scimClient.testConnection();

		return json(result);
	} catch (error) {
		console.error('SCIM test error:', error);
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Unknown error occurred'
		});
	}
};
