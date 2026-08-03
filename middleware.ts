import { type NextRequest, NextResponse } from "next/server";
import { withPreParsedRequestResponse } from "supertokens-node/nextjs";
import Session from "supertokens-node/recipe/session";
import { ensureSuperTokensInit } from "@/lib/supertokens-backend";

// The error class is not published as its own subpath — Session.Error is how
// supertokens-node exposes it.
const SessionError = Session.Error;

function isPublicRoute(pathname: string): boolean {
	return (
		pathname.startsWith("/sign-in") ||
		pathname.startsWith("/sign-up") ||
		pathname.startsWith("/auth/callback") ||
		pathname.startsWith("/auth/refresh") ||
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/health")
	);
}

function unauthorizedJson(): NextResponse {
	return NextResponse.json(
		{ error: { message: "Unauthorized" } },
		{ status: 401 },
	);
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
	const url = request.nextUrl.clone();
	url.pathname = pathname;
	url.search = "";
	return NextResponse.redirect(url);
}

/**
 * A browser navigation carries no fetch interceptor, so a 401 here is a dead
 * end: nothing on the client is listening to trade the refresh token in. Send
 * the visitor to a page that can do it and then bounce them back.
 */
function redirectToRefresh(request: NextRequest): NextResponse {
	const url = request.nextUrl.clone();
	url.pathname = "/auth/refresh";
	url.search = "";
	url.searchParams.set(
		"returnTo",
		`${request.nextUrl.pathname}${request.nextUrl.search}`,
	);
	return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
	if (isPublicRoute(request.nextUrl.pathname)) {
		return NextResponse.next();
	}

	ensureSuperTokensInit();

	const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

	// Deliberately not `withSession`: it runs getSession inside
	// withPreParsedRequestResponse, whose own catch hands the error to
	// SuperTokens' errorHandler and returns that response. The error never
	// reaches withSession's outer catch, so its `(error, session)` handler is
	// unreachable for anything getSession *throws* — every such visitor got
	// SuperTokens' raw JSON instead of our redirect. Calling getSession here
	// keeps the error ours to branch on.
	return withPreParsedRequestResponse(
		request,
		async (baseRequest, baseResponse) => {
			try {
				// `sessionRequired: false` only covers a missing or unparseable
				// token — those come back as an undefined session below. A
				// well-formed token that is merely expired still throws.
				const session = await Session.getSession(baseRequest, baseResponse, {
					sessionRequired: false,
				});

				if (!session) {
					return isApiRoute
						? unauthorizedJson()
						: redirectTo(request, "/sign-in");
				}

				return NextResponse.next();
			} catch (error) {
				if (
					SessionError.isErrorFromSuperTokens(error) &&
					error.type === SessionError.TRY_REFRESH_TOKEN
				) {
					// The access token expired but the refresh token is very
					// likely still good, so don't drop them at /sign-in.
					return isApiRoute ? unauthorizedJson() : redirectToRefresh(request);
				}

				if (
					SessionError.isErrorFromSuperTokens(error) &&
					error.type === SessionError.UNAUTHORISED
				) {
					return isApiRoute
						? unauthorizedJson()
						: redirectTo(request, "/sign-in");
				}

				/**
				 * The session is valid; a claim on it is not.
				 *
				 * In practice this is only ever `st-ev` — EmailVerification runs in
				 * REQUIRED mode, so it attaches a validator that every
				 * session-protected route enforces. Without this branch the error
				 * fell through to `throw` and the visitor got SuperTokens' raw
				 * `{"message":"invalid claim"}` JSON: signed in, session issued,
				 * and no way to act on it.
				 *
				 * A 403 rather than a 401 for API callers, because retrying with a
				 * fresh token will not help — the address has to be confirmed.
				 */
				if (
					SessionError.isErrorFromSuperTokens(error) &&
					error.type === SessionError.INVALID_CLAIMS
				) {
					return isApiRoute
						? NextResponse.json(
								{
									error: {
										message: "Verify your email address to continue.",
										code: "email_not_verified",
									},
								},
								{ status: 403 },
							)
						: redirectTo(request, "/sign-in/verify-email");
				}

				throw error;
			}
		},
	);
}

export const config = {
	runtime: "nodejs",
	matcher: [
		// `txt` and `xml` are in this list so `/robots.txt` and `/sitemap.xml`
		// are served rather than intercepted. Without them the auth middleware
		// 307s `/robots.txt` to `/sign-in`, and a crawler asking for crawl rules
		// receives an HTML login form — which it treats as "no rules", the exact
		// opposite of what the file says.
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
		"/(api|trpc)(.*)",
	],
};
