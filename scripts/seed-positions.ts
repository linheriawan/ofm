import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const MONGODB_DB = process.env.MONGODB_DB || 'ofm_dev';

async function seedDatabase() {
	console.log('🌱 Starting positions seeding...');

	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		const db = client.db(MONGODB_DB);

		// Clear existing data
		console.log('🗑️  Clearing existing positions...');
		await db.collection('positions').deleteMany({});

		// Seed Positions
		console.log('🏢 Seeding positions...');
		const positions = [
			{
				_id: new ObjectId(),
				positionId: 'POS-001',
				positionName: 'Chief Executive Officer',
				code: 'CEO',
				level: 10,
				grade: 'A',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-002',
				positionName: 'Chief Technology Officer',
				code: 'CTO',
				level: 9,
				grade: 'A',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-003',
				positionName: 'Director',
				code: 'DIR',
				level: 8,
				grade: 'A',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-004',
				positionName: 'Senior Manager',
				code: 'MGR-SR',
				level: 7,
				grade: 'B',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-005',
				positionName: 'Manager',
				code: 'MGR',
				level: 6,
				grade: 'B',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-006',
				positionName: 'Assistant Manager',
				code: 'MGR-ASST',
				level: 5,
				grade: 'B',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-007',
				positionName: 'Supervisor',
				code: 'SPV',
				level: 4,
				grade: 'C',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-008',
				positionName: 'Senior Staff',
				code: 'STAFF-SR',
				level: 3,
				grade: 'C',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-009',
				positionName: 'Staff',
				code: 'STAFF',
				level: 2,
				grade: 'D',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				positionId: 'POS-010',
				positionName: 'Junior Staff',
				code: 'STAFF-JR',
				level: 1,
				grade: 'D',
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('positions').insertMany(positions);

		console.log('✅ Positions seeding completed successfully!');
		console.log(`
📊 Summary:
- Positions: ${positions.length}
		`);

	} catch (error) {
		console.error('❌ Error seeding positions:', error);
		throw error;
	} finally {
		await client.close();
		console.log('👋 Disconnected from MongoDB');
	}
}

// Run the seeding
seedDatabase()
	.then(() => {
		console.log('🎉 Positions seeding process finished');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Positions seeding process failed:', error);
		process.exit(1);
	});
