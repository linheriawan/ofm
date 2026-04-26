import { redirect, error, isRedirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getUserInfo } from '$lib/server/auth/oauth';
import { createSession, setSessionCookie } from '$lib/server/auth/session';
import { syncUserFromSSO } from '$lib/server/auth/sync';
import { getOAuthState, deleteOAuthState } from '$lib/server/auth/oauth-state';

export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	console.log('🔐 OAuth callback received');
	console.log('   Code:', code ? 'present' : 'missing');
	console.log('   State:', state);
	console.log('   Error:', errorParam);

	// Handle user cancellation gracefully
	if (errorParam) {
		if (errorParam === 'access_denied') {
			console.log('⚠️  User cancelled login');
			throw redirect(302, '/?cancelled=true');
		}
		console.error('❌ OAuth error:', errorParam);
		throw redirect(302, `/?error=${encodeURIComponent(errorParam)}`);
	}

	if (!code || !state) {
		console.error('❌ Missing OAuth parameters - code:', !!code, 'state:', !!state);
		throw redirect(302, '/?error=invalid_request');
	}

	console.log('🔐 Retrieving OAuth state from cookie');
	console.log('   State from URL:', state);

	const storedOAuthState = getOAuthState(cookies, state);

	console.log('   Stored state found:', storedOAuthState ? 'yes' : 'no');
	if (storedOAuthState) {
		console.log('   Stored state value:', storedOAuthState.state);
		console.log('   Stored redirect path:', storedOAuthState.redirectPath);
		console.log('   State match:', storedOAuthState.state === state);
	}

	if (!storedOAuthState) {
		throw error(400, 'Invalid or expired OAuth state');
	}

	// Delete the OAuth state cookie after successful validation
	deleteOAuthState(cookies);

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

		// Load user roles from OFM database
		console.log('🔐 Loading user roles...');
		const { connectDB } = await import('$lib/server/db/mongodb');
		const { ObjectId } = await import('mongodb');
		const db = await connectDB();

		let roleNames: string[] = [];
		if (user.roleIds && user.roleIds.length > 0) {
			const roleIds = user.roleIds.map((id: string) => new ObjectId(id));
			const roles = await db.collection('roles').find({ _id: { $in: roleIds } }).toArray();
			roleNames = roles.map(r => r.roleId); // Use roleId field instead of name
		}
		console.log('✅ User roles loaded:', roleNames);

		console.log('🔐 Creating session...');
		const sessionToken = await createSession(userInfo, tokens, user.companyId, roleNames);
		console.log('✅ Session created');

		setSessionCookie(event, sessionToken);
		console.log('✅ Session cookie set');

		console.log('✅ Authentication successful, redirecting to:', storedOAuthState.redirectPath);

		throw redirect(302, storedOAuthState.redirectPath || '/');
	} catch (err) {
		// Re-throw SvelteKit redirects — they are not errors
		if (isRedirect(err)) throw err;
		console.error('❌ OAuth callback error:', err);
		throw error(500, `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
