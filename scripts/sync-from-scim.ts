#!/usr/bin/env bun

/**
 * SCIM Synchronization Script
 *
 * Run this script manually or via cron to sync users and organizational units
 * from Aksara SSO to OFM local database.
 *
 * Usage:
 *   bun run scripts/sync-from-scim.ts
 *
 * Cron example (every 6 hours):
 *   0 */6 * * * cd /path/to/ofm && bun run scripts/sync-from-scim.ts >> /var/log/ofm-scim.log 2>&1
 */

import { performFullSync } from '../src/lib/server/scim/sync';

async function main() {
	console.log('═══════════════════════════════════════════════════════');
	console.log('  OFM SCIM Synchronization Script');
	console.log('═══════════════════════════════════════════════════════');
	console.log(`Started at: ${new Date().toISOString()}`);
	console.log('');

	try {
		const stats = await performFullSync();

		console.log('');
		console.log('═══════════════════════════════════════════════════════');
		console.log('✅ Synchronization Completed Successfully');
		console.log('═══════════════════════════════════════════════════════');
		console.log('📊 Summary:');
		console.log(`  Users:       ${stats.usersCreated} created, ${stats.usersUpdated} updated, ${stats.usersDeactivated} deactivated`);
		console.log(`  Org Units:   ${stats.orgUnitsCreated} created, ${stats.orgUnitsUpdated} updated`);
		console.log(`  Errors:      ${stats.errors.length}`);

		if (stats.errors.length > 0) {
			console.log('');
			console.log('⚠️ Errors:');
			stats.errors.forEach((error, index) => {
				console.log(`  ${index + 1}. ${error}`);
			});
		}

		console.log('');
		console.log(`Completed at: ${new Date().toISOString()}`);
		console.log('═══════════════════════════════════════════════════════');

		process.exit(0);
	} catch (error) {
		console.log('');
		console.log('═══════════════════════════════════════════════════════');
		console.log('❌ Synchronization Failed');
		console.log('═══════════════════════════════════════════════════════');
		console.error('Error:', error instanceof Error ? error.message : error);
		console.log('');
		console.log(`Failed at: ${new Date().toISOString()}`);
		console.log('═══════════════════════════════════════════════════════');

		process.exit(1);
	}
}

main();
