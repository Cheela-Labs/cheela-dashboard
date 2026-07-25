import { MongoClient } from "mongodb";

export interface UserProfile {
	userId: string;
	email: string;
	createdAt: string;
	tier: "free" | "pro" | "enterprise";
}

let client: MongoClient | undefined;

function getClient(): MongoClient | undefined {
	const uri = process.env.MONGODB_URI;
	if (!uri) return undefined;
	if (!client) {
		client = new MongoClient(uri);
	}
	return client;
}

function getCollection() {
	const c = getClient();
	if (!c) return undefined;
	return c.db().collection<UserProfile>("users");
}

/** Creates the user's profile document on first sign-up/sign-in if it doesn't already exist. */
export async function ensureUserProfile(
	userId: string,
	email: string,
): Promise<void> {
	const collection = getCollection();
	if (!collection) return;

	try {
		await collection.updateOne(
			{ userId },
			{
				$setOnInsert: {
					userId,
					email,
					createdAt: new Date().toISOString(),
					tier: "free",
				},
			},
			{ upsert: true },
		);
	} catch (error) {
		// Profile storage is supplementary to auth — never block sign-in/sign-up on it.
		console.error("Failed to upsert user profile", error);
	}
}

export async function getUserProfile(
	userId: string,
): Promise<UserProfile | null> {
	const collection = getCollection();
	if (!collection) return null;
	return collection.findOne({ userId }, { projection: { _id: 0 } });
}
