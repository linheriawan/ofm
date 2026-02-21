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
		await db.collection('users').deleteMany({});
		await db.collection('roles').deleteMany({});
		await db.collection('locations').deleteMany({});
		await db.collection('vouchers').deleteMany({});
		
		await db.collection('transportation_requests').deleteMany({});
		await db.collection('meeting_requests').deleteMany({});

		// Seed Locations
		console.log('📍 Seeding locations...');
		const locations = [
			{
				_id: new ObjectId(),
				locationId: 'LOC-CGK',
				companyId: 'IAS',
				locationName: 'Jakarta Office',
				address: 'Jl. Sudirman No. 123',
				city: 'Jakarta',
				province: 'DKI Jakarta',
				country: 'Indonesia',
				postalCode: '12190',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				locationId: 'LOC-SUB',
				companyId: 'IAS',
				locationName: 'Surabaya Office',
				address: 'Jl. Basuki Rahmat No. 456',
				city: 'Surabaya',
				province: 'Jawa Timur',
				country: 'Indonesia',
				postalCode: '60271',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('locations').insertMany(locations);

		// Seed Roles
		console.log('👥 Seeding roles...');
		const roles = [
			{
				_id: new ObjectId(),
				roleId: 'super_admin',
				roleName: 'Super Administrator',
				description: 'Full system access',
				permissions: ['*'],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roleId: 'admin',
				roleName: 'Administrator',
				description: 'Company administrator',
				permissions: ['transport.*', 'meeting.*', 'user.read'],
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roleId: 'employee',
				roleName: 'Employee',
				description: 'Regular employee',
				permissions: ['transport.request', 'meeting.book', 'user.read'],
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				roleId: 'driver',
				roleName: 'Driver',
				description: 'Company driver',
				permissions: ['transport.view', 'booking.update'],
				companyId: 'IAS',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('roles').insertMany(roles);

		// Seed Users
		console.log('👤 Seeding users...');
		const users = [
			{
				_id: new ObjectId(),
				userId: 'USR-001',
				email: 'admin@ias.co.id',
				username: 'admin',
				passwordHash: 'hashed_admin123',
				firstName: 'Admin',
				lastName: 'User',
				phone: '+62-811-1111-1111',
				companyId: 'IAS',
				roleIds: ['super_admin'],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				userId: 'USR-002',
				email: 'john.doe@ias.co.id',
				username: 'john.doe',
				passwordHash: 'hashed_password123',
				firstName: 'John',
				lastName: 'Doe',
				phone: '+62-811-2222-2222',
				companyId: 'IAS',
				roleIds: ['employee'],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				userId: 'USR-003',
				email: 'jane.smith@ias.co.id',
				username: 'jane.smith',
				passwordHash: 'hashed_password123',
				firstName: 'Jane',
				lastName: 'Smith',
				phone: '+62-811-3333-3333',
				companyId: 'IAS',
				roleIds: ['employee'],
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('users').insertMany(users);

		// Seed Vouchers
		console.log('🎫 Seeding vouchers...');
		const vouchers = [
			{
				_id: new ObjectId(),
				voucherId: 'VOUCH-GOJ-001',
				companyId: 'IAS',
				provider: 'gojek',
				voucherCode: 'GOJEK50K2024',
				amount: 50000,
				currency: 'IDR',
				expiryDate: new Date('2024-12-31'),
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				voucherId: 'VOUCH-GOJ-002',
				companyId: 'IAS',
				provider: 'gojek',
				voucherCode: 'GOJEK50K2025',
				amount: 50000,
				currency: 'IDR',
				expiryDate: new Date('2024-12-31'),
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				voucherId: 'VOUCH-GRAB-001',
				companyId: 'IAS',
				provider: 'grab',
				voucherCode: 'GRAB100K2024',
				amount: 100000,
				currency: 'IDR',
				expiryDate: new Date('2024-12-31'),
				status: 'available',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('vouchers').insertMany(vouchers);

		// Seed Transportation Requests
		console.log('🚗 Seeding transportation requests...');
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		const transportRequests = [
			{
				_id: new ObjectId(),
				requestNumber: 'TR-2025-001',
				companyId: 'IAS',
				type: 'company_car',
				userId: 'USR-002',
				userName: 'John Doe',
				userEmail: 'john.doe@ias.co.id',
				pickup: {
					address: 'Office Jakarta - Jl. Sudirman No. 123',
					latitude: -6.2088,
					longitude: 106.8456
				},
				destination: {
					address: 'Soekarno-Hatta International Airport',
					latitude: -6.1256,
					longitude: 106.6559
				},
				scheduledTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
				isRoundTrip: false,
				passengerCount: 2,
				purpose: 'Airport Transfer - Client Meeting',
				priority: 'high',
				status: 'pending',
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-002'
			},
			{
				_id: new ObjectId(),
				requestNumber: 'TR-2025-002',
				companyId: 'IAS',
				type: 'voucher',
				userId: 'USR-003',
				userName: 'Jane Smith',
				userEmail: 'jane.smith@ias.co.id',
				pickup: {
					address: 'Kemang Residence, Jakarta Selatan'
				},
				destination: {
					address: 'Office Jakarta - Jl. Sudirman No. 123'
				},
				scheduledTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 0),
				isRoundTrip: true,
				returnTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 30),
				passengerCount: 1,
				purpose: 'Daily Commute',
				priority: 'medium',
				voucherProvider: 'gojek',
				status: 'pending',
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-003'
			},
			{
				_id: new ObjectId(),
				requestNumber: 'TR-2025-003',
				companyId: 'IAS',
				type: 'company_car',
				userId: 'USR-002',
				userName: 'John Doe',
				userEmail: 'john.doe@ias.co.id',
				pickup: {
					address: 'Office Jakarta',
					latitude: -6.2088,
					longitude: 106.8456
				},
				destination: {
					address: 'Wisma BNI 46, Jakarta',
					latitude: -6.2093,
					longitude: 106.8233
				},
				scheduledTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
				isRoundTrip: false,
				passengerCount: 3,
				purpose: 'Client Meeting',
				priority: 'medium',
				driverShouldWait: true,
				status: 'approved',
				approvedBy: 'USR-001',
				approvedByName: 'Admin User',
				approvedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-002'
			},
			{
				_id: new ObjectId(),
				requestNumber: 'TR-2025-004',
				companyId: 'IAS',
				type: 'voucher',
				userId: 'USR-003',
				userName: 'Jane Smith',
				userEmail: 'jane.smith@ias.co.id',
				pickup: {
					address: 'Grand Indonesia Mall'
				},
				destination: {
					address: 'Office Jakarta'
				},
				scheduledTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 14, 0),
				isRoundTrip: false,
				passengerCount: 1,
				purpose: 'Return from Lunch Meeting',
				priority: 'low',
				voucherProvider: 'grab',
				status: 'approved',
				approvedBy: 'USR-001',
				approvedByName: 'Admin User',
				approvedAt: new Date(),
				voucherCode: 'GRAB100K2024',
				voucherAmount: 100000,
				assignedBy: 'USR-001',
				assignedByName: 'Admin User',
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-003'
			},
			{
				_id: new ObjectId(),
				requestNumber: 'TR-2025-005',
				companyId: 'IAS',
				type: 'company_car',
				userId: 'USR-002',
				userName: 'John Doe',
				userEmail: 'john.doe@ias.co.id',
				pickup: {
					address: 'Office Jakarta',
					latitude: -6.2088,
					longitude: 106.8456
				},
				destination: {
					address: 'Thamrin City',
					latitude: -6.1944,
					longitude: 106.8229
				},
				scheduledTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 30),
				isRoundTrip: true,
				returnTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0),
				passengerCount: 4,
				purpose: 'Team Building Event',
				priority: 'urgent',
				driverShouldWait: false,
				status: 'assigned',
				vehicleId: 'VEH-MPV-001',
				vehicleName: 'Toyota Alphard',
				driverId: 'DRV-001',
				driverName: 'Driver Budi',
				approvedBy: 'USR-001',
				approvedByName: 'Admin User',
				approvedAt: new Date(),
				assignedBy: 'USR-001',
				assignedByName: 'Admin User',
				assignedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-002'
			}
		];
		await db.collection('transportation_requests').insertMany(transportRequests);

		const meetingRequests = [
			{
				_id: new ObjectId(),
				requestNumber: 'MR-001',
				userId: 'USR-001',
				userName: 'John Doe',
				userEmail: 'john.doe@ias.co.id',
				companyId: 'IAS',
				title: 'Board Meeting',
				description: 'Monthly board meeting',
				type: 'offline',
				startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
				endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
				duration: 120,
				participantCount: 3,
				participants: ['USR-001', 'USR-002', 'USR-003'],
				roomId: 'ROOM-A301',
				cateringRequired: true,
				status: 'approved',
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-001'
			},
			{
				_id: new ObjectId(),
				requestNumber: 'MR-002',
				userId: 'USR-002',
				userName: 'Jane Smith',
				userEmail: 'jane.smith@ias.co.id',
				companyId: 'IAS',
				title: 'Team Sync',
				description: 'Weekly team synchronization',
				type: 'hybrid',
				startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
				endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0),
				duration: 60,
				participantCount: 2,
				participants: ['USR-002', 'USR-003'],
				roomId: 'ROOM-B102',
				platform: 'zoom',
				meetingLink: 'https://zoom.us/j/123456789',
				cateringRequired: false,
				status: 'approved',
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 'USR-002'
			}
		];
		await db.collection('meeting_requests').insertMany(meetingRequests);

		console.log('✅ Database seeding completed successfully!');
		console.log(`
📊 Summary:
- Companies: ${companies.length}
- Locations: ${locations.length}
- Roles: ${roles.length}
- Users: ${users.length}
- Vehicles: ${vehicles.length}
- Drivers: ${drivers.length}
- Meeting Rooms: ${meetingRooms.length}
- Vouchers: ${vouchers.length}
- Transport Requests: ${transportRequests.length}
- Transport Bookings (Old): ${transportBookings.length}
- Meeting Requests: ${meetingRequests.length}
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
