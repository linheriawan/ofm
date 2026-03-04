/**
 * Settings API
 * Manage application settings
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettingsByCategory, updateSettings } from '$lib/server/settings';

/**
 * GET /api/v1/settings?category=scim
 * Get settings by category
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Require authentication (only admins can view settings)
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const category = url.searchParams.get('category');

		if (!category) {
			return json({ error: 'Category parameter required' }, { status: 400 });
		}

		const settings = await getSettingsByCategory(category);

		return json({
			success: true,
			data: settings
		});
	} catch (error) {
		console.error('Failed to get settings:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT /api/v1/settings
 * Update multiple settings
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		// Require authentication (only admins can update settings)
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { settings } = body;

		if (!Array.isArray(settings)) {
			return json({ error: 'Settings must be an array' }, { status: 400 });
		}

		await updateSettings(settings, locals.user.userId);

		return json({
			success: true,
			message: 'Settings updated successfully'
		});
	} catch (error) {
		console.error('Failed to update settings:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
