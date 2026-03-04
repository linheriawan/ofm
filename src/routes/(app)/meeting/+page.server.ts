import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to dashboard - overview sections are now integrated there
	throw redirect(302, '/');
};
