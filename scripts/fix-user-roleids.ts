import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const DB_NAME = process.env.MONGODB_DB || 'ofm_dev';

async function fixUserRoleIds() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		const db = client.db(DB_NAME);
		const usersCollection = db.collection('users');
		const rolesCollection = db.collection('roles');

		// Get all roles for mapping
		const roles = await rolesCollection.find().toArray();
		const roleMap = new Map();

		for (const role of roles) {
			roleMap.set(role.roleId, role._id.toString());
			console.log(`📋 Role: ${role.roleId} → ${role._id}`);
		}

		// Find all users with string roleIds (not ObjectId format)
		const users = await usersCollection.find().toArray();

		console.log(`\n👥 Found ${users.length} total users\n`);

		let fixedCount = 0;

		for (const user of users) {
			const roleIds = (user as any).roleIds || (user as any).roles || [];

			if (roleIds.length === 0) {
				console.log(`⚠️  User ${user.email}: No roles assigned`);
				continue;
			}

			// Check if roleIds are strings (roleId names) instead of ObjectIds
			const needsFix = roleIds.some((id: any) => {
				// If it's not a valid ObjectId format (24 hex chars), it needs fixing
				return typeof id === 'string' && !id.match(/^[0-9a-fA-F]{24}$/);
			});

			if (needsFix) {
				console.log(`🔧 Fixing user: ${user.email}`);
				console.log(`   Current roleIds:`, roleIds);

				// Convert string roleIds to ObjectId references
				const newRoleIds: string[] = [];

				for (const roleId of roleIds) {
					if (typeof roleId === 'string' && roleMap.has(roleId)) {
						// It's a roleId name like "super_admin"
						newRoleIds.push(roleMap.get(roleId));
						console.log(`   ↪ Mapped "${roleId}" → ${roleMap.get(roleId)}`);
					} else if (typeof roleId === 'string' && roleId.match(/^[0-9a-fA-F]{24}$/)) {
						// It's already an ObjectId string
						newRoleIds.push(roleId);
					} else {
						console.log(`   ⚠️  Unknown role: ${roleId}`);
					}
				}

				// Update user
				await usersCollection.updateOne(
					{ _id: user._id },
					{
						$set: {
							roleIds: newRoleIds,
							updatedAt: new Date()
						},
						$unset: { roles: "" } // Remove old "roles" field if it exists
					}
				);

				console.log(`   ✅ Updated roleIds:`, newRoleIds);
				fixedCount++;
			} else {
				console.log(`✓ User ${user.email}: roleIds already correct`);
			}
		}

		console.log(`\n📊 Fixed ${fixedCount} user(s)`);

		// Show admin user after fix
		const adminUser = await usersCollection.findOne({ email: 'admin@ias.co.id' });
		if (adminUser) {
			console.log('\n👤 Admin user after fix:');
			console.log('   email:', adminUser.email);
			console.log('   roleIds:', (adminUser as any).roleIds);
		}

	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await client.close();
		console.log('\n✅ Disconnected from MongoDB');
	}
}

fixUserRoleIds();
