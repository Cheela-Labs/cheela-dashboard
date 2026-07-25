import { type NextRequest, NextResponse } from "next/server";
import { withSession } from "supertokens-node/nextjs";
import { ensureSuperTokensInit } from "@/lib/supertokens-backend";
import { getUserProfile } from "@/lib/user-profile";

export async function GET(request: NextRequest) {
	ensureSuperTokensInit();
	return withSession(request, async (error, session) => {
		if (error || !session) {
			return NextResponse.json(
				{ error: { message: "Unauthorized" } },
				{ status: 401 },
			);
		}

		const profile = await getUserProfile(session.getUserId());
		return NextResponse.json({
			userId: session.getUserId(),
			email: profile?.email ?? null,
			tier: profile?.tier ?? "free",
		});
	});
}
