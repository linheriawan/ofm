import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';
import type { Role } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const db = getDB();
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const search = url.searchParams.get('search') || '';
		const skip = (page - 1) * limit;

		const query: any = {};
		if (search) {
			query.$or = [
				{ roleId: { $regex: search, $options: 'i' } },
				{ roleName: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}

		const [roles, total] = await Promise.all([
			db.collection<Role>('roles')
				.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			db.collection('roles').countDocuments(query)
		]);

		return json({
			success: true,
			data: roles,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching roles:', error);
		return json(
			{
				success: false,
				error: { code: 'FETCH_ERROR', message: 'Failed to fetch roles' }
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const db = getDB();

		// Check if roleId already exists
		const existing = await db.collection('roles').findOne({ roleId: data.roleId });
		if (existing) {
			return json(
				{
					success: false,
					error: { code: 'DUPLICATE_ROLE', message: 'Role ID already exists' }
				},
				{ status: 400 }
			);
		}

		const newRole: Omit<Role, '_id'> = {
			roleId: data.roleId,
			roleName: data.roleName,
			description: data.description || '',
			permissions: data.permissions || [],
			companyId: data.companyId || undefined,
			isActive: data.isActive !== undefined ? data.isActive : true,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const result = await db.collection('roles').insertOne(newRole);

		return json({
			success: true,
			data: { _id: result.insertedId, ...newRole }
		});
	} catch (error) {
		console.error('Error creating role:', error);
		return json(
			{
				success: false,
				error: { code: 'CREATE_ERROR', message: 'Failed to create role' }
			},
			{ status: 500 }
		);
	}
};
