import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const DB_NAME = process.env.MONGODB_DB || 'ofm_dev';

async function fixDuplicateUsers() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		const db = client.db(DB_NAME);
		const usersCollection = db.collection('users');

		// Find all emails that have duplicates
		const duplicates = await usersCollection
			.aggregate([
				{
					$group: {
						_id: '$email',
						count: { $sum: 1 },
						docs: { $push: '$$ROOT' }
					}
				},
				{
					$match: { count: { $gt: 1 } }
				}
			])
			.toArray();

		console.log(`\n📊 Found ${duplicates.length} duplicate email(s)\n`);

		for (const dup of duplicates) {
			console.log(`\n🔍 Processing duplicates for: ${dup._id}`);
			console.log(`   Total records: ${dup.count}`);

			// Sort by createdAt (oldest first)
			const docs = dup.docs.sort((a: any, b: any) => {
				const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
				const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
				return aDate - bDate;
			});

			// Keep the first one (oldest), delete the rest
			const keepDoc = docs[0];
			const deleteIds = docs.slice(1).map((d: any) => d._id);

			console.log(`   Keeping: ${keepDoc._id} (created: ${keepDoc.createdAt || 'unknown'})`);
			console.log(`   Deleting: ${deleteIds.length} duplicate(s)`);

			// Merge data from newer records into the kept record
			const newerDoc = docs[docs.length - 1]; // Most recent record

			const updateData: any = {
				updatedAt: new Date()
			};

			// Merge fields from newer record if they exist
			if (newerDoc.ssoUserId && !keepDoc.ssoUserId) {
				updateData.ssoUserId = newerDoc.ssoUserId;
				console.log(`   ↪ Adding ssoUserId: ${newerDoc.ssoUserId}`);
			}
			if (newerDoc.firstName) {
				updateData.firstName = newerDoc.firstName;
				console.log(`   ↪ Updating firstName: ${newerDoc.firstName}`);
			}
			if (newerDoc.lastName) {
				updateData.lastName = newerDoc.lastName;
				console.log(`   ↪ Updating lastName: ${newerDoc.lastName}`);
			}
			if (newerDoc.phone) {
				updateData.phone = newerDoc.phone;
			}
			if (newerDoc.companyId) {
				updateData.companyId = newerDoc.companyId;
			}
			if (newerDoc.departmentId) {
				updateData.departmentId = newerDoc.departmentId;
			}
			if (newerDoc.positionId) {
				updateData.positionId = newerDoc.positionId;
			}
			if (newerDoc.managerId) {
				updateData.managerId = newerDoc.managerId;
			}
			if (newerDoc.roleIds && newerDoc.roleIds.length > 0) {
				updateData.roleIds = newerDoc.roleIds;
				console.log(`   ↪ Updating roleIds: ${newerDoc.roleIds.length} role(s)`);
			}

			// Update the kept record with merged data
			await usersCollection.updateOne({ _id: keepDoc._id }, { $set: updateData });
			console.log(`   ✅ Updated kept record with merged data`);

			// Delete duplicates
			const deleteResult = await usersCollection.deleteMany({ _id: { $in: deleteIds } });
			console.log(`   ✅ Deleted ${deleteResult.deletedCount} duplicate(s)`);
		}

		// Create unique indexes
		console.log('\n📇 Creating unique indexes...');

		try {
			await usersCollection.createIndex({ email: 1 }, { unique: true });
			console.log('   ✅ Created unique index on email');
		} catch (err) {
			console.log('   ⚠️  Email index already exists');
		}

		try {
			await usersCollection.createIndex(
				{ ssoUserId: 1 },
				{ unique: true, sparse: true } // sparse allows null/undefined values
			);
			console.log('   ✅ Created unique index on ssoUserId (sparse)');
		} catch (err) {
			console.log('   ⚠️  ssoUserId index already exists');
		}

		// Show final user count
		const totalUsers = await usersCollection.countDocuments();
		console.log(`\n📊 Final user count: ${totalUsers}`);

		// Show admin user info
		const adminUser = await usersCollection.findOne({ email: 'admin@ias.co.id' });
		if (adminUser) {
			console.log('\n👤 Admin user details:');
			console.log('   _id:', adminUser._id);
			console.log('   email:', adminUser.email);
			console.log('   ssoUserId:', adminUser.ssoUserId || '(not set)');
			console.log('   firstName:', (adminUser as any).firstName || '(not set)');
			console.log('   lastName:', (adminUser as any).lastName || '(not set)');
			console.log('   roleIds:', (adminUser as any).roleIds || (adminUser as any).roles);
		}
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await client.close();
		console.log('\n✅ Disconnected from MongoDB');
	}
}

fixDuplicateUsers();
