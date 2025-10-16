import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getUserInfo } from '$lib/server/auth/oauth';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { syncUserFromSSO } from '$lib/server/auth/sync';
import { getOAuthState, deleteOAuthState } from '$lib/server/auth/oauth-state';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	console.log('🔐 OAuth callback received');
	console.log('   Code:', code ? 'present' : 'missing');
	console.log('   State:', state);
	console.log('   Error:', errorParam);

	if (errorParam) {
		throw error(400, `SSO authentication failed: ${errorParam}`);
	}

	if (!code || !state) {
		throw error(400, 'Missing code or state parameter');
	}

	const [stateValue, redirectPath] = state.split(':');

	console.log('🔐 Retrieving OAuth state from server-side store');
	console.log('   State value from URL:', stateValue);
	console.log('   Redirect path from URL:', redirectPath);

	const storedOAuthState = getOAuthState(stateValue);

	console.log('   Stored state found:', storedOAuthState ? 'yes' : 'no');
	if (storedOAuthState) {
		console.log('   Stored state value:', storedOAuthState.state);
		console.log('   Stored redirect path:', storedOAuthState.redirectPath);
		console.log('   State match:', storedOAuthState.state === stateValue);
	}

	if (!storedOAuthState) {
		throw error(400, 'Invalid or expired OAuth state');
	}

	if (storedOAuthState.state !== stateValue) {
		throw error(400, 'State mismatch');
	}

	deleteOAuthState(stateValue);

	try {
		console.log('🔐 Exchanging code for tokens...');
		const tokens = await exchangeCodeForTokens(code, storedOAuthState.codeVerifier);
		console.log('✅ Tokens received');

		console.log('🔐 Fetching user info...');
		const userInfo = await getUserInfo(tokens.access_token);
		console.log('✅ User info received:', userInfo.email);

		console.log('🔐 Syncing user from SSO:', userInfo.email);
		const user = await syncUserFromSSO(userInfo);
		console.log('✅ User synced:', user.email);

		console.log('🔐 Creating session...');
		const sessionToken = await createSession(userInfo, tokens, user.companyId);
		console.log('✅ Session created');

		setSessionCookie({ cookies } as any, sessionToken);
		console.log('✅ Session cookie set');

		console.log('✅ Authentication successful, redirecting to:', storedOAuthState.redirectPath);

		throw redirect(302, storedOAuthState.redirectPath || '/');
	} catch (err) {
		console.error('❌ OAuth callback error:', err);
		// Re-throw redirect errors
		if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
			throw err;
		}
		throw error(500, `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
