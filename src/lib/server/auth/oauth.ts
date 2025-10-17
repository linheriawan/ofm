import { env } from '$env/dynamic/private';
import { generatePKCEPair, generateRandomString } from './pkce';

// Runtime environment variables with fallbacks
const SSO_AUTHORIZATION_URL = env.SSO_AUTHORIZATION_URL || process.env.SSO_AUTHORIZATION_URL || '';
const SSO_TOKEN_URL = env.SSO_TOKEN_URL || process.env.SSO_TOKEN_URL || '';
const SSO_USERINFO_URL = env.SSO_USERINFO_URL || process.env.SSO_USERINFO_URL || '';
const SSO_CLIENT_ID = env.SSO_CLIENT_ID || process.env.SSO_CLIENT_ID || '';
const SSO_CLIENT_SECRET = env.SSO_CLIENT_SECRET || process.env.SSO_CLIENT_SECRET || '';
const SSO_REDIRECT_URI = env.SSO_REDIRECT_URI || process.env.SSO_REDIRECT_URI || '';
const SSO_SCOPES = env.SSO_SCOPES || process.env.SSO_SCOPES || 'openid email profile';

export interface OAuthTokens {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	id_token?: string;
}

export interface UserInfo {
	sub: string;
	email: string;
	name?: string;
	email_verified?: boolean;
}

export async function buildAuthorizationUrl(redirectPath: string = '/'): Promise<{
	url: string;
	state: string;
	codeVerifier: string;
}> {
	const { codeVerifier, codeChallenge } = await generatePKCEPair();
	const state = generateRandomString(32);

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: SSO_CLIENT_ID,
		redirect_uri: SSO_REDIRECT_URI,
		scope: SSO_SCOPES,
		state: `${state}:${redirectPath}`,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256'
	});

	const url = `${SSO_AUTHORIZATION_URL}?${params.toString()}`;

	return { url, state, codeVerifier };
}

export async function exchangeCodeForTokens(
	code: string,
	codeVerifier: string
): Promise<OAuthTokens> {
	const params = {
		grant_type: 'authorization_code',
		code,
		client_id: SSO_CLIENT_ID,
		client_secret: SSO_CLIENT_SECRET,
		redirect_uri: SSO_REDIRECT_URI,
		code_verifier: codeVerifier
	};

	console.log('🔐 Token exchange request:', {
		url: SSO_TOKEN_URL,
		...params,
		client_secret: '***'
	});

	const response = await fetch(SSO_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams(params)
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ Token exchange failed:', response.status, errorText);
		throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
	}

	const tokens = await response.json();
	console.log('✅ Token exchange successful');
	return tokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
	const response = await fetch(SSO_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: SSO_CLIENT_ID,
			client_secret: SSO_CLIENT_SECRET
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
	}

	return await response.json();
}

export async function getUserInfo(accessToken: string): Promise<UserInfo> {
	const response = await fetch(SSO_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to fetch user info: ${response.status} ${errorText}`);
	}

	return await response.json();
}

export async function revokeToken(token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'refresh_token'): Promise<void> {
	const revokeUrl = SSO_TOKEN_URL.replace('/token', '/revoke');

	await fetch(revokeUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			token,
			token_type_hint: tokenTypeHint,
			client_id: SSO_CLIENT_ID,
			client_secret: SSO_CLIENT_SECRET
		})
	});
}
