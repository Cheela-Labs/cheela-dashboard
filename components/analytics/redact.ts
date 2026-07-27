/**
 * Strips resource identifiers out of dashboard paths before anything is sent to
 * Google.
 *
 * The dashboard is an authenticated app, so its URLs carry customer data:
 * /executions/<executionId> and /runtimes/<runtimeId> identify specific records
 * belonging to specific users. Sent verbatim they become a third-party log of
 * who has what, which is not something analytics needs in order to answer "is
 * anyone using the executions page".
 */

const RULES: { match: RegExp; replace: string }[] = [
	// Ordered: the literal route has to win over the dynamic one above it.
	{ match: /^\/runtimes\/new\/?$/, replace: "/runtimes/new" },
	{ match: /^\/runtimes\/[^/]+\/?$/, replace: "/runtimes/[runtimeId]" },
	{ match: /^\/executions\/[^/]+\/?$/, replace: "/executions/[executionId]" },
	{
		match: /^\/auth\/callback\/[^/]+\/?$/,
		replace: "/auth/callback/[thirdPartyId]",
	},
];

/**
 * Anything that looks like an identifier rather than a route name: a UUID, a
 * long opaque token, or a bare number.
 *
 * This is the backstop for routes that do not exist yet. A future
 * /traces/<id> would otherwise start leaking the moment it shipped, because
 * nobody would think to come back and add a rule here.
 */
const ID_LIKE =
	/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[A-Za-z0-9_-]{16,}|\d+)$/i;

export function redactPath(pathname: string): string {
	for (const rule of RULES) {
		if (rule.match.test(pathname)) return rule.replace;
	}

	return pathname
		.split("/")
		.map((segment) => (ID_LIKE.test(segment) ? "[id]" : segment))
		.join("/");
}

/**
 * Absolute URL for GA, built from the redacted path only — never from
 * location.href, and never carrying a query string. `returnTo`, OAuth `code`
 * and `state` all live in query params and none of them belong in analytics.
 */
export function redactedLocation(pathname: string): string {
	return `${window.location.origin}${redactPath(pathname)}`;
}
