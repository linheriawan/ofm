/**
 * Standardized API Response Utilities
 * Creates consistent response format across all API endpoints
 */

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: ApiError;
	meta?: ApiMeta;
}

export interface ApiError {
	code: string;
	message: string;
	details?: any;
}

export interface ApiMeta {
	page?: number;
	limit?: number;
	total?: number;
	timestamp?: string;
}

export interface PaginationParams {
	page: number;
	limit: number;
	skip: number;
}

/**
 * Success response helper
 */
export function success<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
	return {
		success: true,
		data,
		meta: {
			...meta,
			timestamp: new Date().toISOString()
		}
	};
}

/**
 * Error response helper
 */
export function error(code: string, message: string, details?: any): ApiResponse {
	return {
		success: false,
		error: {
			code,
			message,
			details
		},
		meta: {
			timestamp: new Date().toISOString()
		}
	};
}

/**
 * Parse pagination parameters from URL
 */
export function parsePagination(url: URL): PaginationParams {
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
	const skip = (page - 1) * limit;

	return { page, limit, skip };
}

/**
 * Create pagination meta
 */
export function createPaginationMeta(
	page: number,
	limit: number,
	total: number
): ApiMeta {
	return {
		page,
		limit,
		total,
		timestamp: new Date().toISOString()
	};
}

/**
 * Common API error codes
 */
export const ErrorCode = {
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	DUPLICATE_ERROR: 'DUPLICATE_ERROR',
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	BAD_REQUEST: 'BAD_REQUEST',
	CONFLICT: 'CONFLICT'
} as const;
