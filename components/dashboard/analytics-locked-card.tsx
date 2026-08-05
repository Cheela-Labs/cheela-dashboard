import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * What a free account sees where Pro's analytics would be.
 *
 * Shown rather than hidden, and specific rather than teasing. A panel that
 * silently vanishes reads as a bug; "Upgrade for more" reads as an ad. Naming
 * the exact things withheld — the series, p95/p99, per-runtime error rates, the
 * 90-day window — is both more honest and more persuasive than either, and it
 * is the only version somebody can act on.
 *
 * The list is written from `ANALYTICS_CAPABILITIES` in the server, which is
 * what actually enforces this. If the two drift, the server wins and this is
 * wrong — so the summary reports its own capabilities and the page gates on
 * those, leaving this copy to describe rather than to decide.
 */
export function AnalyticsLockedCard({
	maxWindowDays,
}: {
	maxWindowDays: number;
}) {
	return (
		<Card className="space-y-5 p-6 sm:p-8">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-console-border bg-black/30 text-console-fg-muted">
					<Lock className="size-4" />
				</div>
				<div>
					<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
						Executions over time
					</h2>
					<p className="mt-1 text-sm text-console-fg-muted">
						The totals above cover your whole account. Pro adds the shape behind
						them.
					</p>
				</div>
			</div>

			<ul className="space-y-2 border-t border-console-border pt-5">
				{[
					"Executions, errors and tokens per bucket over time",
					"Hourly buckets — free is limited to daily",
					"p95 and p99 latency, not just p50",
					"Error rate and latency broken down per runtime",
					`90 days of history — free keeps ${maxWindowDays}`,
				].map((feature) => (
					<li
						className="flex gap-2 text-sm text-console-fg-muted"
						key={feature}
					>
						<span aria-hidden="true" className="text-accent">
							✓
						</span>
						<span>{feature}</span>
					</li>
				))}
			</ul>

			<Button href="/upgrade">Upgrade to Pro</Button>
		</Card>
	);
}
