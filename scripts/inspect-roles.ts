import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const MONGODB_DB = 'ofm_dev';

async function inspectRoles() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to OFM database\n');

		const db = client.db(MONGODB_DB);

		const roles = await db.collection('roles').find({}).toArray();
		console.log('📊 Total roles:', roles.length);
		console.log('\nRole documents:');
		roles.forEach(role => {
			console.log(JSON.stringify(role, null, 2));
		});

	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await client.close();
	}
}

inspectRoles();
