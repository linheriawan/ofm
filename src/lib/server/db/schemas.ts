/**
 * Database Schemas and TypeScript Types
 * Defines data structures for all collections
 */

import type { ObjectId } from 'mongodb';

// ============================================
// COMMON TYPES
// ============================================

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type TripStatus = 'scheduled' | 'started' | 'in_progress' | 'completed' | 'cancelled';
export type TransportType = 'company_car' | 'voucher';
export type FacilityType = 'atk' | 'equipment' | 'furniture' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface BaseDocument {
	_id?: ObjectId;
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	updatedBy?: string;
}

export interface Location {
	address: string;
	latitude?: number;
	longitude?: number;
	notes?: string;
}

// ============================================
// TRANSPORTATION MODULE
// ============================================

export interface TransportationRequest extends BaseDocument {
	requestNumber: string;
	type: TransportType;
	userId: string;
	userName: string;
	userEmail: string;
	companyId: string;
	departmentId?: string;

	// Trip details
	pickup: Location;
	destination: Location;
	scheduledTime: Date;
	returnTime?: Date; // For round trips
	isRoundTrip: boolean;
	passengerCount: number;
	passengers?: string[]; // Additional passenger emails

	// Request details
	purposeId?: string; // Link to TripPurpose master data
	purpose: string; // Can be from dropdown or free text
	priority: Priority;
	specialRequirements?: string; // Notes to driver/administrator
	needsDriver?: boolean; // true = with driver, false = self-drive
	driverShouldWait?: boolean; // true = wait for return, false = just drop

	// Status
	status: RequestStatus;
	approvedBy?: string;
	approvedAt?: Date;
	rejectionReason?: string;

	// Assignment (for company cars)
	vehicleId?: string;
	driverId?: string;
	driverType?: 'primary' | 'backup' | 'none'; // Track assignment type
	assignedAt?: Date;

	// Voucher details (if type is voucher)
	voucherCode?: string;
	voucherAmount?: number;
	voucherProvider?: string; // 'gojek' | 'grab'
	transportCompanyId?: string; // Link to TransportCompany
}

export interface TripPurpose extends BaseDocument {
	purposeId: string; // "TP-001"
	name: string; // "Airport Transfer", "Client Meeting", "Office Supplies"
	category: 'business' | 'operational' | 'official' | 'other';
	description?: string;
	requiresApproval: boolean; // Some purposes may require higher approval
	isActive: boolean;
	sortOrder: number; // For display ordering
	companyId: string;
}

export interface TripEvent extends BaseDocument {
	tripId: string;
	requestId: string;
	driverId: string;
	vehicleId: string;

	eventType: 'started' | 'arrived_pickup' | 'passenger_onboard' | 'arrived_destination' | 'completed';
	timestamp: Date;
	location?: Location;

	// ATA/ATD tracking
	scheduledTime?: Date;
	actualTime: Date;
	delayMinutes?: number;

	notes?: string;
	photos?: string[]; // URLs to photos
}

export interface DriverLocation extends BaseDocument {
	driverId: string;
	vehicleId?: string;
	tripId?: string;

	latitude: number;
	longitude: number;
	accuracy?: number;
	speed?: number;
	heading?: number;

	timestamp: Date;
	isOnDuty: boolean;
}

export interface DriverShift extends BaseDocument {
	driverId: string;
	shiftDate: Date;
	startTime: Date;
	endTime?: Date;
	status: 'on_duty' | 'off_duty' | 'break';
	totalHours?: number;
}

// ============================================
// MEETING MODULE
// ============================================

export interface MeetingRequest extends BaseDocument {
	requestNumber: string;
	userId: string;
	userName: string;
	userEmail: string;
	companyId: string;
	departmentId?: string;

	// Meeting details
	title: string;
	description?: string;
	type: 'online' | 'offline' | 'hybrid';
	startTime: Date;
	endTime: Date;
	duration: number; // minutes

