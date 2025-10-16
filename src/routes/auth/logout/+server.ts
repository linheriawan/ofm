import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession, clearSessionCookie } from '$lib/server/auth/session';
import { revokeToken } from '$lib/server/auth/oauth';

export const POST: RequestHandler = async (event) => {
	const session = await getSession(event.cookies.get('ofm_session'));

	if (session) {
		try {
			await revokeToken(session.tokens.refresh_token, 'refresh_token');
		} catch (error) {
			console.error('Token revocation failed:', error);
		}
	}

	clearSessionCookie(event);

	throw redirect(302, '/');
};

export const GET: RequestHandler = async (event) => {
	return POST(event);
};
