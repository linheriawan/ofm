import { MongoClient, Db, Collection } from 'mongodb';
import { env } from '$env/dynamic/private';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
	if (cachedClient && cachedDb) {
		return { client: cachedClient, db: cachedDb };
	}

	const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;
	const MONGODB_DB = env.MONGODB_DB || process.env.MONGODB_DB;

	if (!MONGODB_URI || !MONGODB_DB) {
		throw new Error('MONGODB_URI and MONGODB_DB must be set');
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
