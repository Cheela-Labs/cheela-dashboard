"use client";

import { useEffect } from "react";
import Session from "supertokens-web-js/recipe/session";
import { ensureSuperTokensFrontendInit } from "@/lib/supertokens-frontend";

/**
 * Guards against a redirect loop: if refreshing "succeeds" but the middleware
 * still rejects the new token, we land back here immediately. Second arrival
 * inside this window gives up and goes to /sign-in rather than bouncing.
 */
const LOOP_GUARD_KEY = "cheela.session-refresh-started-at";
const LOOP_GUARD_WINDOW_MS = 10_000;

export function RefreshSession({ returnTo }: { returnTo: string }) {
	useEffect(() => {
		ensureSuperTokensFrontendInit();

		const startedAt = Number(
			window.sessionStorage.getItem(LOOP_GUARD_KEY) ?? "0",
		);
		if (Date.now() - startedAt < LOOP_GUARD_WINDOW_MS) {
			window.location.replace("/sign-in");
			return;
		}
		window.sessionStorage.setItem(LOOP_GUARD_KEY, String(Date.now()));

		let cancelled = false;
		void (async () => {
			let refreshed = false;
			try {
				refreshed = await Session.attemptRefreshingSession();
			} catch {
				refreshed = false;
			}
			if (cancelled) return;
			window.location.replace(refreshed ? returnTo : "/sign-in");
		})();

		return () => {
			cancelled = true;
		};
	}, [returnTo]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-console-bg px-6">
			<div className="text-center">
				<div className="text-xs uppercase tracking-wide text-accent">
					Cheela Cloud
				</div>
				<p className="mt-3 text-sm text-console-fg">Restoring your session…</p>
			</div>
		</div>
	);
}
