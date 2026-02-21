import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildAuthorizationUrl } from '$lib/server/auth/oauth';
import { saveOAuthState } from '$lib/server/auth/oauth-state';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const redirectPath = url.searchParams.get('redirect') || '/';

	const { url: authUrl, state, codeVerifier } = await buildAuthorizationUrl(redirectPath);

	console.log('🔐 Login initiated');
	console.log('   Redirect path:', redirectPath);
	console.log('   State:', state);
	console.log('   Code verifier:', codeVerifier.substring(0, 20) + '...');

	saveOAuthState(cookies, state, codeVerifier, redirectPath);

	console.log('✅ OAuth state saved to cookie');

	throw redirect(302, authUrl);
};
