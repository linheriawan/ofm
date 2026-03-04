import type { ObjectId } from 'mongodb';

/**
 * Company/Organization
 * Can be synced from SSO or managed manually
 */
export interface Company {
	_id: ObjectId;
	companyId: string; // Unique identifier (e.g., "IAS", "ORG001")
	companyName: string; // Full name (e.g., "PT. Infomedia Solusi Humanika")
	code?: string; // Short code (e.g., "IAS")
	email?: string;
	phone?: string;
	address?: string;
	parentCompanyId?: string; // For subsidiaries/holding structure
	ssoOrgId?: string; // Link to SSO organization._id for sync tracking
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	updatedBy?: string;
}

/**
 * Department/Organizational Unit
 * Represents divisions, departments, sections, etc.
 * Can be synced from SSO org_units or managed manually
 */
export interface Department {
	_id: ObjectId;
	departmentId: string; // Unique identifier
	departmentName: string; // Full name (e.g., "IT Division")
	code?: string; // Short code (e.g., "IT-DIV")
	type: 'directorate' | 'division' | 'department' | 'section' | 'unit' | 'other';
	parentDepartmentId?: string; // For hierarchical structure
	companyId: string; // Which company this belongs to
	level?: number; // Hierarchy level (1 = top level)
	ssoOrgUnitId?: string; // Link to SSO org_unit._id for sync tracking
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	updatedBy?: string;
}

/**
 * Position/Job Title
 * Can be synced from SSO or managed manually
 */
export interface Position {
	_id: ObjectId;
	positionId: string; // Unique identifier
	positionName: string; // Full name (e.g., "Senior Manager")
	code?: string; // Short code (e.g., "MGR-SR")
	level?: number; // Position level/grade (1-10)
	grade?: string; // Grade category (e.g., "A", "B", "C")
	companyId: string; // Which company this position belongs to
	ssoPositionId?: string; // Link to SSO position._id for sync tracking
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	createdBy?: string;
	updatedBy?: string;
}
