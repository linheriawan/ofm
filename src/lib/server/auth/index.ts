export interface AuthSession {
	userId: string;
	email: string;
	name?: string;

	// Employee info
	employeeId?: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	phone?: string;

	// Organization (Entitas)
	companyId?: string;
	companyName?: string;
	companyCode?: string;

	// Org Unit (Unit Kerja)
	orgUnitId?: string;
	orgUnitName?: string;
	orgUnitCode?: string;
	orgUnitType?: string;

	// Position
	positionId?: string;
	positionName?: string;
	positionCode?: string;
	positionLevel?: string;
	positionGrade?: string;

	// Work location
	workLocation?: string;
	region?: string;
	employmentType?: string;
	employmentStatus?: string;
	isRemote?: boolean;

	// Manager
	managerId?: string;

	// Roles
	roles: string[];
	ssoRoles?: string[];
}

// Permission checking helpers
export function hasPermission(session: AuthSession, permission: string): boolean {
	// TODO: Implement proper permission checking
	// For now, return true for development
	return true;
}

export function hasRole(session: AuthSession, role: string): boolean {
	return session.roles.includes(role);
}

export function isSuperAdmin(session: AuthSession): boolean {
	return session.roles.includes('super_admin');
}

export function isGlobalAdmin(session: AuthSession): boolean {
	return session.roles.includes('global_admin') || isSuperAdmin(session);
}

export function isRegionalAdmin(session: AuthSession): boolean {
	return session.roles.includes('regional_admin') || isGlobalAdmin(session);
}
