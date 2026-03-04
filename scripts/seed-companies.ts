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
        await db.collection('companies').deleteMany({});

        // Seed Companies
        console.log('🏢 Seeding companies...');
        const companies = [
            {
                _id: new ObjectId(),
                companyId: 'IAS',
                companyName: 'Injourney Aviation Services',
                email: 'info@ias.co.id',
                phone: '+62-21-12345678',
                address: 'Jakarta, Indonesia',
                isActive: true,
                parentCompanyId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        await db.collection('companies').insertMany(companies);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Summary:
- Companies: ${companies.length}
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
