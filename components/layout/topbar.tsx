"use client";

import { useEffect, useRef, useState } from "react";
import { UserMenu } from "@/components/layout/user-menu";
import { useProjects } from "@/lib/projects";
import { useCheelaApi } from "@/lib/use-cheela-api";

/**
 * The control-room header, per `Dashboard.dc.html`.
 *
 * The search field, its ⌘K shortcut and its combobox listbox were removed
 * rather than restyled: the design's header has no search at all, and the
 * instruction was to adopt it exactly. Every destination the search reached is
 * still in the sidebar, so nothing is stranded — but this was a real
 * capability, not decoration, and bringing it back means bringing back the
 * `role="combobox"` wiring with it, not just an input.
 */

type Stat = { label: string; value: string };

/** `48,204` — separated, because these sit in a 12px mono row. */
function formatCount(value: number): string {
	return value.toLocaleString("en-US");
}

/** `212ms` under a second, `1.4s` over it. */
function formatLatency(ms: number): string {
	if (!Number.isFinite(ms) || ms <= 0) return "—";
	return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function Topbar({ title }: { title?: string }) {
	const { request } = useCheelaApi();
	const { selectedProject } = useProjects();
	const [stats, setStats] = useState<Stat[] | null>(null);

	// In a ref so the effect below does not depend on a function identity that
	// changes on every render.
	const load = useRef(async () => {
		try {
			const [runtimes, analytics] = await Promise.all([
				request<{ runtimes: unknown[] }>("/v1/runtimes"),
				request<{
					requests: number;
					failed: number;
					averageLatencyMs: number;
				}>("/v1/analytics/summary"),
			]);

			/**
			 * Four stats, each a number the API actually returned.
			 *
			 * The design's sample data reads RUNTIMES / REQ/HR / AVG LATENCY 212ms
			 * / UPTIME 99.98%. The last two are the invented figures already
			 * removed from the marketing site: nothing in this product measures
			 * uptime, and a placeholder rendered here is worse than one in a
			 * mockup, because a user reads it as their own live number.
			 *
			 * The four-column shape is kept and the last slot carries `failed`,
			 * which is real, arrives on the same response, and is worth a glance.
			 */
			setStats([
				{ label: "RUNTIMES", value: formatCount(runtimes.runtimes.length) },
				{ label: "REQUESTS", value: formatCount(analytics.requests) },
				{
					label: "AVG LATENCY",
					value: formatLatency(analytics.averageLatencyMs),
				},
				{ label: "FAILED", value: formatCount(analytics.failed) },
			]);
		} catch {
			// Null, not zeroes. A failed fetch rendering "0 REQUESTS" is a false
			// statement about the workspace; an absent row is merely quiet.
			setStats(null);
		}
	});

	useEffect(() => {
		void load.current();
	}, []);

	return (
		<header className="sticky top-0 z-20 border-b border-console-border bg-console-bg/80 backdrop-blur-2xl">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-4 sm:px-8 lg:pl-8">
				<div className="pl-12 lg:pl-0">
					<div className="font-mono text-sm font-semibold uppercase tracking-wide text-console-fg">
						{title ?? selectedProject?.name ?? "Cheela"}
					</div>
					<div className="mt-0.5 text-2xs tracking-wide text-console-fg-muted">
						CONTROL ROOM
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-x-8 gap-y-3">
					{/* Hidden below lg: four mono columns plus the account controls do
					    not fit beside a title on a laptop, and the same figures are on
					    the Overview and Analytics pages. */}
					{stats ? (
						<div className="hidden items-center gap-8 lg:flex">
							{stats.map((stat) => (
								<div key={stat.label}>
									<div className="font-mono text-2xs tracking-wide text-console-fg-muted">
										{stat.label}
									</div>
									<div className="mt-0.5 font-mono text-sm font-medium text-console-fg">
										{stat.value}
									</div>
								</div>
							))}
						</div>
					) : null}

					{/*
					  The dot means the control plane answered, not that anything is
					  guaranteed up. The design lights it unconditionally; tying it to
					  the fetch is the difference between an indicator and a graphic.
					*/}
					<div className="hidden items-center gap-1.5 sm:flex">
						<span
							aria-hidden="true"
							className={
								stats
									? "size-2 rounded-full bg-success shadow-[0_0_0_3px_rgba(31,139,76,0.18)]"
									: "size-2 rounded-full bg-console-fg-muted"
							}
						/>
						<span
							className={`font-mono text-2xs tracking-wide ${
								stats ? "text-success" : "text-console-fg-muted"
							}`}
						>
							{stats ? "LIVE" : "OFFLINE"}
						</span>
					</div>

					{/* No notification bell: nothing in the platform produces a
					    notification, so the button opened nothing and its presence
					    promised a feature that does not exist. */}
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
