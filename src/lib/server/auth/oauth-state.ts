interface OAuthState {
	state: string;
	codeVerifier: string;
	redirectPath: string;
	createdAt: number;
}

const stateStore = new Map<string, OAuthState>();

const STATE_EXPIRY = 10 * 60 * 1000;

export function saveOAuthState(state: string, codeVerifier: string, redirectPath: string): void {
	stateStore.set(state, {
		state,
		codeVerifier,
		redirectPath,
		createdAt: Date.now()
	});

	console.log('📝 OAuth state saved to store');
	console.log('   State:', state);
	console.log('   Redirect path:', redirectPath);
	console.log('   Total states in store:', stateStore.size);

	cleanExpiredStates();
}

export function getOAuthState(state: string): OAuthState | null {
	const stored = stateStore.get(state);

	if (!stored) {
		return null;
	}

	if (Date.now() - stored.createdAt > STATE_EXPIRY) {
		stateStore.delete(state);
		return null;
	}

	return stored;
}

export function deleteOAuthState(state: string): void {
	stateStore.delete(state);
}

function cleanExpiredStates(): void {
	const now = Date.now();
	for (const [key, value] of stateStore.entries()) {
		if (now - value.createdAt > STATE_EXPIRY) {
			stateStore.delete(key);
		}
	}
}
