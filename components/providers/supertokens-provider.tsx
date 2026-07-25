"use client";

import { ensureSuperTokensFrontendInit } from "@/lib/supertokens-frontend";

ensureSuperTokensFrontendInit();

export function SuperTokensProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
