import supertokens from "supertokens-node";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import type { ProviderInput } from "supertokens-node/recipe/thirdparty/types";
import { ensureUserProfile } from "./user-profile";

const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI;
const apiDomain = process.env.SUPERTOKENS_API_DOMAIN ?? "http://localhost:3001";
const websiteDomain =
	process.env.SUPERTOKENS_WEBSITE_DOMAIN ?? "http://localhost:3001";

function thirdPartyProviders(): ProviderInput[] {
	const providers: ProviderInput[] = [];
	if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
		providers.push({
			config: {
				thirdPartyId: "google",
				clients: [
					{
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					},
				],
			},
		});
	}
	if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
		providers.push({
			config: {
				thirdPartyId: "github",
				clients: [
					{
						clientId: process.env.GITHUB_CLIENT_ID,
						clientSecret: process.env.GITHUB_CLIENT_SECRET,
					},
				],
			},
		});
	}
	return providers;
}

let initialized = false;

/**
 * Idempotent SuperTokens backend init. Next.js App Router has no single
 * server-bootstrap hook (especially in dev, across HMR), so this must be
 * called at the top of every server-side entry point that touches
 * supertokens-node: the auth API route, middleware.ts, and any route
 * handler / server component reading the session (lib/api.ts, the proxy
 * route).
 */
export function ensureSuperTokensInit(): void {
	if (initialized) return;
	if (!connectionURI) {
		throw new Error(
			"SUPERTOKENS_CONNECTION_URI is not set — see apps/dashboard/.env.example",
		);
	}

	supertokens.init({
		framework: "custom",
		supertokens: {
			connectionURI,
			apiKey: process.env.SUPERTOKENS_API_KEY,
		},
		appInfo: {
			appName: "Cheela",
			apiDomain,
			websiteDomain,
			apiBasePath: "/api/auth",
			websiteBasePath: "/sign-in",
		},
		recipeList: [
			EmailPassword.init({
				override: {
					functions: (original) => ({
						...original,
						signUp: async (input) => {
							const response = await original.signUp(input);
							if (response.status === "OK") {
								await ensureUserProfile(
									response.user.id,
									response.user.emails[0] ?? "",
								);
							}
							return response;
						},
					}),
				},
			}),
			ThirdParty.init({
				signInAndUpFeature: { providers: thirdPartyProviders() },
				override: {
					functions: (original) => ({
						...original,
						signInUp: async (input) => {
							const response = await original.signInUp(input);
							if (response.status === "OK") {
								await ensureUserProfile(
									response.user.id,
									response.user.emails[0] ?? "",
								);
							}
							return response;
						},
					}),
				},
			}),
			Session.init(),
		],
	});

	// Set only once init() has returned. Setting it beforehand meant a throw
	// here left the flag latched on, so every later request on the same warm
	// lambda took the early return above and failed somewhere downstream with
	// "not initialised" rather than the configuration error that caused it.
	initialized = true;
}
