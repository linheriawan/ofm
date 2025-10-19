import { getDB } from '$lib/server/db/mongodb';
import type { UserInfo } from './oauth';
import type { User } from '$lib/types';

export async function syncUserFromSSO(userInfo: UserInfo): Promise<User> {
	const db = getDB();
	const usersCollection = db.collection<User>('users');

	// Check for existing user by ssoUserId OR email
	const existingUser = await usersCollection.findOne({
		$or: [
			{ ssoUserId: userInfo.sub },
			{ email: userInfo.email }
		]
	});

	if (existingUser) {
		// Update existing user with latest SSO data
		await usersCollection.updateOne(
			{ _id: existingUser._id },
			{
				$set: {
					email: userInfo.email,
					username: userInfo.email.split('@')[0], // Use email prefix as username
					firstName: userInfo.firstName || existingUser.firstName,
					lastName: userInfo.lastName || existingUser.lastName,
					phone: userInfo.phone || existingUser.phone,
					companyId: userInfo.organizationId || existingUser.companyId,
					departmentId: userInfo.orgUnitId || existingUser.departmentId,
					positionId: userInfo.positionId || existingUser.positionId,
					managerId: userInfo.managerId || existingUser.managerId,
					updatedAt: new Date()
				}
			}
		);

		return {
			...existingUser,
			email: userInfo.email,
			username: userInfo.email.split('@')[0],
			firstName: userInfo.firstName || existingUser.firstName,
			lastName: userInfo.lastName || existingUser.lastName,
			phone: userInfo.phone || existingUser.phone,
			companyId: userInfo.organizationId || existingUser.companyId,
			departmentId: userInfo.orgUnitId || existingUser.departmentId,
			positionId: userInfo.positionId || existingUser.positionId,
			managerId: userInfo.managerId || existingUser.managerId,
			updatedAt: new Date()
		};
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
	const db = getDB();
	return await db.collection<User>('users').findOne({ ssoUserId });
}

export async function updateUserLastLogin(userId: string): Promise<void> {
	const db = getDB();
	await db.collection('users').updateOne(
		{ _id: userId },
		{
			$set: { lastLoginAt: new Date() }
		}
	);
}
