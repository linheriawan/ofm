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
		await db.collection('users').deleteMany({});
		await db.collection('roles').deleteMany({});
		await db.collection('locations').deleteMany({});
		await db.collection('vehicles').deleteMany({});
		await db.collection('drivers').deleteMany({});
		await db.collection('meeting_rooms').deleteMany({});
		await db.collection('transportation_bookings').deleteMany({});
		await db.collection('meeting_bookings').deleteMany({});
		await db.collection('vouchers').deleteMany({});

		// Seed Companies
		console.log('🏢 Seeding companies...');
		const companies = [
			{
				_id: new ObjectId(),
				companyId: 'IAS',
				companyName: 'Indonesian Aviation Services',
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

		// Seed Sample Bookings
		console.log('📅 Seeding sample bookings...');
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const transportBookings = [
			{
				_id: new ObjectId(),
				bookingId: 'TRP-001',
				companyId: 'IAS',
				userId: 'USR-002',
				vehicleId: 'VEH-SUV-001',
				driverId: 'DRV-001',
				bookingDate: today,
				scheduledTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
				fromLocation: 'Office Jakarta',
				toLocation: 'Soekarno-Hatta Airport',
				numberOfPassengers: 2,
				status: 'scheduled',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				bookingId: 'TRP-002',
				companyId: 'IAS',
				userId: 'USR-003',
				vehicleId: 'VEH-SED-001',
				driverId: 'DRV-002',
				bookingDate: tomorrow,
				scheduledTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
				fromLocation: 'Home',
				toLocation: 'Office Jakarta',
				numberOfPassengers: 1,
				status: 'scheduled',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('transportation_bookings').insertMany(transportBookings);

		const meetingBookings = [
			{
				_id: new ObjectId(),
				bookingId: 'MTG-001',
				companyId: 'IAS',
				roomId: 'ROOM-A301',
				organizerId: 'USR-001',
				meetingTitle: 'Board Meeting',
				meetingType: 'offline',
				startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
				endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
				duration: 120,
				participants: ['USR-001', 'USR-002', 'USR-003'],
				status: 'scheduled',
				isRecurring: false,
				cateringNeeded: true,
				approvalRequired: false,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				_id: new ObjectId(),
				bookingId: 'MTG-002',
				companyId: 'IAS',
				roomId: 'ROOM-B102',
				organizerId: 'USR-002',
				meetingTitle: 'Team Sync',
				meetingType: 'hybrid',
				startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
				endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0),
				duration: 60,
				participants: ['USR-002', 'USR-003'],
				meetingLink: 'https://zoom.us/j/123456789',
				platform: 'zoom',
				status: 'scheduled',
				isRecurring: false,
				cateringNeeded: false,
				approvalRequired: false,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		];
		await db.collection('meeting_bookings').insertMany(meetingBookings);

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
- Transport Bookings: ${transportBookings.length}
- Meeting Bookings: ${meetingBookings.length}
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
