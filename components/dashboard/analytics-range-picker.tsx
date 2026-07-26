"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Presets as rows, not a calendar grid — "last 30 days" is the thing readers
 * actually reach for, and nobody wants to fight a date grid for it.
 */
const PRESETS = [
	{ label: "24h", days: 1, bucket: "hour" as const },
	{ label: "7d", days: 7, bucket: "day" as const },
	{ label: "30d", days: 30, bucket: "day" as const },
	{ label: "90d", days: 90, bucket: "day" as const },
];

function isoDaysAgo(days: number): string {
	return new Date(Date.now() - days * 86_400_000).toISOString();
}

/**
 * The one filter row, above everything it scopes.
 *
 * State lives in the URL so the server component re-renders against the same
 * slice — every card, chart, and table below always agrees on the window.
 */
export function AnalyticsRangePicker({
	activeDays,
	maxWindowDays,
	clamped,
}: {
	activeDays: number;
	maxWindowDays: number;
	clamped: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [pending, startTransition] = useTransition();

	function select(preset: (typeof PRESETS)[number]) {
		const params = new URLSearchParams(searchParams.toString());
		params.set("days", String(preset.days));
		params.set("from", isoDaysAgo(preset.days));
		params.set("bucket", preset.bucket);

		startTransition(() => {
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			<fieldset
				className="inline-flex items-center gap-1 rounded-lg border border-console-border bg-white/[0.02] p-1"
				aria-label="Date range"
			>
				{PRESETS.map((preset) => {
					const active = preset.days === activeDays;
					const beyondTier = preset.days > maxWindowDays;

					return (
						<button
							key={preset.label}
							type="button"
							onClick={() => select(preset)}
							aria-pressed={active}
							className={cn(
								"rounded-md px-3 py-1.5 text-xs transition",
								active
									? "bg-accent text-ink-0"
									: "text-console-fg-muted hover:bg-white/5 hover:text-console-fg",
								beyondTier && !active && "opacity-50",
							)}
							title={
								beyondTier
									? `Your plan retains ${maxWindowDays} days of analytics`
									: undefined
							}
						>
							{preset.label}
						</button>
					);
				})}
			</fieldset>

			{clamped ? (
				<p className="text-xs text-console-fg-muted">
					Showing the last {maxWindowDays} days —{" "}
					<a
						className="text-accent underline-offset-4 hover:underline"
						href="/settings"
					>
						upgrade for 90-day analytics
					</a>
					.
				</p>
			) : null}

			{/* Refetch keeps the frame: the charts below dim rather than flashing a skeleton. */}
			<span
				aria-live="polite"
				className={cn(
					"text-xs text-console-fg-muted transition-opacity",
					pending ? "opacity-100" : "opacity-0",
				)}
			>
				Updating…
			</span>
		</div>
	);
}
