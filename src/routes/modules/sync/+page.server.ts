import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	try {
		// Load SCIM configuration using the settings service (handles decryption)
		const { getSCIMConfig, isSCIMConfigured } = await import('$lib/server/settings');

		const scimConfig = await getSCIMConfig();
		const scimConfigured = await isSCIMConfigured();

		// Debug logging
		console.log('🔍 SCIM Configuration Check:');
		console.log('   baseUrl:', scimConfig.baseUrl ? '✅ SET' : '❌ NOT SET');
		console.log('   clientId:', scimConfig.clientId ? `✅ SET (${scimConfig.clientId.substring(0, 8)}...)` : '❌ NOT SET');
		console.log('   clientSecret:', scimConfig.clientSecret ? '✅ SET' : '❌ NOT SET');
		console.log('   scimConfigured:', scimConfigured);

		// Only try to connect if configured
		if (!scimConfigured) {
			console.log('❌ SCIM not configured, returning early');
			return {
				scimConfigured: false,
				connectionStatus: {
					success: false,
					message: 'SCIM not configured. Configure it in Admin Settings'
				},
				lastSync: null,
				lastSyncStatus: 'never' as const,
				lastSyncStats: undefined,
				lastSyncError: undefined
			};
		}

		console.log('✅ SCIM is configured, proceeding to test connection...');

		// Dynamically import SCIM modules only if configured
		const { scimClient } = await import('$lib/server/scim/client');
		const { getLastSyncInfo } = await import('$lib/server/scim/sync');

		// Test SCIM connection
		const connectionTest = await scimClient.testConnection();
		console.log('   Connection test result:', connectionTest.success ? '✅ SUCCESS' : '❌ FAILED');

		// Get last sync info
		const lastSyncInfo = await getLastSyncInfo();

		return {
			scimConfigured: true,
			connectionStatus: connectionTest,
			lastSync: lastSyncInfo.lastSync?.toISOString() || null,
			lastSyncStatus: lastSyncInfo.status,
			lastSyncStats: lastSyncInfo.stats,
			lastSyncError: lastSyncInfo.error
		};
	} catch (error) {
		console.error('❌ Failed to load sync page:', error);

		// Try to check if configured using settings service
		const { isSCIMConfigured } = await import('$lib/server/settings');
		const configured = await isSCIMConfigured();

		return {
			scimConfigured: configured,
			connectionStatus: {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to connect'
			},
			lastSync: null,
			lastSyncStatus: 'never' as const,
			lastSyncStats: undefined,
			lastSyncError: undefined
		};
	}
};

export const actions: Actions = {
	sync: async () => {
		try {
			console.log('🔄 Manual sync triggered');

			// Dynamically import sync module
			const { performFullSync } = await import('$lib/server/scim/sync');
			const stats = await performFullSync();

			return {
				success: true,
				stats,
				message: 'Synchronization completed successfully'
			};
		} catch (error) {
			console.error('Sync failed:', error);
			return fail(500, {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				message: 'Synchronization failed'
			});
		}
	}
};
