import { type NextRequest, NextResponse } from "next/server";
import { withSession } from "supertokens-node/nextjs";
import { ensureSuperTokensInit } from "@/lib/supertokens-backend";

function isPublicRoute(pathname: string): boolean {
	return (
		pathname.startsWith("/sign-in") ||
		pathname.startsWith("/sign-up") ||
		pathname.startsWith("/auth/callback") ||
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/api/health")
	);
}

export async function middleware(request: NextRequest) {
	if (isPublicRoute(request.nextUrl.pathname)) {
		return NextResponse.next();
	}

	ensureSuperTokensInit();
	return withSession(
		request,
		async (error, session) => {
			if (error || !session) {
				if (request.nextUrl.pathname.startsWith("/api/")) {
					return NextResponse.json(
						{ error: { message: "Unauthorized" } },
						{ status: 401 },
					);
				}
				const signInUrl = request.nextUrl.clone();
				signInUrl.pathname = "/sign-in";
				return NextResponse.redirect(signInUrl);
			}
			return NextResponse.next();
		},
		// Without this the session is *required*, so supertokens-node throws
		// UNAUTHORISED and answers with its own `{"message":"unauthorised"}`
		// 401 before this handler runs — every signed-out visitor gets raw
		// JSON instead of the sign-in page. Opting out hands us an undefined
		// session to branch on instead.
		{ sessionRequired: false },
	);
}

export const config = {
	runtime: "nodejs",
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
