import { type NextRequest, NextResponse } from "next/server";
import { withSession } from "supertokens-node/nextjs";
import { getApiUrl } from "@/lib/api-url";
import { ensureSuperTokensInit } from "@/lib/supertokens-backend";

async function handle(request: NextRequest) {
	ensureSuperTokensInit();
	return withSession(request, async (error, session) => {
		if (error || !session) {
			return NextResponse.json(
				{ error: { message: "Unauthorized" } },
				{ status: 401 },
			);
		}

		const requestUrl = new URL(request.url);
		const targetPath = requestUrl.pathname.replace(/^\/api\/proxy/, "");
		const targetUrl = `${getApiUrl()}${targetPath}${requestUrl.search}`;
		const hasBody = request.method !== "GET" && request.method !== "HEAD";

		const upstream = await fetch(targetUrl, {
			method: request.method,
			headers: {
				"Content-Type": request.headers.get("content-type") ?? "application/json",
				Authorization: `Bearer ${session.getAccessToken()}`,
			},
			body: hasBody ? await request.text() : undefined,
			cache: "no-store",
		});

		const responseBody = await upstream.text();
		return new NextResponse(responseBody, {
			status: upstream.status,
			headers: {
				"Content-Type": upstream.headers.get("content-type") ?? "application/json",
			},
		});
	});
}

export {
	handle as GET,
	handle as POST,
	handle as PUT,
	handle as PATCH,
	handle as DELETE,
};
