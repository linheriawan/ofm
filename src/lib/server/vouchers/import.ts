/**
 * Voucher Import Utility
 * Parses Gojek/Grab CSV files and imports voucher codes
 */

import { getDB, collections } from '$lib/server/db/mongodb';
import type { Voucher } from '$lib/server/db/schemas';

export interface ImportResult {
	success: boolean;
	imported: number;
	duplicates: number;
	errors: string[];
	voucherCodes: string[];
}

/**
 * Parse voucher codes from CSV content
 * Gojek format: First 3 lines are template text, codes start from line 4
 */
export function parseVoucherCodes(csvContent: string): string[] {
	const lines = csvContent.split('\n').map(line => line.trim());
	const codes: string[] = [];

	// Skip first 3 lines (template text)
	for (let i = 3; i < lines.length; i++) {
		const line = lines[i];

		// Skip empty lines
		if (!line) continue;

		// Extract code (alphanumeric, typically 8 characters)
		// Format: AISW8K93 or similar
		const codeMatch = line.match(/^[A-Z0-9]{6,12}$/);
		if (codeMatch) {
			codes.push(codeMatch[0]);
		}
	}

	return codes;
}

/**
 * Extract billing month from filename
 * e.g., "gocorp_voucher_codes_20250926_0109.csv" -> "2025-09"
 */
export function extractBillingMonth(filename: string): string {
	const match = filename.match(/(\d{4})(\d{2})\d{2}/);
	if (match) {
		return `${match[1]}-${match[2]}`;
	}
	// Default to current month
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Import voucher codes to database
 */
export async function importVouchers(
	csvContent: string,
	filename: string,
	transportCompanyId: string,
	provider: string,
	importedBy: string,
	companyId: string
): Promise<ImportResult> {
	const result: ImportResult = {
		success: false,
		imported: 0,
		duplicates: 0,
		errors: [],
		voucherCodes: []
	};

	try {
		const db = getDB();
		const codes = parseVoucherCodes(csvContent);

		if (codes.length === 0) {
			result.errors.push('No valid voucher codes found in CSV');
			return result;
		}

		const billingMonth = extractBillingMonth(filename);
		const now = new Date();

		// Check for existing codes
		const existingCodes = await db
			.collection(collections.vouchers)
			.find({ voucherCode: { $in: codes } })
			.project({ voucherCode: 1 })
			.toArray();

		const existingCodeSet = new Set(existingCodes.map(v => (v as any).voucherCode));

		// Prepare vouchers to insert
		const vouchersToInsert: Voucher[] = [];

		for (const code of codes) {
			if (existingCodeSet.has(code)) {
				result.duplicates++;
				continue;
			}

			vouchersToInsert.push({
				voucherCode: code,
				transportCompanyId,
				provider: provider.toLowerCase(),
				status: 'available',
				billingMonth,
				importedAt: now,
				importedBy,
				companyId,
				createdAt: now,
				updatedAt: now
			});

			result.voucherCodes.push(code);
		}

		// Bulk insert
		if (vouchersToInsert.length > 0) {
			await db.collection(collections.vouchers).insertMany(vouchersToInsert);
			result.imported = vouchersToInsert.length;
		}

		result.success = true;
	} catch (error: any) {
		result.errors.push(error.message || 'Unknown error during import');
	}

	return result;
}

/**
 * Get voucher statistics
 */
export async function getVoucherStats(companyId: string) {
	const db = getDB();

	const [total, available, used, expired] = await Promise.all([
		db.collection(collections.vouchers).countDocuments({ companyId }),
		db.collection(collections.vouchers).countDocuments({ companyId, status: 'available' }),
		db.collection(collections.vouchers).countDocuments({ companyId, status: 'used' }),
		db.collection(collections.vouchers).countDocuments({ companyId, status: 'expired' })
	]);

	// Group by provider
	const byProvider = await db
		.collection(collections.vouchers)
		.aggregate([
			{ $match: { companyId } },
			{
				$group: {
					_id: '$provider',
					total: { $sum: 1 },
					available: {
						$sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
					},
					used: {
						$sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
					}
				}
			}
		])
		.toArray();

	return {
		total,
		available,
		used,
		expired,
		byProvider
	};
}

/**
 * Export used vouchers for reconciliation
 */
export async function exportUsedVouchers(
	companyId: string,
	billingMonth?: string,
	provider?: string
) {
	const db = getDB();

	const query: any = {
		companyId,
		status: 'used'
	};

	if (billingMonth) {
		query.billingMonth = billingMonth;
	}

	if (provider) {
		query.provider = provider.toLowerCase();
	}

	const vouchers = await db
		.collection(collections.vouchers)
		.find(query)
		.sort({ usedAt: 1 })
		.toArray();

	// Convert to CSV
	const headers = [
		'Voucher Code',
		'Provider',
		'Used At',
		'Used By',
		'Request ID',
		'Actual Price',
		'Billed At',
		'Invoice Number',
		'Billing Month'
	];

	const rows = vouchers.map((v: any) => [
		v.voucherCode,
		v.provider,
		v.usedAt ? new Date(v.usedAt).toISOString() : '',
		v.usedBy || '',
		v.requestId || '',
		v.actualPrice || '',
		v.billedAt ? new Date(v.billedAt).toISOString() : '',
		v.invoiceNumber || '',
		v.billingMonth
	]);

	const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

	return {
		csv,
		filename: `vouchers_${provider || 'all'}_${billingMonth || 'all'}_${Date.now()}.csv`,
		count: vouchers.length
	};
}
