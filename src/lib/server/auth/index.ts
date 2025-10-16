export interface AuthSession {
	userId: string;
	email: string;
	name?: string;
	companyId?: string;
	roles: string[];
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
