/**
 * SCIM 2.0 Client for Aksara SSO Integration
 *
 * This module provides OAuth 2.0 authenticated SCIM client
 * for syncing organizational data from Aksara SSO to OFM.
 */

import { request } from 'undici';
import { getSCIMConfig } from '$lib/server/settings';

// Cache for SCIM config (refreshed on each request to allow runtime updates)
let configCache: {
	baseUrl: string;
	clientId: string;
	clientSecret: string;
} | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function getConfig() {
	// Return cached config if still valid
	if (configCache && Date.now() - cacheTime < CACHE_TTL) {
		return configCache;
	}

	// Get from database settings (getSetting already falls back to env vars)
	const dbConfig = await getSCIMConfig();

	configCache = {
		baseUrl: dbConfig.baseUrl || 'http://localhost:5173',
		clientId: dbConfig.clientId || '',
		clientSecret: dbConfig.clientSecret || ''
	};

	cacheTime = Date.now();
	return configCache;
}

interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

interface SCIMListResponse<T> {
	schemas: string[];
	totalResults: number;
	startIndex: number;
	itemsPerPage: number;
	Resources: T[];
}

interface SCIMUser {
	id: string;
	externalId?: string;
	userName: string;
	name: {
		givenName: string;
		familyName: string;
		formatted: string;
	};
	displayName: string;
	active: boolean;
	emails?: Array<{
		value: string;
		primary: boolean;
		type?: string;
	}>;
	phoneNumbers?: Array<{
		value: string;
		type?: string;
	}>;
	'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'?: {
		employeeNumber?: string;
		department?: string;
		organization?: string;
		division?: string;
		manager?: {
			value: string;
			$ref: string;
			displayName: string;
		};
	};
	'x-position'?: {
		id: string;
		name: string;
		isManager: boolean;
		level: number;
	};
	'x-orgUnit'?: {
		id: string;
		name: string;
	};
	meta?: {
		resourceType: string;
		created: string;
		lastModified: string;
		location: string;
	};
}

interface SCIMGroup {
	id: string;
	externalId?: string;
	displayName: string;
	members?: Array<{
		value: string;
		$ref: string;
		type: string;
		display: string;
	}>;
	'x-orgUnit'?: {
		unitType: string;
		level: number;
		parentUnitId?: string;
		managerId?: string;
	};
	meta?: {
		resourceType: string;
		created: string;
		lastModified: string;
		location: string;
	};
}

class SCIMClient {
	private accessToken: string = '';
	private tokenExpiry: number = 0;

