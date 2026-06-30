/**
 * API Authentication Middleware
 * Validates JWT tokens from Aksara SSO for API requests
 */

import type { RequestEvent } from '@sveltejs/kit';
import { error as apiError, ErrorCode } from './response';

export interface AuthenticatedUser {
	userId: string;
	email: string;
	name?: string;
	roles: string[];
	permissions?: string[]; // resolved from roles collection: 'employee' | 'driver' | 'admin'
	companyId?: string;
}

/**
 * Extract and validate Bearer token from Authorization header
 */
export function extractToken(request: Request): string | null {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	return authHeader.substring(7);
}

/**
 * Validate JWT token and get user info
 * For now, we'll use the session from cookies as fallback
 * TODO: Implement proper JWT validation for mobile apps
 */
export async function validateApiToken(event: RequestEvent): Promise<AuthenticatedUser | null> {
	// First, try to get token from Authorization header
	const token = extractToken(event.request);

	if (token) {
		// TODO: Validate JWT token from mobile apps
		// For now, return null to force session-based auth
		// This will be implemented when mobile apps are ready
	}

	// Fallback to session-based authentication (for web app)
	if (event.locals.user) {
		return event.locals.user as AuthenticatedUser;
	}

	return null;
}

/**
 * Require authentication middleware
 * Returns authenticated user or throws 401 error
 */
export async function requireAuth(event: RequestEvent): Promise<AuthenticatedUser> {
	const user = await validateApiToken(event);

	if (!user) {
		throw new Response(
			JSON.stringify(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required')),
			{
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	return user;
}

/**
 * Require specific role(s)
 */
export function requireRole(user: AuthenticatedUser, allowedRoles: string[]): void {
	const hasRole = user.roles.some(role => allowedRoles.includes(role));

	if (!hasRole) {
		throw new Response(
			JSON.stringify(apiError(ErrorCode.FORBIDDEN, 'Insufficient permissions')),
			{
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthenticatedUser, role: string): boolean {
	return user.roles.includes(role);
}

/**
 * Check if user has a specific granular permission (or the '*' wildcard).
 * Reads from user.permissions[] resolved by resolvePermissions() in hooks.server.ts.
 * Note: resolvePermissions() strips system-tier values ('admin','employee','driver')
 * from the UI-set permissions[] so they cannot be injected via the roles API.
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
	if (!user.permissions?.length) return false;
	return user.permissions.includes('*') || user.permissions.includes(permission);
}

export function isAdmin(user: AuthenticatedUser): boolean {
	if (user.permissions?.length) {
		// '*' — super admin wildcard, only grantable by existing super admins
		// 'admin' — system-tier value from singular `permission` field on system roles; never UI-injectable
		return user.permissions.includes('*') || user.permissions.includes('admin');
	}
	// Fallback for sessions not yet enriched with permissions
	return hasRole(user, 'super_admin') || hasRole(user, 'global_admin') ||
		hasRole(user, 'regional_admin') || hasRole(user, 'admin');
}

export function canApprove(user: AuthenticatedUser): boolean {
	return isAdmin(user);
}

export function isDriver(user: AuthenticatedUser): boolean {
	if (user.permissions) return user.permissions.includes('driver');
	return hasRole(user, 'driver');
}
