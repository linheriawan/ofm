import type { ObjectId } from 'mongodb';

// Base types
export interface BaseDocument {
	_id: ObjectId;
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	updatedBy?: string;
}

// Organization
export interface Company extends BaseDocument {
	companyId: string;
	companyName: string;
	email?: string;
	phone?: string;
	address?: string;
	isActive: boolean;
	parentCompanyId?: string; // for subsidiaries
}

export interface OrganizationalUnit extends BaseDocument {
	companyId: string;
	unitId: string;
	unitName: string;
	parentUnitId?: string;
	level: number;
	unitType: 'directorate' | 'division' | 'department' | 'section';
	isActive: boolean;
}

export interface User extends BaseDocument {
	userId: string;
	email: string;
	username: string;
	passwordHash?: string; // optional when using SSO
	firstName: string;
	lastName: string;
	phone?: string;
	companyId: string;
	departmentId?: string;
	positionId?: string;
	roleIds: string[];
	isActive: boolean;
	lastLogin?: Date;
}

export interface Role extends BaseDocument {
	roleId: string;
	roleName: string;
	description?: string;
	permissions: string[];
	companyId?: string; // null for global roles
	isActive: boolean;
}

export interface Permission extends BaseDocument {
	permissionId: string;
	permissionName: string;
	module: 'transportation' | 'meeting' | 'admin' | 'global';
	action: 'create' | 'read' | 'update' | 'delete' | 'approve';
	resource: string;
	description?: string;
}

// Transportation
export interface Vehicle extends BaseDocument {
	vehicleId: string;
	companyId: string;
	licensePlate: string;
	vehicleType: 'sedan' | 'suv' | 'mpv' | 'bus' | 'van';
	brand: string;
	model: string;
	year: number;
	capacity: number;
	fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
	isElectric: boolean; // BYD EVs
	status: 'available' | 'in-use' | 'maintenance' | 'inactive';
	locationId?: string;
	hasGPS: boolean;
	hasOBD: boolean;
	arduinoDeviceId?: string;
}

export interface Driver extends BaseDocument {
	driverId: string;
	userId: string; // references User
	companyId: string;
	licenseNumber: string;
	licenseExpiry: Date;
	status: 'available' | 'on-duty' | 'off-duty' | 'on-leave';
	locationId?: string;
	rating?: number;
}

export interface TransportationRequest extends BaseDocument {
	requestId: string;
	requestorId: string; // user who requests
	companyId: string;
	requestType: 'voucher' | 'company-car';
	requestDate: Date;
	requestedFor: Date; // when transport is needed
	fromLocation: string;
	toLocation: string;
	purpose: string;
	numberOfPassengers: number;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
	approvedBy?: string;
	approvalDate?: Date;
	rejectionReason?: string;
	notes?: string;
}

export interface TransportationBooking extends BaseDocument {
	bookingId: string;
	requestId?: string;
	companyId: string;
	userId: string;
	vehicleId?: string;
	driverId?: string;
	bookingDate: Date;
	scheduledTime: Date;
	estimatedEndTime?: Date;
	actualStartTime?: Date;
	actualEndTime?: Date;
	fromLocation: string;
	toLocation: string;
	numberOfPassengers: number;
	status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
	distance?: number;
	duration?: number;
	notes?: string;
}

export interface Voucher extends BaseDocument {
	voucherId: string;
	companyId: string;
	provider: 'gojek' | 'grab' | 'uber' | 'other';
	voucherCode: string;
	amount: number;
	currency: string;
	expiryDate?: Date;
	status: 'available' | 'allocated' | 'used' | 'expired';
}

export interface VoucherAllocation extends BaseDocument {
	allocationId: string;
	voucherId: string;
	userId: string;
	companyId: string;
	requestId?: string;
	allocatedDate: Date;
	usedDate?: Date;
	status: 'allocated' | 'used' | 'returned';
}

export interface VehicleTracking extends BaseDocument {
	vehicleId: string;
	bookingId?: string;
	latitude: number;
	longitude: number;
	speed: number;
	heading: number;
	altitude?: number;
	accuracy?: number;
	timestamp: Date;
}

