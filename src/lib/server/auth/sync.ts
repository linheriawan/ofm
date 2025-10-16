import { getDB } from '$lib/server/db/mongodb';
import type { UserInfo } from './oauth';
import type { User } from '$lib/types';

export async function syncUserFromSSO(userInfo: UserInfo): Promise<User> {
	const db = getDB();
	const usersCollection = db.collection<User>('users');

	const existingUser = await usersCollection.findOne({ ssoUserId: userInfo.sub });

	if (existingUser) {
		await usersCollection.updateOne(
			{ _id: existingUser._id },
			{
				$set: {
					email: userInfo.email,
					name: userInfo.name || existingUser.name,
					emailVerified: userInfo.email_verified || existingUser.emailVerified,
					updatedAt: new Date()
				}
			}
		);

		return {
			...existingUser,
			email: userInfo.email,
			name: userInfo.name || existingUser.name,
			emailVerified: userInfo.email_verified || existingUser.emailVerified,
			updatedAt: new Date()
		};
	}

	const defaultRole = await db.collection('roles').findOne({ name: 'employee' });

	const newUser: Omit<User, '_id'> = {
		email: userInfo.email,
		name: userInfo.name || userInfo.email,
		ssoUserId: userInfo.sub,
		companyId: 'default-company',
		emailVerified: userInfo.email_verified || false,
		isActive: true,
		roles: defaultRole ? [defaultRole._id!.toString()] : [],
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
