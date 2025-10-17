import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import type { OAuthTokens, UserInfo } from './oauth';
import { refreshAccessToken, getUserInfo } from './oauth';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
	const SESSION_SECRET = env.SESSION_SECRET || process.env.SESSION_SECRET;
	if (!SESSION_SECRET) {
		throw new Error('SESSION_SECRET must be set');
	}

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(SESSION_SECRET),
		{ name: 'PBKDF2' },
		false,
		['deriveBits', 'deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: encoder.encode('ofm-session-salt'),
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

async function encrypt(data: string): Promise<string> {
	const key = await getKey();
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(data));

	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(encrypted), iv.length);

	return btoa(String.fromCharCode(...combined))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function decrypt(encryptedData: string): Promise<string> {
	const key = await getKey();
	const data = Uint8Array.from(
		atob(encryptedData.replace(/-/g, '+').replace(/_/g, '/')),
		(c) => c.charCodeAt(0)
	);

	const iv = data.slice(0, 12);
	const ciphertext = data.slice(12);

	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

	return decoder.decode(decrypted);
}

export interface SessionData {
	userId: string;
	email: string;
	name?: string;
	ssoUserId: string;
	companyId?: string;
	roles: string[];
	tokens: OAuthTokens;
	expiresAt: number;
}

export async function createSession(userInfo: UserInfo, tokens: OAuthTokens, companyId?: string): Promise<string> {
	const sessionData: SessionData = {
		userId: userInfo.sub,
		email: userInfo.email,
		name: userInfo.name,
		ssoUserId: userInfo.sub,
		companyId,
		roles: [],
		tokens,
		expiresAt: Date.now() + tokens.expires_in * 1000
	};

	return await encrypt(JSON.stringify(sessionData));
}

export async function getSession(sessionCookie: string | undefined): Promise<SessionData | null> {
	if (!sessionCookie) {
		return null;
	}

	try {
		const decrypted = await decrypt(sessionCookie);
		const session: SessionData = JSON.parse(decrypted);

		if (Date.now() > session.expiresAt) {
			return null;
		}

		return session;
	} catch (error) {
		console.error('Session decode error:', error);
		return null;
	}
}

export async function refreshSession(session: SessionData): Promise<string> {
	try {
		const newTokens = await refreshAccessToken(session.tokens.refresh_token);
		const userInfo = await getUserInfo(newTokens.access_token);

		session.tokens = newTokens;
		session.expiresAt = Date.now() + newTokens.expires_in * 1000;
		session.name = userInfo.name || session.name;

		return await encrypt(JSON.stringify(session));
	} catch (error) {
		console.error('Session refresh error:', error);
		throw error;
	}
}

export function setSessionCookie(event: RequestEvent, sessionToken: string): void {
	event.cookies.set('ofm_session', sessionToken, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30
	});
}

export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete('ofm_session', { path: '/' });
}
