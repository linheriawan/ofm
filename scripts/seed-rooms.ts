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
        await db.collection('meeting_rooms').deleteMany({});

		// Seed Meeting Rooms
		console.log('🏢 Seeding meeting rooms...');
		const meetingRooms = [
			{
				_id: new ObjectId(),
				roomId: 'ROOM-A301',
				companyId: 'IAS',
				locationId: 'LOC-CGK',
				roomName: 'Board Room A-301',
				roomNumber: 'A-301',
				floor: '3',
				capacity: 20,
				roomType: 'boardroom',
				facilities: ['projector', 'whiteboard', 'video-conference', 'ac'],
				hasVideoConference: true,
				tabletDeviceId: 'TAB-A301',
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roomId: 'ROOM-A302',
				companyId: 'IAS',
				locationId: 'LOC-CGK',
				roomName: 'Conference Room A-302',
				roomNumber: 'A-302',
				floor: '3',
				capacity: 15,
				roomType: 'conference',
				facilities: ['projector', 'whiteboard', 'video-conference'],
				hasVideoConference: true,
				tabletDeviceId: 'TAB-A302',
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roomId: 'ROOM-B101',
				companyId: 'IAS',
				locationId: 'LOC-CGK',
				roomName: 'Meeting Room B-101',
				roomNumber: 'B-101',
				floor: '1',
				capacity: 10,
				roomType: 'meeting',
				facilities: ['tv', 'whiteboard'],
				hasVideoConference: false,
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roomId: 'ROOM-B102',
				companyId: 'IAS',
				locationId: 'LOC-CGK',
				roomName: 'Meeting Room B-102',
				roomNumber: 'B-102',
				floor: '1',
				capacity: 8,
				roomType: 'meeting',
				facilities: ['tv', 'whiteboard', 'video-conference'],
				hasVideoConference: true,
				tabletDeviceId: 'TAB-B102',
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roomId: 'ROOM-B205',
				companyId: 'IAS',
				locationId: 'LOC-CGK',
				roomName: 'Training Room B-205',
				roomNumber: 'B-205',
				floor: '2',
				capacity: 30,
				roomType: 'training',
				facilities: ['projector', 'whiteboard', 'video-conference', 'sound-system'],
				hasVideoConference: true,
				tabletDeviceId: 'TAB-B205',
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('meeting_rooms').insertMany(meetingRooms);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Summary:
- drivers: ${meetingRooms.length}
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
