/**
 * API Validation Utilities
 * Input validation and sanitization helpers
 */

import { error, ErrorCode } from './response';

export interface ValidationError {
	field: string;
	message: string;
}

/**
 * Validate required fields
 */
export function validateRequired(data: any, fields: string[]): ValidationError[] {
	const errors: ValidationError[] = [];

	for (const field of fields) {
		if (!data[field] || data[field] === '') {
			errors.push({
				field,
				message: `${field} is required`
			});
		}
	}

	return errors;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate date format (ISO 8601)
 */
export function isValidDate(date: string): boolean {
	const parsedDate = new Date(date);
	return !isNaN(parsedDate.getTime());
}

/**
 * Validate ObjectId format
 */
export function isValidObjectId(id: string): boolean {
	return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(request: Request): Promise<T> {
	try {
		const body = await request.json();
		return body as T;
	} catch (err) {
		throw new Response(
			JSON.stringify(error(ErrorCode.BAD_REQUEST, 'Invalid JSON body')),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Throw validation error response
 */
export function throwValidationError(errors: ValidationError[]): never {
	throw new Response(
		JSON.stringify(error(ErrorCode.VALIDATION_ERROR, 'Validation failed', errors)),
		{
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
	return input.trim().replace(/[<>]/g, '');
}

/**
 * Parse boolean from query parameter
 */
export function parseBoolean(value: string | null): boolean | undefined {
	if (value === null) return undefined;
	return value === 'true' || value === '1';
}

/**
 * Parse enum value
 */
export function parseEnum<T extends string>(
	value: string | null,
	validValues: readonly T[]
): T | undefined {
	if (value === null) return undefined;
	if (validValues.includes(value as T)) {
		return value as T;
	}
	return undefined;
}
