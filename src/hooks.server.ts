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
	// Add session/auth logic here later
	// event.locals.session = await getSession(event.cookies);

	const response = await resolve(event);
	return response;
};
