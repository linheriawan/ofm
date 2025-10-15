import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/db/mongodb';
import { ObjectId } from 'mongodb';

export interface ListOptions {
	filter?: Record<string, any>;
	page?: number;
	limit?: number;
	sort?: Record<string, 1 | -1>;
}

/**
 * Generic list function for fetching paginated documents
 */
export async function listDocuments<T>(
	collectionName: string,
	options: ListOptions = {}
) {
	const {
		filter = {},
		page = 1,
		limit = 10,
		sort = { createdAt: -1 }
	} = options;

	const collection = await getCollection<T>(collectionName);

	const total = await collection.countDocuments(filter);
	const documents = await collection
		.find(filter)
		.sort(sort as any)
		.skip((page - 1) * limit)
		.limit(limit)
		.toArray();

	return {
		success: true,
		data: documents,
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit)
	};
}

/**
 * Generic get function for fetching a single document by ID
 */
export async function getDocument<T>(
	collectionName: string,
	id: string
) {
	const collection = await getCollection<T>(collectionName);
	const document = await collection.findOne({ _id: new ObjectId(id) } as any);

	if (!document) {
		return {
			success: false,
			error: 'Document not found',
			status: 404
		};
	}

	return {
		success: true,
		data: document
	};
}

/**
 * Generic create function for inserting a new document
 */
export async function createDocument<T extends Record<string, any>>(
	collectionName: string,
	data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>
) {
	const collection = await getCollection<T>(collectionName);

	const document = {
		...data,
		createdAt: new Date(),
		updatedAt: new Date()
	} as T;

	const result = await collection.insertOne(document as any);

	return {
		success: true,
		data: { _id: result.insertedId, ...document },
		message: 'Document created successfully',
		status: 201
	};
}

/**
 * Generic update function for updating a document by ID
 */
export async function updateDocument<T>(
	collectionName: string,
	id: string,
	data: Partial<T>
) {
	const collection = await getCollection<T>(collectionName);

	const updateData = {
		...data,
		updatedAt: new Date()
	};

	// Remove _id from update if present
	delete (updateData as any)._id;

	const result = await collection.updateOne(
		{ _id: new ObjectId(id) } as any,
		{ $set: updateData }
	);

	if (result.matchedCount === 0) {
		return {
			success: false,
			error: 'Document not found',
			status: 404
		};
	}

	return {
		success: true,
		message: 'Document updated successfully'
	};
}

/**
 * Generic delete function for deleting a document by ID
 */
export async function deleteDocument(
	collectionName: string,
	id: string
) {
	const collection = await getCollection(collectionName);
	const result = await collection.deleteOne({ _id: new ObjectId(id) });

	if (result.deletedCount === 0) {
		return {
			success: false,
			error: 'Document not found',
			status: 404
		};
	}

	return {
		success: true,
		message: 'Document deleted successfully'
	};
}

/**
 * Helper to build filters from URL search params
 */
export function buildFilterFromParams(searchParams: URLSearchParams, allowedFilters: string[]) {
	const filter: Record<string, any> = {};

	for (const key of allowedFilters) {
		const value = searchParams.get(key);
		if (value) {
			filter[key] = value;
		}
	}

	return filter;
}

/**
 * Helper to get pagination params from URL
 */
export function getPaginationParams(searchParams: URLSearchParams) {
	return {
		page: parseInt(searchParams.get('page') || '1'),
		limit: parseInt(searchParams.get('limit') || '10')
	};
}
