import type { Cookies } from '@sveltejs/kit';

interface OAuthState {
	state: string;
	codeVerifier: string;
	redirectPath: string;
	createdAt: number;
}

const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

const OAUTH_STATE_COOKIE = 'oauth_state';

/**
 * Simple base64 encoding for OAuth state
 * We don't need heavy encryption since:
 * 1. Cookie is httpOnly (not accessible to JS)
 * 2. Cookie is secure in production (HTTPS only)
 * 3. State has built-in CSRF protection
 * 4. State expires in 10 minutes
 */
function encodeState(data: string): string {
	return Buffer.from(data, 'utf-8').toString('base64url');
}

function decodeState(encoded: string): string {
	return Buffer.from(encoded, 'base64url').toString('utf-8');
}

/**
 * Save OAuth state in a cookie
 * This persists across server restarts (important for dev mode with hot reload)
 */
export function saveOAuthState(
	cookies: Cookies,
	state: string,
	codeVerifier: string,
	redirectPath: string
): void {
	const oauthState: OAuthState = {
		state,
		codeVerifier,
		redirectPath,
		createdAt: Date.now()
	};

	const encoded = encodeState(JSON.stringify(oauthState));

	cookies.set(OAUTH_STATE_COOKIE, encoded, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: STATE_EXPIRY / 1000 // Convert to seconds
	});

	console.log('📝 OAuth state saved to cookie');
	console.log('   State:', state);
	console.log('   Redirect path:', redirectPath);
	console.log('   Encoded length:', encoded.length);
}

/**
 * Retrieve and validate OAuth state from cookie
 */
export function getOAuthState(cookies: Cookies, state: string): OAuthState | null {
	const encodedState = cookies.get(OAUTH_STATE_COOKIE);

	if (!encodedState) {
		console.log('❌ No OAuth state cookie found');
		console.log('   Available cookies:', Object.keys(cookies.getAll()));
		return null;
	}

	console.log('📦 OAuth state cookie found');
	console.log('   Length:', encodedState.length);

	try {
		const decoded = decodeState(encodedState);
		console.log('✅ Successfully decoded OAuth state');

		const stored: OAuthState = JSON.parse(decoded);

		console.log('🔍 OAuth state retrieved from cookie');
		console.log('   Expected state:', state);
		console.log('   Stored state:', stored.state);
		console.log('   State match:', stored.state === state);

		// Validate state matches
		if (stored.state !== state) {
			console.log('❌ State mismatch');
			return null;
		}

		// Check expiry
		const age = Date.now() - stored.createdAt;
		console.log('   State age (ms):', age);
		console.log('   Max age (ms):', STATE_EXPIRY);

		if (age > STATE_EXPIRY) {
			console.log('❌ OAuth state expired');
			return null;
		}

		console.log('✅ OAuth state validated successfully');
		return stored;
	} catch (error) {
		console.error('❌ Failed to decode OAuth state:', error);
		console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
		if (error instanceof Error) {
			console.error('   Error message:', error.message);
		}
		return null;
	}
}

/**
 * Delete OAuth state cookie after successful validation
 */
export function deleteOAuthState(cookies: Cookies): void {
	cookies.delete(OAUTH_STATE_COOKIE, {
		path: '/'
	});
	console.log('🗑️  OAuth state cookie deleted');
}
