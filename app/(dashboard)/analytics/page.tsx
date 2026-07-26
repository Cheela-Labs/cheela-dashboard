import {
	Activity,
	AlertTriangle,
	Clock3,
	Coins,
	Waypoints,
} from "lucide-react";
import { AnalyticsRangePicker } from "@/components/dashboard/analytics-range-picker";
import { CapabilityBars } from "@/components/dashboard/capability-bars";
import { RequestsTimeseries } from "@/components/dashboard/requests-timeseries";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchAnalytics } from "@/lib/live-data";
import { formatDuration, formatNumber } from "@/lib/utils";

export const metadata = {
	title: "Analytics",
};

function first(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const days = Number(first(params.days) ?? 7);
	const activeDays = Number.isFinite(days) && days > 0 ? days : 7;

	let analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null = null;
	let error: string | null = null;

	try {
		analytics = await fetchAnalytics({
			from:
				first(params.from) ??
				new Date(Date.now() - activeDays * 86_400_000).toISOString(),
			bucket: first(params.bucket) ?? (activeDays <= 1 ? "hour" : "day"),
		});
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load analytics";
	}

	const data = analytics ?? {
		requests: 0,
		completed: 0,
		failed: 0,
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
		capabilityCalls: 0,
		averageLatencyMs: 0,
		runtimeUsage: {},
		popularCapabilities: {},
		errors: 0,
	};

	const series = data.series ?? [];
	const latency = data.latency;
	const range = data.range;

	const runtimeEntries = Object.entries(data.runtimeUsage).sort(
		(a, b) => b[1] - a[1],
	);
	const capabilityEntries = Object.keys(data.popularCapabilities);

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Observability"
					title="Analytics"
					description="Live requests, tokens, runtime usage, popular capabilities, errors, and latency from the Cheela API."
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			{/* One filter row, above everything it scopes. */}
			<AnalyticsRangePicker
				activeDays={activeDays}
				maxWindowDays={range?.maxWindowDays ?? 7}
				clamped={Boolean(range?.clamped)}
			/>

			<FadeIn delay={0.05}>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Completed"
						value={data.completed}
						delta={`${data.failed} failed`}
						icon={Activity}
					/>
					<MetricCard
						label="Capability calls"
						value={data.capabilityCalls}
						icon={Waypoints}
					/>
					<MetricCard
						label="Avg latency"
						value={formatDuration(data.averageLatencyMs || 0)}
						icon={Clock3}
					/>
					<MetricCard
						label="Total tokens"
						value={formatNumber(data.totalTokens)}
						delta={`${formatNumber(data.inputTokens)} in / ${formatNumber(data.outputTokens)} out`}
						icon={Coins}
					/>
				</div>
			</FadeIn>

			{data.requests === 0 && !error ? (
				<EmptyState
					title="No analytics yet"
					description="Analytics populate as executions complete on the connected server."
				/>
			) : (
				<div className="space-y-6">
					<FadeIn delay={0.08}>
						<Card className="space-y-6 p-6 sm:p-8">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
										Requests over time
									</h2>
									<p className="mt-1 text-sm text-console-fg-muted">
										{range?.bucket === "hour" ? "Hourly" : "Daily"} buckets over
										the selected range.
									</p>
								</div>

								{latency ? (
									<dl className="flex gap-6 text-sm">
										<LatencyStat label="p50" value={latency.p50} />
										<LatencyStat
											label="p95"
											value={latency.p95}
											locked={latency.p95 === 0 && latency.p50 > 0}
										/>
										<LatencyStat
											label="p99"
											value={latency.p99}
											locked={latency.p99 === 0 && latency.p50 > 0}
										/>
									</dl>
								) : null}
							</div>

							<RequestsTimeseries
								series={series}
								bucket={range?.bucket ?? "day"}
							/>
						</Card>
					</FadeIn>

					<div className="grid gap-6 lg:grid-cols-2">
						<FadeIn delay={0.1}>
							<Card className="space-y-6 p-6 sm:p-8">
								<div>
									<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
										Popular capabilities
									</h2>
									<p className="mt-1 text-sm text-console-fg-muted">
										Most invoked tools across registered runtimes.
									</p>
								</div>
								{capabilityEntries.length === 0 ? (
									<p className="text-sm text-console-fg-muted">
										No capability calls yet.
									</p>
								) : (
									<CapabilityBars data={data.popularCapabilities} />
								)}
							</Card>
						</FadeIn>

						<FadeIn delay={0.15}>
							<Card className="space-y-6 p-6 sm:p-8">
								<div>
									<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
										Runtime usage
									</h2>
									<p className="mt-1 text-sm text-console-fg-muted">
										Executions attributed per runtime ID.
									</p>
								</div>
								<div className="space-y-3">
									{runtimeEntries.length === 0 ? (
										<p className="text-sm text-console-fg-muted">
											No runtime usage yet.
										</p>
									) : (
										runtimeEntries.map(([runtimeId, count]) => {
											// Pro adds error count and latency per runtime; free gets
											// the request count it always had.
											const detail = data.runtimeBreakdown?.find(
												(entry) => entry.runtimeId === runtimeId,
											);
											return (
												<div
													key={runtimeId}
													className="flex items-center justify-between gap-4 rounded-lg border border-console-border bg-white/[0.02] px-4 py-3"
												>
													<span className="truncate font-mono text-sm text-console-fg">
														{runtimeId}
													</span>
													<span className="shrink-0 text-sm text-console-fg-muted">
														{detail && detail.averageLatencyMs > 0 ? (
															<>{formatDuration(detail.averageLatencyMs)} · </>
														) : null}
														{detail && detail.errors > 0 ? (
															<span className="text-danger">
																{formatNumber(detail.errors)} failed ·{" "}
															</span>
														) : null}
														{formatNumber(count)}
													</span>
												</div>
											);
										})
									)}
								</div>

								<div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 p-4">
									<AlertTriangle className="mt-0.5 size-4 text-danger" />
									<div>
										<div className="text-sm text-console-fg">Error rate</div>
										<p className="mt-1 text-sm leading-relaxed text-console-fg-muted">
											{data.errors} failures of {data.requests || 0} requests
											{data.requests > 0
												? ` (${((data.errors / data.requests) * 100).toFixed(1)}%).`
												: "."}
										</p>
									</div>
								</div>
							</Card>
						</FadeIn>
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * A latency percentile beside the chart title.
 *
 * p95/p99 come back as 0 for free-tier owners — the server withholds the depth
 * rather than the dashboard hiding it, so this only has to say why.
 */
function LatencyStat({
	label,
	value,
	locked = false,
}: {
	label: string;
	value: number;
	locked?: boolean;
}) {
	return (
		<div>
			<dt className="text-xs uppercase tracking-wide text-console-fg-muted">
				{label}
			</dt>
			<dd className="mt-1 text-console-fg">
				{locked ? (
					<a
						className="text-sm text-console-fg-muted underline-offset-4 hover:text-accent hover:underline"
						href="/settings"
					>
						Pro
					</a>
				) : (
					formatDuration(value)
				)}
			</dd>
		</div>
	);
}
