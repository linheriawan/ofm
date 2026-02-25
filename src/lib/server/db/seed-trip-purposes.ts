/**
 * Seed default trip purposes
 * Run this once to initialize trip_purposes collection
 */

import { connectDB, collections } from './mongodb';
import type { TripPurpose } from './schemas';

export async function seedTripPurposes(companyId: string = 'IAS') {
	const db = await connectDB();
	const tripPurposesCollection = db.collection<TripPurpose>(collections.tripPurposes);

	// Check if already seeded
	const existingCount = await tripPurposesCollection.countDocuments({ companyId });
	if (existingCount > 0) {
		console.log(`Trip purposes already exist for company ${companyId}. Skipping seed.`);
		return { success: true, message: 'Already seeded', count: existingCount };
	}

	const defaultPurposes: Omit<TripPurpose, '_id'>[] = [
		{
			purposeId: 'TP-001',
			name: 'Airport Transfer',
			category: 'business',
			description: 'Pick up or drop off at airport',
			requiresApproval: false,
			isActive: true,
			sortOrder: 1,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-002',
			name: 'Client Meeting',
			category: 'business',
			description: 'Meeting with clients or partners',
			requiresApproval: false,
			isActive: true,
			sortOrder: 2,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-003',
			name: 'Site Visit',
			category: 'business',
			description: 'Visit project site or client location',
			requiresApproval: false,
			isActive: true,
			sortOrder: 3,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-004',
			name: 'Office Supplies',
			category: 'operational',
			description: 'Pick up office supplies or equipment',
			requiresApproval: false,
			isActive: true,
			sortOrder: 4,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-005',
			name: 'Bank/Post Office',
			category: 'operational',
			description: 'Banking or postal services',
			requiresApproval: false,
			isActive: true,
			sortOrder: 5,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-006',
			name: 'Document Delivery',
			category: 'operational',
			description: 'Deliver or collect documents',
			requiresApproval: false,
			isActive: true,
			sortOrder: 6,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-007',
			name: 'Training/Seminar',
			category: 'business',
			description: 'Attend training or seminar',
			requiresApproval: false,
			isActive: true,
			sortOrder: 7,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-008',
			name: 'Government Office Visit',
			category: 'official',
			description: 'Visit government offices for official business',
			requiresApproval: true,
			isActive: true,
			sortOrder: 8,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-009',
			name: 'Medical Emergency',
			category: 'other',
			description: 'Medical emergency or health-related',
			requiresApproval: false,
			isActive: true,
			sortOrder: 9,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			purposeId: 'TP-010',
			name: 'Business Lunch/Dinner',
			category: 'business',
			description: 'Business meal with clients or team',
			requiresApproval: false,
			isActive: true,
			sortOrder: 10,
			companyId,
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	const result = await tripPurposesCollection.insertMany(defaultPurposes);

	console.log(`✅ Seeded ${result.insertedCount} trip purposes for company ${companyId}`);

	return {
		success: true,
		message: 'Trip purposes seeded successfully',
		count: result.insertedCount
	};
}
