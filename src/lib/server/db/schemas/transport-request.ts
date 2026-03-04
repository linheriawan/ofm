/**
 * Transportation Request Schema
 * Handles both company car and voucher requests
 */

import { ObjectId } from 'mongodb';

export interface LocationInfo {
	address: string;
	latitude?: number;
	longitude?: number;
}

export interface TransportRequest {
	_id?: ObjectId;
	requestNumber: string; // Auto-generated: e.g., "TR-2025-001"
	companyId: string;
	type: 'company_car' | 'voucher';

	// Requester info
	requesterId: string; // User ID from auth
	requesterName: string;
	requesterEmail: string;
	requesterDepartment?: string;

	// Trip details
	pickup: LocationInfo;
	destination: LocationInfo;
	scheduledTime: Date;
	returnTime?: Date; // For round trips
	isRoundTrip: boolean;
	passengerCount: number;

	// Purpose
	purposeId?: string; // Reference to trip_purposes collection
	purpose: string; // Purpose text

	// Request status
	status: 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
	priority: 'low' | 'medium' | 'high' | 'urgent';

	// Company car specific
	vehicleId?: string; // Assigned vehicle
	vehicleName?: string; //  For display
	driverId?: string; // Assigned driver
	driverName?: string; // For display
	driverShouldWait?: boolean; // True if driver should wait for return

	// Voucher specific
	transportCompanyId?: string; // Reference to transport_companies collection
	voucherProvider?: string; // 'gojek', 'grab', etc.
	voucherCode?: string; // Allocated voucher code
	voucherAmount?: number; // Amount/value

	// Additional info
	specialRequirements?: string;
	notes?: string; // Admin notes

	// Approval workflow
	approvedBy?: string; // Admin user ID
	approvedByName?: string;
	approvedAt?: Date;
	rejectedBy?: string; // Admin user ID
	rejectedByName?: string;
	rejectedAt?: Date;
	rejectionReason?: string;

	// Assignment
	assignedBy?: string; // Admin who assigned driver/vehicle
	assignedByName?: string;
	assignedAt?: Date;

	// Trip tracking (for company car)
	actualPickupTime?: Date; // ATA - Actual Time of Arrival at pickup
	actualDropoffTime?: Date; // ATD - Actual Time of Departure from destination
	actualReturnTime?: Date; // For round trips
	route?: {
		coordinates: Array<{ lat: number; lng: number; timestamp: Date }>;
		distance?: number; // in km
		duration?: number; // in minutes
	};

	// Metadata
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date; // Soft delete

	// Audit trail
	history: Array<{
		action: string;
		performedBy: string;
		performedByName: string;
		timestamp: Date;
		details?: any;
	}>;
}

/**
 * Helper function to generate request number
 */
export function generateRequestNumber(lastNumber: number = 0): string {
	const year = new Date().getFullYear();
	const sequence = String(lastNumber + 1).padStart(4, '0');
	return `TR-${year}-${sequence}`;
}

/**
 * Helper function to create initial request from form data
 */
export function createRequestFromFormData(
	data: any,
	user: { id: string; name: string; email: string; department?: string },
	companyId: string,
	requestNumber: string
): Omit<TransportRequest, '_id'> {
	const now = new Date();

	return {
		requestNumber,
		companyId,
		type: data.type,

		// Requester
		requesterId: user.id,
		requesterName: user.name,
		requesterEmail: user.email,
		requesterDepartment: user.department,

		// Trip details
		pickup: data.pickup,
		destination: data.destination,
		scheduledTime: new Date(data.scheduledTime),
		returnTime: data.returnTime ? new Date(data.returnTime) : undefined,
		isRoundTrip: data.isRoundTrip || false,
		passengerCount: data.passengerCount || 1,

		// Purpose
		purposeId: data.purposeId,
		purpose: data.purpose,

		// Status
		status: 'pending',
		priority: data.priority || 'medium',

		// Company car specific
		driverShouldWait: data.driverShouldWait,

		// Voucher specific
		transportCompanyId: data.transportCompanyId,
		voucherProvider: data.voucherProvider,

		// Additional info
		specialRequirements: data.specialRequirements,

		// Metadata
		createdAt: now,
		updatedAt: now,

		// Audit trail
		history: [
			{
				action: 'request_created',
				performedBy: user.id,
				performedByName: user.name,
				timestamp: now,
				details: { type: data.type }
			}
		]
	};
}
