import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	return {
		ssoBaseUrl: env.SSO_ISSUER || 'http://localhost:5173'
	};
};
