// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthSession } from '$lib/server/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: AuthSession;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
