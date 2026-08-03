import supertokens from "supertokens-node";
import AccountLinking from "supertokens-node/recipe/accountlinking";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import EmailVerification from "supertokens-node/recipe/emailverification";
import Session from "supertokens-node/recipe/session";
import ThirdParty from "supertokens-node/recipe/thirdparty";
import type { ProviderInput } from "supertokens-node/recipe/thirdparty/types";
import { sendEmail, verificationEmail } from "./email";
import { ensureUserProfile } from "./user-profile";

const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI;
const apiDomain = process.env.SUPERTOKENS_API_DOMAIN ?? "http://localhost:3001";
const websiteDomain =
	process.env.SUPERTOKENS_WEBSITE_DOMAIN ?? "http://localhost:3001";

/**
 * Refuses to email a link nobody outside this machine can open.
 *
 * SuperTokens builds the verification link from `appInfo.websiteDomain` —
 * never from the incoming request — so if `SUPERTOKENS_WEBSITE_DOMAIN` is
 * unset the link is `http://localhost:3001/...`, and the mail sends
 * successfully with a dead address inside it. Every signal says it worked:
 * Resend returns 200, the user receives a message, and the link 404s.
 *
 * A local link is legitimate in local development, so the check is scoped to
 * deployed environments. `VERCEL_ENV` covers preview deployments too, where
 * the same misconfiguration is just as invisible.
 */
function assertReachableLink(link: string): void {
	const { hostname } = new URL(link);

	/**
	 * The auth core is not the website.
	 *
	 * Checked in every environment, because it is never right anywhere.
	 * `SUPERTOKENS_CONNECTION_URI` is the core service — a Java process that
	 * answers `/hello` and knows nothing about this app's routes — while
	 * `SUPERTOKENS_WEBSITE_DOMAIN` is where *users* are. The names are similar
	 * enough that putting the core's URL in both is an easy mistake, and the
	 * symptom is a verification link that 404s on a host that is otherwise
	 * healthy, which looks like a routing bug rather than a config one.
	 */
	if (connectionURI && hostname === new URL(connectionURI).hostname) {
		throw new Error(
			`Refusing to email a verification link pointing at ${hostname}, which is ` +
				"the SuperTokens core, not this website. SUPERTOKENS_WEBSITE_DOMAIN has " +
				"been set to the value that belongs in SUPERTOKENS_CONNECTION_URI. It " +
				"must be the origin users open in a browser, e.g. " +
				"https://dashboard.cheelalabs.com.",
		);
	}

	// A loopback link is correct in local development and useless anywhere
	// else, so this half is scoped to deployed environments. VERCEL_ENV covers
	// previews, where the same mistake is just as invisible.
	const deployed =
		process.env.VERCEL_ENV === "production" ||
		process.env.VERCEL_ENV === "preview" ||
		process.env.NODE_ENV === "production";
	if (!deployed) return;

	if (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "[::1]"
	) {
		throw new Error(
			`Refusing to email a verification link pointing at ${hostname}. ` +
				"SUPERTOKENS_WEBSITE_DOMAIN is unset or wrong in this environment — " +
				"it must be the public origin users reach, e.g. " +
				"https://dashboard.cheelalabs.com, because SuperTokens builds the " +
				"link from it rather than from the request.",
		);
	}
}

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
			/**
			 * Declared before the sign-in recipes so its session claim is added to
			 * every session they create.
			 *
			 * `REQUIRED` rather than `OPTIONAL`: optional adds the claim but
			 * enforces nothing, which is the same posture as today with more
			 * moving parts. Required means SuperTokens refuses to hand out a
			 * usable session until the address is proven.
			 *
			 * The address matters because a free account carries 100
			 * executions/hour that run on Cheela's own OpenRouter credential — so
			 * an unverified signup is not just a fake row, it is metered spend
			 * against an identity nobody owns. See the runtime-creation gate in
			 * apps/server.
			 */
			/**
			 * One person, one account, whichever door they came through.
			 *
			 * Without this, signing up with a password and later clicking
			 * "Continue with Google" produced two users with different ids — two
			 * profiles, two sets of runtimes, and a dashboard that looked wiped.
			 *
			 * `shouldRequireVerification: true` is the entire security of this
			 * feature and must not be relaxed. It is what stops someone
			 * registering `you@company.com` with a password and being merged into
			 * your Google account the moment you sign in. With it, an unverified
			 * account never links: it stays separate until its own address is
			 * proven, at which point the person holding the inbox is by
			 * definition the same person.
			 *
			 * This is why it ships *after* EmailVerification and not with it.
			 * Automatic linking on an unverified address is a takeover primitive,
			 * and SuperTokens' own guidance is the same.
			 *
			 * Third-party sign-ins carry the provider's verified flag — Google and
			 * GitHub both assert it — so those link on first use without a second
			 * round trip.
			 */
			AccountLinking.init({
				shouldDoAutomaticAccountLinking: async () => ({
					shouldAutomaticallyLink: true,
					shouldRequireVerification: true,
				}),

				/**
				 * Linking is not free: one of the two ids stops being anybody's
				 * `session.getUserId()`.
				 *
				 * Runtimes, quota and traces are all keyed on that id as `ownerId`
				 * in apps/server. If somebody had already built on both accounts
				 * before they were linked, whatever sat under the absorbed id is
				 * still in the database and no longer reachable through the UI.
				 *
				 * Nothing is migrated here on purpose — moving another account's
				 * runtimes automatically is a worse failure than leaving them, and
				 * it cannot be undone. This records enough to reconcile by hand,
				 * which for a product at this stage is the right trade.
				 */
				onAccountLinked: async (user, newAccountInfo) => {
					const absorbed = newAccountInfo.recipeUserId.getAsString();
					if (absorbed !== user.id) {
						console.info(
							JSON.stringify({
								event: "account_linked",
								primaryUserId: user.id,
								absorbedRecipeUserId: absorbed,
								email: newAccountInfo.email,
								note: "Anything owned by absorbedRecipeUserId in the server's data is now unreachable via the UI.",
							}),
						);
					}
					await ensureUserProfile(user.id, user.emails[0] ?? "");
				},
			}),
			EmailVerification.init({
				mode: "REQUIRED",
				emailDelivery: {
					service: {
						sendEmail: async (input) => {
							assertReachableLink(input.emailVerifyLink);
							const { subject, html, text } = verificationEmail(
								input.emailVerifyLink,
							);
							await sendEmail({ to: input.user.email, subject, html, text });
						},
					},
				},
			}),
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
