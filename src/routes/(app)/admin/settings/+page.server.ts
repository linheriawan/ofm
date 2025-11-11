/**
 * Settings Page Server
 * Load settings from database grouped by category
 */

import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import type { Setting } from '$lib/server/db/schemas/settings';

export const load: PageServerLoad = async ({ locals }) => {
	// Require authentication (only for logged-in users)
	if (!locals.user) {
		return {
			scimSettings: [],
			emailSettings: [],
			generalSettings: []
		};
	}

	const db = getDB();
	const settingsCollection = db.collection<Setting>('settings');

	// Fetch settings by category
	const [scimSettings, emailSettings, generalSettings] = await Promise.all([
		settingsCollection.find({ category: 'scim' }).sort({ key: 1 }).toArray(),
		settingsCollection.find({ category: 'email' }).sort({ key: 1 }).toArray(),
		settingsCollection.find({ category: 'general' }).sort({ key: 1 }).toArray()
	]);

	// Mask secret values for display and serialize ObjectId
	const maskSecrets = (settings: Setting[]) =>
		settings.map((setting) => ({
			...setting,
			_id: setting._id?.toString(),
			value: setting.isSecret && setting.value ? '***HIDDEN***' : setting.value || '',
			updatedAt: setting.updatedAt?.toISOString(),
			createdAt: setting.createdAt?.toISOString()
		}));

	return {
		scimSettings: maskSecrets(scimSettings),
		emailSettings: maskSecrets(emailSettings),
		generalSettings: maskSecrets(generalSettings)
	};
};
