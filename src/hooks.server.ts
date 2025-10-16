import type { Handle } from '@sveltejs/kit';
import { connectDB } from '$lib/server/db/mongodb';

// Initialize database connection on server startup
let dbInitialized = false;

async function initializeDB() {
	if (!dbInitialized) {
		try {
			await connectDB();
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

	if (sessionCookie) {
		try {
			const { getSession, refreshSession, setSessionCookie } = await import('$lib/server/auth/session');
			let session = await getSession(sessionCookie);

			if (session) {
				const timeUntilExpiry = session.expiresAt - Date.now();
				const fifteenMinutes = 15 * 60 * 1000;

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
						companyId: session.companyId,
						roles: session.roles
					};
				}
			}
		} catch (error) {
			console.error('Session validation error:', error);
			event.locals.user = null;
		}
	}

	const response = await resolve(event);
	return response;
};
