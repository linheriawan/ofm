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
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
	return hasRole(user, 'admin') || hasRole(user, 'super_admin');
}

/**
 * Check if user is driver
 */
export function isDriver(user: AuthenticatedUser): boolean {
	return hasRole(user, 'driver');
}
