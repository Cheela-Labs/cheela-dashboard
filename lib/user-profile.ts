import { MongoClient } from "mongodb";

/**
 * Shape of a document in the shared `users` collection.
 *
 * The **server** owns `tier`, `subscriptionStatus`, and `currentPeriodEnd` —
 * it is the only writer of those once the row exists. This file only ever seeds
 * a new row at sign-up, via `$setOnInsert`, so the two sides cannot fight.
 */
export interface UserProfile {
	userId: string;
	email: string;
	createdAt: string;
	tier: "free" | "pro" | "enterprise";
	subscriptionStatus: "none" | "active" | "past_due" | "cancelled";
	/** ISO timestamp, or null when there is no paid period. */
	currentPeriodEnd: string | null;
}

/**
 * Cached on globalThis, not in module scope.
 *
 * Next.js re-evaluates a module on every hot reload, so a module-scoped client
 * leaks its whole connection pool on each edit — the well-known way to exhaust
 * a local Mongo during a long session. In production this simply reuses one
 * pool per instance.
 */
const globalForMongo = globalThis as typeof globalThis & {
	__cheelaMongo?: MongoClient;
};

function getClient(): MongoClient | undefined {
	const uri = process.env.MONGODB_URI;
	if (!uri) return undefined;
	globalForMongo.__cheelaMongo ??= new MongoClient(uri, { maxPoolSize: 10 });
	return globalForMongo.__cheelaMongo;
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
					subscriptionStatus: "none",
					currentPeriodEnd: null,
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

/**
 * The tier to actually show, which is not the same as the stored one.
 *
 * The server never reads `tier` directly — it goes through `effectiveTier`,
 * because a stored "pro" outlives its `currentPeriodEnd` and there is no
 * recurring billing to renew it. Reading the raw field here meant the dashboard
 * displayed **Pro** for a lapsed subscription while every API call it made was
 * enforced as **free**: exactly the multi-store tier drift the server
 * consolidated away.
 *
 * Kept identical to `apps/server/src/domain/users/effective-tier.ts` on purpose.
 * If these ever need to differ, something is wrong with one of them.
 */
export function effectiveTier(
	profile: Pick<UserProfile, "tier" | "currentPeriodEnd"> | null,
	now = new Date(),
): UserProfile["tier"] {
	if (!profile) return "free";
	if (profile.tier === "free" || profile.tier === "enterprise") {
		return profile.tier;
	}
	if (!profile.currentPeriodEnd) return "free";
	return new Date(profile.currentPeriodEnd) > now ? profile.tier : "free";
}
