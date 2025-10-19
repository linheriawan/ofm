/**
 * Sync all employees from SSO to OFM
 * This ensures all employees (including managers) exist in OFM users collection
 */

import { MongoClient } from 'mongodb';

const SSO_MONGODB_URI = 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const SSO_DB_NAME = 'aksara_sso';

const OFM_MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const OFM_DB_NAME = process.env.MONGODB_DB || 'ofm_dev';

async function syncEmployees() {
	const ssoClient = new MongoClient(SSO_MONGODB_URI);
	const ofmClient = new MongoClient(OFM_MONGODB_URI);

	try {
		await Promise.all([ssoClient.connect(), ofmClient.connect()]);
		console.log('✅ Connected to both databases');

		const ssoDb = ssoClient.db(SSO_DB_NAME);
		const ofmDb = ofmClient.db(OFM_DB_NAME);

		const ssoEmployees = ssoDb.collection('employees');
		const ofmUsers = ofmDb.collection('users');
		const ofmRoles = ofmDb.collection('roles');

		// Get default employee role
		const employeeRole = await ofmRoles.findOne({ roleId: 'employee' });
		if (!employeeRole) {
			throw new Error('Employee role not found in OFM database');
		}

		// Fetch all active employees from SSO
		const employees = await ssoEmployees
			.find({ isActive: true })
			.toArray();

		console.log(`\n📊 Found ${employees.length} active employees in SSO\n`);

		let createdCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;

		for (const emp of employees) {
			if (!emp.email) {
				console.log(`⚠️  Skipping employee ${emp.employeeId}: no email`);
				skippedCount++;
				continue;
			}

			// Check if user already exists in OFM (by email or ssoUserId)
			const existingUser = await ofmUsers.findOne({
				$or: [
					{ email: emp.email },
					{ ssoUserId: emp.userId }
				]
			});

			const userData = {
				userId: emp.employeeId || emp.email.split('@')[0],
				email: emp.email,
				username: emp.email.split('@')[0],
				firstName: emp.firstName || emp.fullName?.split(' ')[0] || 'User',
				lastName: emp.lastName || emp.fullName?.split(' ').slice(1).join(' ') || '',
				phone: emp.phone,
				companyId: emp.organizationId || 'IAS',
				departmentId: emp.orgUnitId,
				positionId: emp.positionId,
				managerId: emp.managerId, // Will need to map this to OFM user._id later
				ssoUserId: emp.userId,
				isActive: emp.isActive !== false,
				updatedAt: new Date()
			};

			if (existingUser) {
				// Update existing user with SSO data
				await ofmUsers.updateOne(
					{ _id: existingUser._id },
					{ $set: userData }
				);
				console.log(`✓ Updated: ${emp.email}`);
				updatedCount++;
			} else {
				// Create new user
				const newUser = {
					...userData,
					roleIds: [employeeRole._id.toString()],
					createdAt: new Date()
				};

				await ofmUsers.insertOne(newUser as any);
				console.log(`+ Created: ${emp.email}`);
				createdCount++;
			}
		}

		console.log(`\n📊 Sync Summary:`);
		console.log(`   Created: ${createdCount}`);
		console.log(`   Updated: ${updatedCount}`);
		console.log(`   Skipped: ${skippedCount}`);
		console.log(`   Total: ${createdCount + updatedCount + skippedCount}`);

		// Now fix managerId references
		console.log(`\n🔧 Fixing manager references...`);

		// Build a map of ssoUserId → OFM user._id
		const allOfmUsers = await ofmUsers.find().toArray();
		const ssoToOfmMap = new Map();

		for (const user of allOfmUsers) {
			if ((user as any).ssoUserId) {
				ssoToOfmMap.set((user as any).ssoUserId, user._id.toString());
			}
		}

		// Update all users to have correct managerId (OFM user._id instead of SSO userId)
		let managerFixCount = 0;

		for (const user of allOfmUsers) {
			const currentManagerId = (user as any).managerId;

			if (currentManagerId && ssoToOfmMap.has(currentManagerId)) {
				// managerId is currently SSO userId, convert to OFM user._id
				const ofmManagerId = ssoToOfmMap.get(currentManagerId);

				await ofmUsers.updateOne(
					{ _id: user._id },
					{ $set: { managerId: ofmManagerId } }
				);

				managerFixCount++;
			}
		}

		console.log(`   Fixed ${managerFixCount} manager references`);

		console.log(`\n✅ Sync complete!`);

	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await Promise.all([ssoClient.close(), ofmClient.close()]);
		console.log('\n✅ Disconnected from databases');
	}
}

syncEmployees();
