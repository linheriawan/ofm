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

	// Transportation Module
	vehicles: 'vehicles',
	drivers: 'drivers',
	driverProfiles: 'driver_profiles',
	driverAvailability: 'driver_availability',
	driverShifts: 'driver_shifts',
	driverLocations: 'driver_locations',
	transportationRequests: 'transportation_requests',
	tripPurposes: 'trip_purposes',
	tripEvents: 'trip_events',
	transportCompanies: 'transport_companies',
	vouchers: 'vouchers',
	voucherAllocations: 'voucher_allocations',
	vehicleTracking: 'vehicle_tracking',
	obdData: 'obd_data',

	// Meeting Module
	meetingRooms: 'meeting_rooms',
	meetingRequests: 'meeting_requests',
	meetingAttendance: 'meeting_attendance',
	meetingLicenses: 'meeting_licenses',
	facilities: 'facilities',
	catering: 'catering',

	// Facility Request Module
	facilityRequests: 'facility_requests',
	facilityInventory: 'facility_inventory',

	// Event & External Venue Module
	externalVenues: 'external_venues',
	eventRequests: 'event_requests',

	// Master Data
	locations: 'locations',
	departments: 'departments',
	positions: 'positions'
} as const;
