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
        await db.collection('vehicles').deleteMany({});

        // Seed Vehicles
		console.log('🚗 Seeding vehicles...');
		const vehicles = [
			{
				_id: new ObjectId(),
				vehicleId: 'VEH-SUV-001',
				companyId: 'IAS',
				licensePlate: 'B 1234 ABC',
				vehicleType: 'suv',
				brand: 'Toyota',
				model: 'Fortuner',
				year: 2023,
				capacity: 7,
				fuelType: 'diesel',
				isElectric: false,
				status: 'available',
				locationId: 'LOC-CGK',
				hasGPS: true,
				hasOBD: true,
				arduinoDeviceId: 'ARD-001',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				vehicleId: 'VEH-SED-001',
				companyId: 'IAS',
				licensePlate: 'B 5678 DEF',
				vehicleType: 'sedan',
				brand: 'Honda',
				model: 'Accord',
				year: 2022,
				capacity: 5,
				fuelType: 'gasoline',
				isElectric: false,
				status: 'available',
				locationId: 'LOC-CGK',
				hasGPS: true,
				hasOBD: true,
				arduinoDeviceId: 'ARD-002',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				vehicleId: 'VEH-MPV-001',
				companyId: 'IAS',
				licensePlate: 'B 9012 GHI',
				vehicleType: 'mpv',
				brand: 'Toyota',
				model: 'Alphard',
				year: 2023,
				capacity: 8,
				fuelType: 'gasoline',
				isElectric: false,
				status: 'available',
				locationId: 'LOC-CGK',
				hasGPS: true,
				hasOBD: true,
				arduinoDeviceId: 'ARD-003',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				vehicleId: 'VEH-EV-001',
				companyId: 'IAS',
				licensePlate: 'B 3456 JKL',
				vehicleType: 'suv',
				brand: 'BYD',
				model: 'Atto 3',
				year: 2024,
				capacity: 5,
				fuelType: 'electric',
				isElectric: true,
				status: 'available',
				locationId: 'LOC-CGK',
				hasGPS: true,
				hasOBD: false,
				arduinoDeviceId: 'ARD-004',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('vehicles').insertMany(vehicles);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Summary:
- vehicles: ${vehicles.length}
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