	// Participants
	participantCount: number;
	participants: string[]; // emails
	externalParticipants?: number; // count of non-email participants

	// Room booking (for offline/hybrid)
	roomId?: string;
	locationId?: string;

	// Online meeting (for online/hybrid)
	platform?: 'zoom' | 'google_meet' | 'teams';
	meetingLink?: string;
	meetingId?: string;
	meetingPassword?: string;

	// Facilities
	requiredFacilities?: string[]; // projector, whiteboard, etc.
	cateringRequired?: boolean;
	cateringDetails?: {
		type: 'snack' | 'lunch' | 'dinner';
		itemCount: number;
		notes?: string;
	};

	// Status
	status: RequestStatus;
	approvedBy?: string;
	approvedAt?: Date;
	rejectionReason?: string;

	// Reminders
	reminderSent?: boolean;
	calendarInviteSent?: boolean;
}

export interface MeetingAttendance extends BaseDocument {
	meetingId: string;
	requestId: string;
	participantEmail: string;
	participantName?: string;

	checkedIn: boolean;
	checkInTime?: Date;
	checkInMethod?: 'tablet' | 'qr' | 'manual';
}

// ============================================
// FACILITY REQUEST MODULE (NEW)
// ============================================

export interface FacilityRequest extends BaseDocument {
	requestNumber: string;
	userId: string;
	userName: string;
	userEmail: string;
	companyId: string;
	departmentId?: string;

	// Request details
	type: FacilityType;
	category: string; // 'office_supplies', 'electronics', 'furniture'
	items: FacilityRequestItem[];

	// Delivery
	deliveryLocation: string;
	deliveryDate?: Date;
	urgency: Priority;

	// Justification
	purpose: string;
	notes?: string;

	// Status
	status: RequestStatus;
	approvedBy?: string;
	approvedAt?: Date;
	rejectionReason?: string;

	// Fulfillment
	fulfilledBy?: string;
	fulfilledAt?: Date;
	deliveredAt?: Date;
	receivedBy?: string;

	// Cost tracking
	estimatedCost?: number;
	actualCost?: number;
	purchaseOrderNumber?: string;
}

export interface FacilityRequestItem {
	itemName: string;
	itemCode?: string;
	quantity: number;
	unit: string; // 'pcs', 'box', 'pack', 'set'
	description?: string;
	estimatedPrice?: number;
}

export interface FacilityInventory extends BaseDocument {
	itemName: string;
	itemCode: string;
	category: string;
	type: FacilityType;

	// Stock
	currentStock: number;
	minimumStock: number;
	unit: string;

	// Tracking
	locationId: string;
	companyId: string;
	lastRestockDate?: Date;
	lastRestockQuantity?: number;

	// Cost
	unitPrice?: number;
	totalValue?: number;

	isActive: boolean;
}

// ============================================
// DRIVER MODULE
// ============================================

export interface DriverProfile extends BaseDocument {
	userId: string; // Link to SSO user
	employeeId: string;
	name: string;
	email: string;
	phone: string;
	companyId: string;

	// License
	licenseNumber: string;
	licenseType: string;
	licenseExpiry: Date;

	// Vehicle assignment
	assignedVehicleId?: string;

	// Status
	isActive: boolean;
	isOnDuty: boolean;
	currentLocation?: Location;
	lastLocationUpdate?: Date;

	// Stats
	totalTrips?: number;
	totalHours?: number;
	rating?: number;

	// Device
	deviceId?: string; // Android device ID for push notifications
	fcmToken?: string; // Firebase Cloud Messaging token
}

export interface DriverAvailability extends BaseDocument {
	driverId: string;
	date: Date;
	available: boolean;
	reason?: string; // 'leave', 'sick', 'training'
	shifts?: {
		start: string; // HH:mm
		end: string; // HH:mm
	}[];
}

// ============================================
// VEHICLE MODULE (NEW)
// ============================================

