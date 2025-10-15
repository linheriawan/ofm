import { MongoClient, Db, Collection } from 'mongodb';
import { MONGODB_URI, MONGODB_DB } from '$env/static/private';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
	if (cachedClient && cachedDb) {
		return { client: cachedClient, db: cachedDb };
	}

	const client = new MongoClient(MONGODB_URI);
	await client.connect();

	const db = client.db(MONGODB_DB);

	cachedClient = client;
	cachedDb = db;

	return { client, db };
}

export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
	const { db } = await connectToDatabase();
	return db.collection<T>(collectionName);
}

export async function disconnectFromDatabase() {
	if (cachedClient) {
		await cachedClient.close();
		cachedClient = null;
		cachedDb = null;
	}
}
