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
        await db.collection('trip_purposes').deleteMany({});

        // Seed Data
        console.log('🏢 Seeding Data...');
        const data = [
            {
                _id: new ObjectId(),
                purposeId: "TP-001",
                name: "Airport Transfer",
                category: "business",
                description: "Pick up or drop off at airport",
                requiresApproval:false,
                isActive:true,
                sortOrder:1,
                companyId:"default-company",
                createdAt:new Date(),
                updatedAt:new Date()
            },
            {
                _id: new ObjectId(),
                purposeId: "TP-008",
                name: "Government Office Visit",
                category: "official",
                description: "Visit government offices for official business",
                requiresApproval: true,
                isActive: true,
                sortOrder: 2,
                companyId: "default-company",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        await db.collection('trip_purposes').insertMany(data);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Summary:
- trip_purposes: ${data.length}
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
