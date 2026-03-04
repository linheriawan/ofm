/**
 * Settings Schema
 * Store application configuration that can be modified by admins
 */

import type { ObjectId } from 'mongodb';

export interface Setting {
	_id?: ObjectId;
	key: string; // Unique setting key (e.g., 'scim.client_id')
	value: string; // Setting value (encrypted for sensitive data)
	category: 'scim' | 'email' | 'general' | 'auth'; // Setting category
	label: string; // Human-readable label
	description?: string; // Setting description
	isSecret: boolean; // Whether this is a sensitive value (will be encrypted)
	isRequired: boolean; // Whether this setting is required
	updatedBy?: string; // User ID who last updated
	updatedAt: Date;
	createdAt: Date;
}

// Predefined settings structure
export const SETTING_KEYS = {
	// SCIM Configuration
	SCIM_BASE_URL: 'scim.base_url',
	SCIM_CLIENT_ID: 'scim.client_id',
	SCIM_CLIENT_SECRET: 'scim.client_secret',
	SCIM_WEBHOOK_SECRET: 'scim.webhook_secret',

	// Email Configuration
	SMTP_HOST: 'email.smtp_host',
	SMTP_PORT: 'email.smtp_port',
	SMTP_USER: 'email.smtp_user',
	SMTP_PASSWORD: 'email.smtp_password',

	// General
	APP_NAME: 'general.app_name',
	APP_URL: 'general.app_url',
} as const;

export const DEFAULT_SETTINGS: Omit<Setting, '_id' | 'updatedAt' | 'createdAt'>[] = [
	// SCIM Settings
	{
		key: SETTING_KEYS.SCIM_BASE_URL,
		value: 'http://localhost:5173',
		category: 'scim',
		label: 'SSO Base URL',
		description: 'Base URL of Aksara SSO server',
		isSecret: false,
		isRequired: true
	},
	{
		key: SETTING_KEYS.SCIM_CLIENT_ID,
		value: '',
		category: 'scim',
		label: 'SCIM Client ID',
		description: 'OAuth 2.0 client ID from SSO',
		isSecret: false,
		isRequired: true
	},
	{
		key: SETTING_KEYS.SCIM_CLIENT_SECRET,
		value: '',
		category: 'scim',
		label: 'SCIM Client Secret',
		description: 'OAuth 2.0 client secret from SSO',
		isSecret: true,
		isRequired: true
	},
	{
		key: SETTING_KEYS.SCIM_WEBHOOK_SECRET,
		value: '',
		category: 'scim',
		label: 'SCIM Webhook Secret',
		description: 'Secret for verifying webhook signatures',
		isSecret: true,
		isRequired: false
	},

	// Email Settings
	{
		key: SETTING_KEYS.SMTP_HOST,
		value: 'smtp.gmail.com',
		category: 'email',
		label: 'SMTP Host',
		description: 'Email server hostname',
		isSecret: false,
		isRequired: false
	},
	{
		key: SETTING_KEYS.SMTP_PORT,
		value: '587',
		category: 'email',
		label: 'SMTP Port',
		description: 'Email server port',
		isSecret: false,
		isRequired: false
	},
	{
		key: SETTING_KEYS.SMTP_USER,
		value: '',
		category: 'email',
		label: 'SMTP Username',
		description: 'Email account username',
		isSecret: false,
		isRequired: false
	},
	{
		key: SETTING_KEYS.SMTP_PASSWORD,
		value: '',
		category: 'email',
		label: 'SMTP Password',
		description: 'Email account password',
		isSecret: true,
		isRequired: false
	},

	// General Settings
	{
		key: SETTING_KEYS.APP_NAME,
		value: 'Office Facility Management',
		category: 'general',
		label: 'Application Name',
		description: 'Name of the application',
		isSecret: false,
		isRequired: true
	},
	{
		key: SETTING_KEYS.APP_URL,
		value: 'http://localhost:5074',
		category: 'general',
		label: 'Application URL',
		description: 'Base URL of this application',
		isSecret: false,
		isRequired: true
	}
];
