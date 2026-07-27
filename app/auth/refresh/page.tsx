import { RefreshSession } from "@/components/auth/refresh-session";

/**
 * Only relative, single-slash paths — `returnTo` arrives in a query string the
 * visitor can edit, and it is fed straight to a navigation.
 */
function safeReturnTo(value: string | string[] | undefined): string {
	if (typeof value !== "string") return "/";
	if (!value.startsWith("/")) return "/";
	if (value.startsWith("//") || value.includes("\\")) return "/";
	return value;
}

export default async function RefreshPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { returnTo } = await searchParams;

	return <RefreshSession returnTo={safeReturnTo(returnTo)} />;
}
