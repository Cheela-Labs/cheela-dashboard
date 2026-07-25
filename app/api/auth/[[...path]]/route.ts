import { getAppDirRequestHandler } from "supertokens-node/nextjs";
import { ensureSuperTokensInit } from "@/lib/supertokens-backend";

const handleCall = getAppDirRequestHandler();

async function handle(request: Request) {
	ensureSuperTokensInit();
	return handleCall(request);
}

export {
	handle as GET,
	handle as POST,
	handle as DELETE,
	handle as PUT,
	handle as PATCH,
	handle as OPTIONS,
};
