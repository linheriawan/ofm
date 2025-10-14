import { MongoClient, Db } from 'mongodb';
import { MONGODB_URI, MONGODB_DB } from '$env/static/private';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
	if (db) {
		return db;
	}

	try {
		client = new MongoClient(MONGODB_URI);
		await client.connect();
		db = client.db(MONGODB_DB);
		console.log('Connected to MongoDB Atlas');
		return db;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		throw error;
	}
}

export function getDB(): Db {
	if (!db) {
		throw new Error('Database not initialized. Call connectDB() first.');
	}
	return db;
}

export async function closeDB(): Promise<void> {
	if (client) {
		await client.close();
		console.log('MongoDB connection closed');
	}
}

// Collection names
export const collections = {
	// Organization
	companies: 'companies',
	organizationalUnits: 'organizational_units',
	users: 'users',
	roles: 'roles',
	permissions: 'permissions',

	// Transportation
	vehicles: 'vehicles',
	drivers: 'drivers',
	transportationRequests: 'transportation_requests',
	transportationBookings: 'transportation_bookings',
	vouchers: 'vouchers',
	voucherAllocations: 'voucher_allocations',
	vehicleTracking: 'vehicle_tracking',
	obd_data: 'obd_data',

	// Meeting Rooms
	meetingRooms: 'meeting_rooms',
	meetingBookings: 'meeting_bookings',
	meetingLicenses: 'meeting_licenses',
	facilities: 'facilities',
	catering: 'catering',
	attendance: 'attendance',

	// Master Data
	locations: 'locations',
	departments: 'departments',
	positions: 'positions'
} as const;
