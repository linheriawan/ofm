import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const MONGODB_DB = 'ofm_dev';

async function checkUserRoles() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to OFM database\n');

		const db = client.db(MONGODB_DB);

		// Find all users
		const users = await db.collection('users').find({}).toArray();
		console.log('📊 Total users:', users.length);
		console.log('\nUsers:');
		users.forEach(user => {
			console.log(`  - ${user.email}: roles =`, user.roles);
		});

		// Check roles collection
		const roles = await db.collection('roles').find({}).toArray();
		console.log('\n📊 Total roles:', roles.length);
		console.log('\nRoles:');
		roles.forEach(role => {
			console.log(`  - ${role.name} (${role._id})`);
		});

	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await client.close();
	}
}

checkUserRoles();
