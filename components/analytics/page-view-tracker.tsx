"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { redactedLocation, redactPath } from "./redact";

/**
 * Sends page views by hand, because the automatic ones cannot be redacted.
 *
 * The dashboard's gtag config sets `send_page_view: false`; without that, gtag
 * reads location.href itself and the resource ID is gone before any of our code
 * runs. Client-side navigations need this anyway — a Next route change is a
 * history event, not a document load.
 *
 * `gtag('set', ...)` rather than only passing params on the event: enhanced
 * measurement (scroll depth, outbound clicks, file downloads) fires its own
 * events and stamps each with location.href unless a page_location default is
 * already in place. Setting it here covers those too.
 */
export function PageViewTracker() {
	const pathname = usePathname();
	const previous = useRef<string | null>(null);

	useEffect(() => {
		if (!pathname) return;

		const path = redactPath(pathname);
		const location = redactedLocation(pathname);

		window.gtag?.("set", {
			page_path: path,
			page_location: location,
			// The referrer inside a SPA is another dashboard URL, so it needs the
			// same treatment as the location.
			...(previous.current
				? { page_referrer: `${window.location.origin}${previous.current}` }
				: {}),
		});

		window.gtag?.("event", "page_view", {
			page_path: path,
			page_location: location,
			page_title: document.title,
		});

		previous.current = path;
	}, [pathname]);

	return null;
}