export interface OBDData extends BaseDocument {
	vehicleId: string;
	bookingId?: string;
	engineRPM?: number;
	vehicleSpeed?: number;
	engineTemp?: number;
	fuelLevel?: number;
	batteryVoltage?: number;
	batteryLevel?: number; // for EVs
	odometer?: number;
	engineLoad?: number;
	fuelConsumption?: number;
	timestamp: Date;
}

// Meeting Rooms
export interface MeetingRoom extends BaseDocument {
	roomId: string;
	companyId: string;
	locationId: string;
	roomName: string;
	roomNumber?: string;
	floor?: string;
	capacity: number;
	roomType: 'conference' | 'meeting' | 'boardroom' | 'training' | 'huddle';
	facilities: string[]; // projector, whiteboard, video-conf, etc
	hasVideoConference: boolean;
	tabletDeviceId?: string; // raspberry pi / tablet
	status: 'available' | 'occupied' | 'maintenance' | 'inactive';
	imageUrl?: string;
}

export interface MeetingBooking extends BaseDocument {
	bookingId: string;
	companyId: string;
	roomId?: string;
	organizerId: string;
	meetingTitle: string;
	meetingType: 'online' | 'offline' | 'hybrid';
	startTime: Date;
	endTime: Date;
	duration: number; // in minutes
	participants: string[]; // user IDs
	externalParticipants?: string[]; // email addresses
	meetingLink?: string; // for online/hybrid
	platform?: 'zoom' | 'google-meet' | 'teams' | 'other';
	status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';
	isRecurring: boolean;
	recurringPattern?: string; // daily, weekly, monthly
	recurringEndDate?: Date;
	facilities?: string[];
	cateringNeeded: boolean;
	cateringOrders?: string[];
	approvalRequired: boolean;
	approvedBy?: string;
	approvalDate?: Date;
	notes?: string;
}

export interface MeetingLicense extends BaseDocument {
	licenseId: string;
	companyId: string;
	platform: 'zoom' | 'google-meet' | 'teams' | 'other';
	licenseKey: string;
	maxParticipants: number;
	maxDuration: number; // in minutes
	status: 'active' | 'in-use' | 'expired' | 'inactive';
	expiryDate?: Date;
	purchaseDate: Date;
	cost: number;
	currency: string;
}

export interface Facility extends BaseDocument {
	facilityId: string;
	companyId: string;
	locationId: string;
	facilityName: string;
	facilityType: 'projector' | 'whiteboard' | 'microphone' | 'speaker' | 'camera' | 'other';
	quantity: number;
	available: number;
	status: 'available' | 'in-use' | 'maintenance' | 'inactive';
}

export interface CateringOrder extends BaseDocument {
	orderId: string;
	companyId: string;
	bookingId: string;
	orderDate: Date;
	deliveryTime: Date;
	items: CateringItem[];
	totalCost: number;
	currency: string;
	supplier?: string;
	status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
	notes?: string;
}

export interface CateringItem {
	itemName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface Attendance extends BaseDocument {
	attendanceId: string;
	bookingId: string;
	userId: string;
	checkInTime?: Date;
	checkOutTime?: Date;
	checkInMethod: 'qr' | 'nfc' | 'manual' | 'auto';
	status: 'present' | 'absent' | 'late';
}

// Master Data
export interface Location extends BaseDocument {
	locationId: string;
	companyId?: string; // null for global locations
	locationName: string;
	address: string;
	city: string;
	province?: string;
	country: string;
	postalCode?: string;
	latitude?: number;
	longitude?: number;
	isActive: boolean;
}

export interface Department extends BaseDocument {
	departmentId: string;
	companyId: string;
	departmentName: string;
	parentDepartmentId?: string;
	isActive: boolean;
}

export interface Position extends BaseDocument {
	positionId: string;
	companyId: string;
	positionName: string;
	level: number;
	isActive: boolean;
}

// Enums
export type UserRole = 'super_admin' | 'global_admin' | 'regional_admin' | 'department_admin' | 'employee' | 'driver';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export type BookingStatus = 'scheduled' | 'in-progress' | 'ongoing' | 'completed' | 'cancelled' | 'no-show';

export type VehicleStatus = 'available' | 'in-use' | 'maintenance' | 'inactive';

export type DriverStatus = 'available' | 'on-duty' | 'off-duty' | 'on-leave';