	/**
	 * Get OAuth 2.0 access token using client credentials grant
	 */
	async getAccessToken(): Promise<string> {
		// Return cached token if still valid (with 1 minute buffer)
		if (Date.now() < this.tokenExpiry) {
			console.log('✅ Using cached SCIM token');
			return this.accessToken;
		}

		const config = await getConfig();

		if (!config.clientId || !config.clientSecret) {
			throw new Error('SCIM not configured. Please set SCIM credentials in Settings.');
		}

		console.log('🔑 Requesting new SCIM token from:', `${config.baseUrl}/scim/v2/token`);
		console.log('   Client ID:', config.clientId);

		const response = await fetch(`${config.baseUrl}/scim/v2/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: config.clientId,
				client_secret: config.clientSecret
			})
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('❌ Token request failed:', response.status, error);
			throw new Error(`Failed to get access token (${response.status}): ${error}`);
		}

		const data: TokenResponse = await response.json();
		this.accessToken = data.access_token;
		// Set expiry with 1 minute buffer
		this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

		console.log('✅ SCIM token received, expires in:', data.expires_in, 'seconds');
		return this.accessToken;
	}

	/**
	 * Fetch all users from SSO using SCIM API
	 */
	async fetchUsers(options?: {
		filter?: string;
		startIndex?: number;
		count?: number;
	}): Promise<SCIMUser[]> {
		const config = await getConfig();
		const token = await this.getAccessToken();

		const params = new URLSearchParams();
		if (options?.filter) params.set('filter', options.filter);
		params.set('startIndex', (options?.startIndex || 1).toString());
		params.set('count', (options?.count || 1000).toString());

		const url = `${config.baseUrl}/scim/v2/Users?${params.toString()}`;

		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${token}`,
				'Accept': 'application/scim+json'
			}
		});

		if (!response.ok) {
			console.error(`URL:${url}\ntoken:${token}`,response);
			const error = await response.text();
			throw new Error(`Failed to fetch users: ${error}`);

		}

		const data: SCIMListResponse<SCIMUser> = await response.json();
		return data.Resources;
	}

	/**
	 * Fetch ALL users using pagination (handles more than 1000 users)
	 */
	async fetchAllUsers(options?: { filter?: string }): Promise<SCIMUser[]> {
		const allUsers: SCIMUser[] = [];
		const pageSize = 1000; // Max allowed by SCIM
		let startIndex = 1;
		let hasMore = true;

		console.log('📥 Fetching all users with pagination...');

		while (hasMore) {
			const users = await this.fetchUsers({
				filter: options?.filter,
				startIndex,
				count: pageSize
			});

			allUsers.push(...users);
			console.log(`   Fetched ${users.length} users (total: ${allUsers.length})`);

			// If we got less than pageSize, we've reached the end
			if (users.length < pageSize) {
				hasMore = false;
			} else {
				startIndex += pageSize;
			}
		}

		console.log(`✅ Fetched all ${allUsers.length} users`);
		return allUsers;
	}

	/**
	 * Fetch all groups (organizational units) from SSO using SCIM API
	 */
	async fetchGroups(options?: {
		filter?: string;
		startIndex?: number;
		count?: number;
	}): Promise<SCIMGroup[]> {
		const config = await getConfig();
		const token = await this.getAccessToken();

		const params = new URLSearchParams();
		if (options?.filter) params.set('filter', options.filter);
		params.set('startIndex', (options?.startIndex || 1).toString());
		params.set('count', (options?.count || 1000).toString());

		const url = `${config.baseUrl}/scim/v2/Groups?${params.toString()}`;

		console.log('📡 Fetching groups from:', url);
		console.log('   Token:', token);
		console.log('   Token length:', token.length);
		console.log('   Full Authorization header:', `Bearer ${token}`);

		// Test the token manually with curl command
		console.log('\n🧪 Test this token with curl:');
		console.log(`curl -s "${config.baseUrl}/scim/v2/Groups?startIndex=1&count=10" -H "Authorization: Bearer ${token}" -H "Accept: application/scim+json"\n`);

		const headers = {
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/scim+json'
		};

		console.log('   Headers being sent:', JSON.stringify(headers, null, 2));

		// Use undici for direct HTTP request (bypasses SvelteKit's fetch wrapper)
		const { statusCode, body } = await request(url, {
			method: 'GET',
			headers
		});

		console.log('📡 Groups response status:', statusCode);

		const responseText = await body.text();

		if (statusCode !== 200) {
			console.error('❌ Failed to fetch groups:', statusCode, responseText.substring(0, 200));
			throw new Error(`Failed to fetch groups: ${responseText}`);
		}

		const data: SCIMListResponse<SCIMGroup> = JSON.parse(responseText);
		console.log('✅ Fetched', data.Resources?.length || 0, 'groups');
		return data.Resources;
	}

	/**
	 * Fetch ALL groups using pagination (handles more than 1000 groups)
	 */
	async fetchAllGroups(options?: { filter?: string }): Promise<SCIMGroup[]> {
		const allGroups: SCIMGroup[] = [];
		const pageSize = 1000; // Max allowed by SCIM
		let startIndex = 1;
		let hasMore = true;

		console.log('📥 Fetching all groups with pagination...');

		while (hasMore) {
			const groups = await this.fetchGroups({
				filter: options?.filter,
				startIndex,
				count: pageSize
			});

			allGroups.push(...groups);
			console.log(`   Fetched ${groups.length} groups (total: ${allGroups.length})`);

			// If we got less than pageSize, we've reached the end
			if (groups.length < pageSize) {
				hasMore = false;
			} else {
				startIndex += pageSize;
			}
		}

		console.log(`✅ Fetched all ${allGroups.length} groups`);
		return allGroups;
	}

	/**
	 * Fetch single user by ID
	 */
	async fetchUser(userId: string): Promise<SCIMUser> {
		const config = await getConfig();
		const token = await this.getAccessToken();

		const response = await fetch(`${config.baseUrl}/scim/v2/Users/${userId}`, {
			headers: {
				'Authorization': `Bearer ${token}`,
				'Accept': 'application/scim+json'
			}
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to fetch user: ${error}`);
		}

		return await response.json();
	}

	/**
	 * Fetch single group by ID
	 */
	async fetchGroup(groupId: string): Promise<SCIMGroup> {
		const config = await getConfig();
		const token = await this.getAccessToken();

		const response = await fetch(`${config.baseUrl}/scim/v2/Groups/${groupId}`, {
			headers: {
				'Authorization': `Bearer ${token}`,
				'Accept': 'application/scim+json'
			}
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to fetch group: ${error}`);
		}

		return await response.json();
	}

	/**
	 * Test SCIM connection and credentials
	 */
	async testConnection(): Promise<{
		success: boolean;
		message: string;
		details?: any;
	}> {
		try {
			const config = await getConfig();
			const token = await this.getAccessToken();

			// Fetch service provider config to verify connection
			const response = await fetch(`${config.baseUrl}/scim/v2/ServiceProviderConfig`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Accept': 'application/scim+json'
				}
			});

			if (!response.ok) {
				return {
					success: false,
					message: 'Failed to connect to SCIM server'
				};
			}

			const providerConfig = await response.json();

			return {
				success: true,
				message: 'Successfully connected to Aksara SSO SCIM API',
				details: {
					supportsBulk: providerConfig.bulk?.supported,
					supportsFilter: providerConfig.filter?.supported,
					maxResults: providerConfig.filter?.maxResults
				}
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
}

// Export singleton instance
export const scimClient = new SCIMClient();

// Export types
export type { SCIMUser, SCIMGroup };
