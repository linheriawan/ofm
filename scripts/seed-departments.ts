import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const MONGODB_DB = process.env.MONGODB_DB || 'ofm_dev';

async function seedDatabase() {
	console.log('🌱 Starting departments seeding...');

	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('✅ Connected to MongoDB');

		const db = client.db(MONGODB_DB);

		// Clear existing data
		console.log('🗑️  Clearing existing departments...');
		await db.collection('departments').deleteMany({});

		// Seed Departments
		console.log('🏢 Seeding departments...');
		const departments = [
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-001',
				departmentName: 'IT Division',
				code: 'IT-DIV',
				type: 'division',
				companyId: 'IAS',
				level: 1,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-002',
				departmentName: 'HR Division',
				code: 'HR-DIV',
				type: 'division',
				companyId: 'IAS',
				level: 1,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-003',
				departmentName: 'Finance Division',
				code: 'FIN-DIV',
				type: 'division',
				companyId: 'IAS',
				level: 1,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-004',
				departmentName: 'Operations Division',
				code: 'OPS-DIV',
				type: 'division',
				companyId: 'IAS',
				level: 1,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-005',
				departmentName: 'Software Development',
				code: 'IT-DEV',
				type: 'department',
				companyId: 'IAS',
				level: 2,
				parentDepartmentId: 'DEPT-001', // Under IT Division
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				departmentId: 'DEPT-006',
				departmentName: 'IT Infrastructure',
				code: 'IT-INFRA',
				type: 'department',
				companyId: 'IAS',
				level: 2,
				parentDepartmentId: 'DEPT-001', // Under IT Division
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('departments').insertMany(departments);

		console.log('✅ Departments seeding completed successfully!');
		console.log(`
📊 Summary:
- Departments: ${departments.length}
		`);

	} catch (error) {
		console.error('❌ Error seeding departments:', error);
		throw error;
	} finally {
		await client.close();
		console.log('👋 Disconnected from MongoDB');
	}
}

// Run the seeding
seedDatabase()
	.then(() => {
		console.log('🎉 Departments seeding process finished');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Departments seeding process failed:', error);
		process.exit(1);
	});
