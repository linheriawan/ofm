import type { Handle } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/mongodb';
import { initializeSettings } from '$lib/server/settings';

// Initialize database connection on server startup
let dbInitialized = false;

async function initializeDB() {
	if (!dbInitialized) {
		try {
			await connectDB();
			// Initialize settings after DB connection
			await initializeSettings();
			dbInitialized = true;
			console.log('Database initialized successfully');
		} catch (error) {
			console.error('Failed to initialize database:', error);
		}
	}
}

// Initialize DB on startup
initializeDB();

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('ofm_session');

	// Session validation
	if (sessionCookie) {
		try {
			const { getSession, refreshSession, setSessionCookie } = await import('$lib/server/auth/session');
			let session = await getSession(sessionCookie);

			if (session) {
				const timeUntilExpiry = session.expiresAt - Date.now();
				const fifteenMinutes = 15 * 60 * 1000;

				// Auto-refresh if expiring soon
				if (timeUntilExpiry < fifteenMinutes && timeUntilExpiry > 0) {
					try {
						const newSessionToken = await refreshSession(session);
						setSessionCookie(event, newSessionToken);
						session = await getSession(newSessionToken);
					} catch (error) {
						console.error('Failed to refresh session:', error);
						event.locals.user = null;
					}
				}

				if (session) {
					event.locals.user = {
						userId: session.userId,
						email: session.email,
						name: session.name,

						// Employee info
						employeeId: session.employeeId,
						firstName: session.firstName,
						lastName: session.lastName,
						fullName: session.fullName,
						phone: session.phone,

						// Organization
						companyId: session.companyId,
						companyName: session.companyName,
						companyCode: session.companyCode,

						// Org Unit
						orgUnitId: session.orgUnitId,
						orgUnitName: session.orgUnitName,
						orgUnitCode: session.orgUnitCode,
						orgUnitType: session.orgUnitType,

						// Position
						positionId: session.positionId,
						positionName: session.positionName,
						positionCode: session.positionCode,
						positionLevel: session.positionLevel,
						positionGrade: session.positionGrade,

						// Work location
						workLocation: session.workLocation,
						region: session.region,
						employmentType: session.employmentType,
						employmentStatus: session.employmentStatus,
						isRemote: session.isRemote,

						// Manager
						managerId: session.managerId,

						// Roles
						roles: session.roles,
						ssoRoles: session.ssoRoles
					};
				}
			}
		} catch (error) {
			console.error('Session validation error:', error);
			event.locals.user = null;
		}
	}

	// Protected routes - redirect to login if not authenticated
	const pathname = event.url.pathname;
	const isAuthRoute = pathname.startsWith('/auth');
	const isDisplayRoute = pathname.startsWith('/display'); // Public route for room displays
	const isApiRoute = pathname.startsWith('/api');
	const isLoginPage = pathname === '/';

	// Define public routes
	const isPublicRoute = isAuthRoute || isDisplayRoute || isApiRoute || isLoginPage;

	// Redirect to login if accessing protected route without authentication
	if (!isPublicRoute && !event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: {
				location: '/'
			}
		});
	}

	const response = await resolve(event);
	return response;
};