export interface Vehicle extends BaseDocument {
	vehicleId: string; // "VEH-001"
	plateNumber: string; // "B 1234 XYZ"
	brand: string; // "Toyota"
	model: string; // "Avanza"
	year: number;
	type: 'sedan' | 'suv' | 'mpv' | 'van' | 'bus';
	capacity: number; // passenger capacity
	color: string;

	// Driver Assignment
	primaryDriverId: string; // Permanent/main driver
	backupDriverIds: string[]; // Pool of backup drivers

	// Status
	status: 'available' | 'in_use' | 'maintenance' | 'retired';
	currentLocation?: Location;

	// Maintenance
	lastMaintenanceDate?: Date;
	nextMaintenanceDate?: Date;
	odometerReading?: number; // kilometers

	// Fuel/Energy
	fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
	fuelCardNumber?: string;

	// Insurance
	insuranceProvider?: string;
	insurancePolicyNumber?: string;
	insuranceExpiryDate?: Date;

	// Registration
	registrationNumber?: string;
	registrationExpiryDate?: Date;

	// Organization
	companyId: string;
	locationId: string;

	// Additional info
	notes?: string;
	photos?: string[]; // Vehicle photos
	isActive: boolean;
}

// ============================================
// VOUCHER MODULE (NEW)
// ============================================

export interface TransportCompany extends BaseDocument {
	companyId: string; // "TRANS-001"
	name: string; // "Gojek", "Grab"
	type: 'ride_hailing' | 'car_rental' | 'taxi';

	// Contact
	contactPerson?: string;
	contactPhone?: string;
	contactEmail?: string;

	// Contract
	contractNumber?: string;
	contractStartDate?: Date;
	contractEndDate?: Date;

	// Billing
	billingCycle?: 'weekly' | 'monthly' | 'quarterly';
	billingContactEmail?: string;

	// Status
	isActive: boolean; // Can be selected for new voucher requests
	notes?: string;

	// Organization
	companyId_org: string; // Link to our company
}

export interface Voucher extends BaseDocument {
	voucherCode: string; // "AISW8K93"
	transportCompanyId: string; // Link to TransportCompany
	provider: string; // "gojek" or "grab" (denormalized for quick filter)

	// Status
	status: 'available' | 'used' | 'expired';

	// Usage tracking
	usedAt?: Date;
	usedBy?: string; // Employee user ID
	requestId?: string; // Transportation request ID

	// Billing (no price upfront, filled during reconciliation)
	actualPrice?: number; // Filled from Gojek billing invoice
	billedAt?: Date; // When reconciled with invoice
	billingMonth: string; // "2025-09" for grouping
	invoiceNumber?: string; // Reference to provider's invoice

	// Import tracking
	importedAt: Date;
	importedBy?: string; // Admin who imported

	// Expiry
	expiryDate?: Date;

	// Organization
	companyId: string;

	// Notes
	notes?: string;
}

// ============================================
// EXTERNAL VENUE MODULE (NEW)
// ============================================

export interface ExternalVenue extends BaseDocument {
	venueId: string; // "VEN-001"
	name: string; // "Hotel Mulia - Ballroom A"
	type: 'hotel' | 'restaurant' | 'conference_center' | 'ballroom' | 'other';

	// Location
	address: string;
	city: string;
	district?: string;

	// Contact
	contactPerson: string;
	contactPhone: string;
	contactEmail: string;
	website?: string;

	// Capacity & Facilities
	capacity?: number; // Max people
	roomCount?: number; // For hotels with accommodation
	hasProjector?: boolean;
	hasWifi?: boolean;
	hasCatering?: boolean;
	hasAccommodation?: boolean; // For hotels
	hasParking?: boolean;
	facilities?: string[]; // ["sound_system", "stage", "ac"]

	// Pricing (reference only, actual negotiated per booking)
	estimatedPricePerDay?: number;
	estimatedPricePerHour?: number;
	roomRatePerNight?: number; // For accommodation

