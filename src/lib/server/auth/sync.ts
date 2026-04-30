import { connectDB } from '$lib/server/db/mongodb';
import { ObjectId } from 'mongodb';
import type { UserInfo } from './oauth';
import type { User } from '$lib/types';

export async function syncUserFromSSO(userInfo: UserInfo): Promise<User> {
	const db = await connectDB();
	const usersCollection = db.collection<User>('users');

	// Check for existing user by ssoUserId OR email
	const existingUser = await usersCollection.findOne({
		$or: [
			{ ssoUserId: userInfo.sub },
			{ email: userInfo.email }
		]
	});

	if (existingUser) {
		// Normalize legacy roleIds: seed data stored role name strings; we need ObjectId strings
		let normalizedRoleIds = existingUser.roleIds || [];
		const hasLegacyIds = normalizedRoleIds.some((id: string) => id && !ObjectId.isValid(id));
		if (hasLegacyIds) {
			const nameIds = normalizedRoleIds.filter((id: string) => !ObjectId.isValid(id));
			const foundRoles = await db.collection('roles').find({ roleId: { $in: nameIds } }).toArray();
			const nameToId = Object.fromEntries(foundRoles.map(r => [r.roleId, r._id.toString()]));
			normalizedRoleIds = normalizedRoleIds.map((id: string) =>
				ObjectId.isValid(id) ? id : (nameToId[id] || id)
			);
		}

		const updates = {
			email: userInfo.email,
			username: userInfo.email.split('@')[0],
			firstName: userInfo.firstName || existingUser.firstName,
			lastName: userInfo.lastName || existingUser.lastName,
			phone: userInfo.phone || existingUser.phone,
			companyId: userInfo.organizationId || existingUser.companyId,
			departmentId: userInfo.orgUnitId || existingUser.departmentId,
			positionId: userInfo.positionId || existingUser.positionId,
			managerId: userInfo.managerId || existingUser.managerId,
			roleIds: normalizedRoleIds,
			updatedAt: new Date()
		};

		await usersCollection.updateOne({ _id: existingUser._id }, { $set: updates });

		return { ...existingUser, ...updates };
	}

	// Assign super_admin role to admin@ias.co.id, otherwise employee role
	const isAdminUser = userInfo.email === 'admin@ias.co.id';
	const roleName = isAdminUser ? 'super_admin' : 'employee';
	const userRole = await db.collection('roles').findOne({ roleId: roleName });

	const newUser: Omit<User, '_id'> = {
		userId: userInfo.employeeId || userInfo.email.split('@')[0], // Use employeeId or email prefix
		email: userInfo.email,
		username: userInfo.email.split('@')[0],
		firstName: userInfo.firstName || userInfo.name || 'User',
		lastName: userInfo.lastName || '',
		phone: userInfo.phone,
		companyId: userInfo.organizationId || 'IAS',
		departmentId: userInfo.orgUnitId,
		positionId: userInfo.positionId,
		managerId: userInfo.managerId,
		ssoUserId: userInfo.sub,
		isActive: true,
		roleIds: userRole ? [userRole._id!.toString()] : [],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const result = await usersCollection.insertOne(newUser as User);

	return {
		...newUser,
		_id: result.insertedId
	} as User;
}

export async function getUserBySSOId(ssoUserId: string): Promise<User | null> {
	const db = await connectDB();
	return await db.collection<User>('users').findOne({ ssoUserId });
}

export async function updateUserLastLogin(userId: string): Promise<void> {
	const db = await connectDB();
	await db.collection('users').updateOne(
		{ _id: userId },
		{
			$set: { lastLoginAt: new Date() }
		}
	);
}
