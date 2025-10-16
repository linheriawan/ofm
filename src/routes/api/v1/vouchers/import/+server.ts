import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { success, error as apiError, ErrorCode } from '$lib/server/api/response';
import { importVouchers } from '$lib/server/vouchers/import';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json(apiError(ErrorCode.UNAUTHORIZED, 'Authentication required'), { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const transportCompanyId = formData.get('transportCompanyId') as string;

		if (!file) {
			return json(apiError(ErrorCode.BAD_REQUEST, 'No file uploaded'), { status: 400 });
		}

		if (!transportCompanyId) {
			return json(apiError(ErrorCode.BAD_REQUEST, 'Transport company ID is required'), {
				status: 400
			});
		}

		// Read file content
		const csvContent = await file.text();

		// Determine provider from filename or company name
		const filename = file.name.toLowerCase();
		let provider = 'gojek';
		if (filename.includes('grab')) {
			provider = 'grab';
		}

		// Import vouchers
		const result = await importVouchers(
			csvContent,
			file.name,
			transportCompanyId,
			provider,
			user.userId,
			user.companyId || 'IAS'
		);

		if (!result.success) {
			return json(
				apiError(ErrorCode.BAD_REQUEST, result.errors.join(', '), { details: result }),
				{ status: 400 }
			);
		}

		return json(success(result), { status: 201 });
	} catch (err: any) {
		console.error('Error importing vouchers:', err);
		return json(apiError(ErrorCode.INTERNAL_ERROR, 'Failed to import vouchers'), { status: 500 });
	}
};
