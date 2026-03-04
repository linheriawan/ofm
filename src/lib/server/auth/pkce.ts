export function generateRandomString(length: number): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256(plain: string): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	return await crypto.subtle.digest('SHA-256', data);
}

export function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateCodeVerifier(): Promise<string> {
	return generateRandomString(64);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const hashed = await sha256(verifier);
	return base64UrlEncode(hashed);
}

export interface PKCEPair {
	codeVerifier: string;
	codeChallenge: string;
}

export async function generatePKCEPair(): Promise<PKCEPair> {
	const codeVerifier = await generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	return { codeVerifier, codeChallenge };
}
