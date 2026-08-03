import SuperTokens from "supertokens-web-js";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import EmailVerification from "supertokens-web-js/recipe/emailverification";
import Session from "supertokens-web-js/recipe/session";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";

let initialized = false;

/** Frontend SuperTokens init — patches the global fetch/XHR for session
 * auto-refresh and anti-csrf handling. Browser-only; called once from a
 * client component mounted in the root layout. */
export function ensureSuperTokensFrontendInit(): void {
	if (initialized || typeof window === "undefined") return;
	initialized = true;

	SuperTokens.init({
		appInfo: {
			appName: "Cheela",
			apiDomain:
				process.env.NEXT_PUBLIC_SUPERTOKENS_API_DOMAIN ??
				window.location.origin,
			apiBasePath: "/api/auth",
		},
		// EmailVerification must be present here too, not just on the backend.
		// Without it the browser has no way to consume a verification link or
		// re-request one, and the claim the backend now requires can never be
		// satisfied — sign-in would succeed and then dead-end.
		recipeList: [
			EmailVerification.init(),
			EmailPassword.init(),
			ThirdParty.init(),
			Session.init(),
		],
	});
}
