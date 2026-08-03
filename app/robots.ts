import type { MetadataRoute } from "next";

/**
 * The dashboard is an authenticated control plane. It contributes nothing to
 * search and should stay that way — `seo.md` puts it plainly: "Its only SEO
 * obligation is to keep authenticated routes out of the index."
 *
 * This file only works alongside the `.txt|.xml` exclusion in
 * `middleware.ts`'s matcher. Without it the auth middleware intercepts
 * `/robots.txt` and 307s it to `/sign-in`, so a crawler asking for crawl rules
 * is handed an HTML login form and falls back to crawling everything.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			disallow: "/",
		},
	};
}
