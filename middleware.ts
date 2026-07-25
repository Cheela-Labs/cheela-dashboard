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
	return withSession(request, async (error, session) => {
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
	});
}

export const config = {
	runtime: "nodejs",
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