	// Rating & Review
	rating?: number;
	lastUsedDate?: Date;

	// Organization
	companyId: string;

	// Status
	isActive: boolean;
	isPreferred?: boolean; // Preferred vendor
	notes?: string;
	photos?: string[];
}

// ============================================
// EVENT REQUEST MODULE (NEW)
// ============================================

export type EventType = 'meeting' | 'training' | 'seminar' | 'workshop' | 'company_event' | 'conference';
export type VenueType = 'internal' | 'external';

export interface EventRequest extends BaseDocument {
	requestNumber: string; // "EV-20251016-0001"

	// Event Information
	eventTitle: string;
	eventType: EventType;
	description: string;

	// Dates
	startDate: Date;
	endDate: Date;
	duration: number; // Days

	// Organizer
	userId: string;
	userName: string;
	userEmail: string;
	companyId: string;
	departmentId?: string;

	// Venue Selection
	venueType: VenueType;

	// If internal venue
	internalRoomIds?: string[]; // Multiple rooms for large events

	// If external venue
	externalVenueId?: string; // Link to ExternalVenue master data
	venueName?: string; // If not in master data
	venueAddress?: string;
	venueCity?: string;
	venueContactPerson?: string;
	venueContactPhone?: string;

	// Participants
	participantCount: number;
	participantsFromOtherCities: number; // Needs accommodation
	participantList?: string[]; // Emails or names

	// Accommodation (for multi-city events)
	needsAccommodation: boolean;
	accommodationDetails?: {
		hotelName: string;
		hotelAddress?: string;
		checkInDate: Date;
		checkOutDate: Date;
		roomCount: number;
		roomType: string; // "Standard", "Deluxe", "Suite"
		roomRatePerNight?: number;
		estimatedTotalCost?: number;
		bookingConfirmationNumber?: string;
		notes?: string;
	};

	// Catering Requirements
	needsCatering: boolean;
	cateringDetails?: {
		breakfast?: number; // Pax count
		lunch?: number;
		dinner?: number;
		snacks?: number;
		coffeeBreak?: number;
		menuNotes?: string; // Dietary restrictions, preferences
		estimatedCostPerPerson?: number;
	};

	// Facilities & Equipment
	requiredFacilities: string[]; // ["projector", "sound_system", "stage", "microphone"]
	specialRequirements?: string;

	// Transportation for event
	needsTransportation?: boolean;
	transportationDetails?: {
		pickupLocation?: string;
		dropoffLocation?: string;
		vehicleType?: string;
		vehicleCount?: number;
	};

	// Budget
	estimatedBudget?: number; // Requested budget
	actualCost?: number; // Final actual cost
	costBreakdown?: {
		venue?: number;
		accommodation?: number;
		catering?: number;
		transportation?: number;
		facilities?: number;
		other?: number;
	};

	// Vendor & Invoice Management
	vendorInvoices?: {
		vendorName: string;
		invoiceNumber: string;
		amount: number;
		invoiceDate?: Date;
		paidAt?: Date;
		documentUrl?: string;
	}[];

	// Workflow & Status
	status: RequestStatus;
	approvedBy?: string;
	approvedAt?: Date;
	rejectionReason?: string;

	// GA Coordination
	gaNotes?: string; // Admin notes for event coordination
	venueBookingStatus?: 'pending' | 'contacted' | 'booked' | 'confirmed' | 'cancelled';
	accommodationBookingStatus?: 'pending' | 'contacted' | 'booked' | 'confirmed' | 'cancelled';

	// Post-event
	eventCompletedAt?: Date;
	attendanceCount?: number; // Actual attendance
	feedbackSummary?: string;

	// Priority
	priority: Priority;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate request number with prefix
 */
export function generateRequestNumber(prefix: string): string {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

	return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Calculate duration in minutes
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
	return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}
