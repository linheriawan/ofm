import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay';
const MONGODB_DB = process.env.MONGODB_DB || 'ofm_dev';

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(MONGODB_DB);

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await db.collection('drivers').deleteMany({});

        // Seed Drivers
		console.log('👨‍✈️ Seeding drivers...');
		const drivers = [
			{
				_id: new ObjectId(),
				driverId: 'DRV-001',
				userId: 'USR-004',
				companyId: 'IAS',
				licenseNumber: 'SIM-12345678',
				licenseExpiry: new Date('2026-12-31'),
				status: 'available',
				locationId: 'LOC-CGK',
				rating: 4.8,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				driverId: 'DRV-002',
				userId: 'USR-005',
				companyId: 'IAS',
				licenseNumber: 'SIM-87654321',
				licenseExpiry: new Date('2027-06-30'),
				status: 'available',
				locationId: 'LOC-CGK',
				rating: 4.9,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('drivers').insertMany(drivers);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Summary:
- drivers: ${drivers.length}
        `);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await client.close();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the seeding
seedDatabase()
    .then(() => {
        console.log('🎉 Seeding process finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Seeding process failed:', error);
        process.exit(1);
    });
