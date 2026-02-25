/**
 * Settings Management
 * Handle application settings stored in database with encryption for sensitive values
 */

import { connectDB } from './db/mongodb';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';
import type { Setting } from './db/schemas/settings';
import { DEFAULT_SETTINGS, SETTING_KEYS } from './db/schemas/settings';

// Encryption key (should be set in environment)
const ENCRYPTION_KEY = env.SETTINGS_ENCRYPTION_KEY || process.env.SETTINGS_ENCRYPTION_KEY || 'default-key-change-in-production-32c';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes
const KEY = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));

/**
 * Encrypt sensitive value
 */
function encrypt(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive value
 */
function decrypt(encrypted: string): string {
	const parts = encrypted.split(':');
	const iv = Buffer.from(parts[0], 'hex');
	const encryptedText = parts[1];
	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
	const decrypted1 = decipher.update(encryptedText, 'hex', 'utf8');
	const decrypted2 = decipher.final('utf8');
	return decrypted1 + decrypted2;
}

/**
 * Initialize settings collection with default values
 */
export async function initializeSettings(): Promise<void> {
	const db = await connectDB();
	const settingsCollection = db.collection<Setting>('settings');

	for (const setting of DEFAULT_SETTINGS) {
		const existing = await settingsCollection.findOne({ key: setting.key });

		if (!existing) {
			await settingsCollection.insertOne({
				...setting,
				createdAt: new Date(),
				updatedAt: new Date()
			} as Setting);
		}
	}

	console.log('✅ Settings initialized');
}

/**
 * Get setting by key
 * Automatically decrypts if it's a secret
 */
export async function getSetting(key: string): Promise<string | null> {
	const db = await connectDB();
	const setting = await db.collection<Setting>('settings').findOne({ key });

	if (!setting) {
		// Fallback to environment variable
		const envKey = key.replace(/\./g, '_').toUpperCase();
		return env[envKey] || process.env[envKey] || null;
	}

	if (setting.isSecret && setting.value) {
		try {
			return decrypt(setting.value);
		} catch (error) {
			console.error(`Failed to decrypt setting ${key}:`, error);
			return null;
		}
	}

	return setting.value || null;
}

/**
 * Get multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
	const result: Record<string, string | null> = {};

	for (const key of keys) {
		result[key] = await getSetting(key);
	}

	return result;
}

/**
 * Get all settings in a category
 */
export async function getSettingsByCategory(category: string): Promise<Setting[]> {
	const db = await connectDB();
	const settings = await db.collection<Setting>('settings')
		.find({ category: category as any })
		.toArray();

	// Decrypt secrets for display (but mask them)
	return settings.map(setting => ({
		...setting,
		value: setting.isSecret && setting.value ? '***HIDDEN***' : setting.value
	}));
}

/**
 * Update setting value
 * Automatically encrypts if it's a secret
 */
export async function updateSetting(
	key: string,
	value: string,
	updatedBy?: string
): Promise<void> {
	const db = await connectDB();
	const settingsCollection = db.collection<Setting>('settings');

	const setting = await settingsCollection.findOne({ key });

	if (!setting) {
		throw new Error(`Setting ${key} not found`);
	}

	const newValue = setting.isSecret && value ? encrypt(value) : value;

	await settingsCollection.updateOne(
		{ key },
		{
			$set: {
				value: newValue,
				updatedBy,
				updatedAt: new Date()
			}
		}
	);
}

/**
 * Bulk update settings
 */
export async function updateSettings(
	updates: Array<{ key: string; value: string }>,
	updatedBy?: string
): Promise<void> {
	for (const update of updates) {
		await updateSetting(update.key, update.value, updatedBy);
	}
}

/**
 * Get SCIM configuration (convenience function)
 */
export async function getSCIMConfig(): Promise<{
	baseUrl: string | null;
	clientId: string | null;
	clientSecret: string | null;
	webhookSecret: string | null;
}> {
	return {
		baseUrl: await getSetting(SETTING_KEYS.SCIM_BASE_URL),
		clientId: await getSetting(SETTING_KEYS.SCIM_CLIENT_ID),
		clientSecret: await getSetting(SETTING_KEYS.SCIM_CLIENT_SECRET),
		webhookSecret: await getSetting(SETTING_KEYS.SCIM_WEBHOOK_SECRET)
	};
}

/**
 * Check if SCIM is configured
 */
export async function isSCIMConfigured(): Promise<boolean> {
	const config = await getSCIMConfig();
	return !!(config.baseUrl && config.clientId && config.clientSecret);
}
