import { AlertTriangle } from "lucide-react";
import { AnalyticsLockedCard } from "@/components/dashboard/analytics-locked-card";
import { AnalyticsRangePicker } from "@/components/dashboard/analytics-range-picker";
import { AnalyticsRuntimePicker } from "@/components/dashboard/analytics-runtime-picker";
import { RequestsTimeseries } from "@/components/dashboard/requests-timeseries";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
	fetchAnalytics,
	fetchExecutions,
	fetchExecutionsForRuntime,
	fetchRuntimes,
	fetchUsage,
} from "@/lib/live-data";
import { resolveProjects } from "@/lib/projects-server";
import { formatDuration, formatNumber, formatRelativeTime } from "@/lib/utils";

export const metadata = {
	title: "Analytics",
};

function first(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

/** `—` rather than `0` when a number was never returned. */
function orDash(value: number | null | undefined, format = formatNumber) {
	return value === null || value === undefined ? "—" : format(value);
}

export default async function AnalyticsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const days = Number(first(params.days) ?? 7);
	const activeDays = Number.isFinite(days) && days > 0 ? days : 7;

	// The runtime list comes first: it populates the picker, and the `?runtime=`
	// param has to be checked against it before anything is scoped by it. A stale
	// or hand-edited id would otherwise 404 the analytics call and blank a page
	// that should simply have shown the account-wide view.
	const { selectedProjectId } = await resolveProjects();

	let runtimes: Awaited<ReturnType<typeof fetchRuntimes>> | null = null;
	try {
		runtimes = await fetchRuntimes(selectedProjectId);
	} catch {
		// The picker disappears and the page stays account-wide, which is the
		// same thing it did before there was a picker.
	}

	const requestedRuntimeId = first(params.runtime);
	const activeRuntimeId =
		requestedRuntimeId &&
		runtimes?.some((runtime) => runtime.runtimeId === requestedRuntimeId)
			? requestedRuntimeId
			: undefined;

	let analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null = null;
	let error: string | null = null;

	try {
		analytics = await fetchAnalytics({
			from:
				first(params.from) ??
				new Date(Date.now() - activeDays * 86_400_000).toISOString(),
			bucket: first(params.bucket) ?? (activeDays <= 1 ? "hour" : "day"),
			// Scoped to the selected project, so this page agrees with the registry
			// and the overview rather than quietly reporting the whole account.
			// Rows written before `projectId` reached the rollups have none and
			// will not match — see scripts/backfill-rollup-project-ids.ts.
			projectId: selectedProjectId,
			runtimeId: activeRuntimeId,
		});
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load analytics";
	}

	/**
	 * The supporting calls degrade independently.
	 *
	 * `allSettled`, not `all`: the header stats come from analytics, and a usage
	 * or execution call failing should blank those cells rather than take the
	 * whole page down with it.
	 */
	const [usageResult, executionsResult] = await Promise.allSettled([
		fetchUsage(),
		activeRuntimeId
			? fetchExecutionsForRuntime(activeRuntimeId, 5)
			: fetchExecutions(5),
	]);

	const usage = usageResult.status === "fulfilled" ? usageResult.value : null;
	const recent =
		executionsResult.status === "fulfilled" ? executionsResult.value : null;

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

	/**
	 * What this account gets, decided by the server.
	 *
	 * Not re-derived from `usage.tier`: the tier string says which plan somebody
	 * is on, and this says what that plan actually returns. Two places answering
	 * that question is how a panel ends up hidden while the API fills it in, or
	 * promised while the API withholds it.
	 *
	 * Defaults assume the full feature set, so an older control plane that does
	 * not send `capabilities` renders exactly as it did before rather than
	 * showing every paying customer an upgrade prompt.
	 */
	const entitled = data.capabilities ?? {
		maxWindowDays: range?.maxWindowDays ?? 7,
		detailedPercentiles: true,
		detailedRuntimeBreakdown: true,
		timeSeries: true,
		trends: true,
	};

	const runtimeEntries = Object.entries(data.runtimeUsage).sort(
		(a, b) => b[1] - a[1],
	);

	/** Highest first, five rows, exactly as the design's panel is sized for. */
	const topCapabilities = Object.entries(data.popularCapabilities)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);

	const successRate =
		data.requests > 0
			? `${((data.completed / data.requests) * 100).toFixed(1)}%`
			: "—";

	const healthy = runtimes?.filter((rt) => rt.status === "healthy").length ?? 0;

	// The runtimes are already loaded for the picker, so naming them in the usage
	// panel costs nothing. Falls back to the id for a runtime that has since been
	// deleted but still appears in the range.
	const runtimeNames = Object.fromEntries(
		(runtimes ?? []).map((runtime) => [runtime.runtimeId, runtime.displayName]),
	);

	// Pro-only, and the server already computes it — the page was fetching this
	// breakdown and throwing away everything but the request count.
	const detailedRuntimes =
		entitled.detailedRuntimeBreakdown &&
		(data.runtimeBreakdown?.length ?? 0) > 0;

	/**
	 * The design's nine cells, every one from a real response.
	 *
	 * Two of its labels were changed rather than filled with something that
	 * looks like them:
	 *
	 * - "Executions this month" is now "Executions (range)". Quota is metered
	 *   hourly with a rollover bucket — there is no monthly window anywhere in
	 *   the platform, so a monthly figure would have to be invented or summed
	 *   from a range the picker above already controls. It reads the range.
	 * - The design's ninth cell pairs with an "Uptime 99.98%" elsewhere in the
	 *   same view. Nothing here measures uptime, so that number does not exist
	 *   to be shown and no cell pretends otherwise.
	 */
	const metrics: { label: string; value: string }[] = [
		{
			label: "Total capability executions",
			value: formatNumber(data.capabilityCalls),
		},
		{ label: "Executions this hour", value: orDash(usage?.executions) },
		{ label: "Executions (range)", value: formatNumber(data.requests) },
		{
			label: "Hourly rollover remaining",
			// `null` is unlimited on enterprise, and is not the same as zero left.
			value:
				usage?.quota?.remaining === null && usage?.quota
					? "Unlimited"
					: orDash(usage?.quota?.remaining),
		},
		{ label: "Active runtimes", value: orDash(runtimes?.length ?? null) },
		{
			label: "Active capabilities",
			value: formatNumber(Object.keys(data.popularCapabilities).length),
		},
		{
			label: "Average response time",
			value: data.averageLatencyMs
				? formatDuration(data.averageLatencyMs)
				: "—",
		},
		{ label: "Success rate", value: successRate },
		{ label: "Error count", value: formatNumber(data.errors) },
	];

	/*
	 * Trend and peak hour, appended rather than woven in, because they are the
	 * two cells a free account does not get and keeping them last means the grid
	 * does not reflow around a hole.
	 *
	 * Both are real: the trend is a second totals query over the preceding window
	 * of equal length, the peak hour is the hourly rollup grouped on hour-of-day.
	 * Neither is the design's invented "+18% week over week" or "2–4pm UTC".
	 */
	if (entitled.trends) {
		metrics.push({
			label: `Trend vs previous ${activeDays}d`,
			value:
				data.trend?.changePercent == null
					? "—"
					: `${data.trend.changePercent > 0 ? "+" : ""}${data.trend.changePercent}%`,
		});
		metrics.push({
			label: "Busiest hour (UTC)",
			value:
				data.peakHour == null
					? "—"
					: `${String(data.peakHour.hour).padStart(2, "0")}:00`,
		});
	}

	return (
		<div className="space-y-8">
			<FadeIn>
				<PageHeader
					eyebrow="Analytics"
					title="Usage & performance"
					description={
						activeRuntimeId
							? `Every figure below is scoped to ${activeRuntimeId}.`
							: "Requests, tokens, capabilities, runtimes and latency across this project. Pick a runtime to see its own numbers — an error rate averaged over several hides a single broken one."
					}
					actions={
						usage ? (
							<span
								className={
									entitled.timeSeries
										? "rounded-pill bg-accent-soft px-2.5 py-1 text-2xs uppercase tracking-wide text-accent-strong"
										: "rounded-pill border border-console-border px-2.5 py-1 text-2xs uppercase tracking-wide text-console-fg-muted"
								}
							>
								{usage.tier}
							</span>
						) : null
					}
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			<div className="flex flex-wrap items-center justify-between gap-4">
				<AnalyticsRangePicker
					activeDays={activeDays}
					maxWindowDays={range?.maxWindowDays ?? 7}
					clamped={Boolean(range?.clamped)}
				/>
				<AnalyticsRuntimePicker
					runtimes={runtimes ?? []}
					activeRuntimeId={activeRuntimeId}
				/>
			</div>

			{requestedRuntimeId && !activeRuntimeId ? (
				<Card className="border-warning/25 bg-warning/5 p-4 text-sm text-console-fg-muted">
					No runtime <code className="text-accent">{requestedRuntimeId}</code>{" "}
					in this project — showing every runtime instead.
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{metrics.map((metric) => (
						<div
							className="rounded-lg border border-console-border bg-white/[0.02] p-5"
							key={metric.label}
						>
							<div className="text-xs text-console-fg-muted">
								{metric.label}
							</div>
							<div className="mt-2 font-display text-xl font-semibold tracking-tight text-console-fg">
								{metric.value}
							</div>
						</div>
					))}
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
						{entitled.timeSeries ? (
							<Card className="space-y-6 p-6 sm:p-8">
								<div className="flex flex-wrap items-start justify-between gap-4">
									<div>
										<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
											Executions over time
										</h2>
										<p className="mt-1 text-sm text-console-fg-muted">
											{range?.bucket === "hour" ? "Hourly" : "Daily"} buckets
											over the selected range.
										</p>
									</div>

									{/*
									  p95 and p99 come back null on a tier without them, and
									  LatencyStat renders that as "—" rather than as a zero. A
									  withheld measurement and a fast one are different facts.
									*/}
									{latency ? (
										<dl className="flex gap-6 text-sm">
											<LatencyStat label="p50" value={latency.p50} />
											<LatencyStat label="p95" value={latency.p95} />
											<LatencyStat label="p99" value={latency.p99} />
										</dl>
									) : null}
								</div>

								<RequestsTimeseries
									series={series}
									bucket={range?.bucket ?? "day"}
								/>
							</Card>
						) : (
							<AnalyticsLockedCard maxWindowDays={entitled.maxWindowDays} />
						)}
					</FadeIn>

					<div className="grid gap-6 lg:grid-cols-2">
						<FadeIn delay={0.1}>
							<Card className="space-y-4 p-6 sm:p-8">
								<h2 className="text-sm font-medium text-console-fg">
									Top 5 capabilities
								</h2>
								{topCapabilities.length === 0 ? (
									<p className="text-sm text-console-fg-muted">
										No capability calls yet.
									</p>
								) : (
									<div>
										{topCapabilities.map(([name, count]) => (
											<div
												className="flex justify-between gap-4 border-t border-console-border py-2 text-sm"
												key={name}
											>
												<span className="truncate font-mono text-console-fg">
													{name}
												</span>
												<span className="shrink-0 text-console-fg-muted">
													{formatNumber(count)}
												</span>
											</div>
										))}
									</div>
								)}
							</Card>
						</FadeIn>

						<FadeIn delay={0.15}>
							<Card className="space-y-4 p-6 sm:p-8">
								<h2 className="text-sm font-medium text-console-fg">
									Recent activity
								</h2>
								{/*
								  Recent executions, not an audit feed.

								  The design lists things like "Runtime rt_8f2a deployed v3"
								  and "API key rotated". Nothing records those — there is no
								  audit log in the API — so this shows the most recent
								  executions, which is real, is the same shape, and is what a
								  reader of this panel is most likely looking for.
								*/}
								{!recent || recent.length === 0 ? (
									<p className="text-sm text-console-fg-muted">
										No executions yet.
									</p>
								) : (
									<div>
										{recent.map((execution) => (
											<div
												className="flex justify-between gap-3 border-t border-console-border py-2 text-sm"
												key={execution.executionId}
											>
												<span className="truncate text-console-fg">
													<span
														className={
															execution.status === "failed"
																? "text-danger"
																: "text-console-fg-muted"
														}
													>
														{execution.status}
													</span>{" "}
													{/* Was the message preview. The ID is the part a
													    reader can act on anyway — it opens the trace. */}
													<span className="font-mono text-xs">
														{execution.executionId}
													</span>
												</span>
												<span className="shrink-0 text-console-fg-muted">
													{formatRelativeTime(execution.startedAt)}
												</span>
											</div>
										))}
									</div>
								)}
							</Card>
						</FadeIn>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						<FadeIn delay={0.18}>
							<Card className="space-y-4 p-6 sm:p-8">
								<div>
									<h2 className="text-sm font-medium text-console-fg">
										Runtime usage
									</h2>
									<p className="mt-1 text-sm text-console-fg-muted">
										{detailedRuntimes
											? "Executions, errors and latency per runtime"
											: "Executions attributed per runtime ID"}
										{runtimes
											? ` · ${healthy} of ${runtimes.length} healthy`
											: ""}
										.
									</p>
								</div>
								{runtimeEntries.length === 0 ? (
									<p className="text-sm text-console-fg-muted">
										No runtime usage yet.
									</p>
								) : (
									<div>
										{/*
										  Error rate and latency per runtime are Pro-only, and the
										  server zeroes them rather than omitting them on a tier
										  without the entitlement — so this branches on the
										  entitlement, not on whether the numbers look empty. A
										  runtime with genuinely zero errors and a withheld
										  measurement are otherwise the same two zeros.
										*/}
										{runtimeEntries.map(([runtimeId, count]) => {
											const detail = detailedRuntimes
												? data.runtimeBreakdown?.find(
														(entry) => entry.runtimeId === runtimeId,
													)
												: undefined;

											return (
												<div
													className="flex items-baseline justify-between gap-4 border-t border-console-border py-2 text-sm"
													key={runtimeId}
												>
													<span className="truncate text-console-fg">
														{runtimeNames[runtimeId] ?? runtimeId}
													</span>
													<span className="flex shrink-0 items-baseline gap-3 text-console-fg-muted">
														{detail ? (
															<>
																<span
																	className={
																		detail.errors > 0
																			? "text-danger"
																			: undefined
																	}
																>
																	{formatNumber(detail.errors)} err
																</span>
																<span>
																	{detail.averageLatencyMs
																		? formatDuration(detail.averageLatencyMs)
																		: "—"}
																</span>
															</>
														) : null}
														<span className="text-console-fg">
															{formatNumber(count)}
														</span>
													</span>
												</div>
											);
										})}
									</div>
								)}
							</Card>
						</FadeIn>

						<FadeIn delay={0.2}>
							<Card className="space-y-4 p-6 sm:p-8">
								<h2 className="text-sm font-medium text-console-fg">Errors</h2>
								<div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 p-4">
									<AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
									<div>
										<div className="text-sm text-console-fg">Error rate</div>
										<p className="mt-1 text-sm leading-relaxed text-console-fg-muted">
											{formatNumber(data.errors)} failures of{" "}
											{formatNumber(data.requests)} requests
											{data.requests > 0
												? ` (${((data.errors / data.requests) * 100).toFixed(1)}%).`
												: "."}
										</p>
									</div>
								</div>
								{/*
								  No error breakdown by cause, and no retry count.

								  The design splits errors into Timeout / Rate limit / Invalid
								  input and shows "failed / retried". The API categorises
								  neither, so those rows would be fiction dressed as
								  diagnostics — the one place in a dashboard where being wrong
								  costs the most.
								*/}
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
 * `null` means the tier does not include this percentile — the server withholds
 * the depth rather than the dashboard hiding it, so this only has to say why.
 *
 * It used to arrive as `0` and this component inferred the gate from
 * `value === 0 && p50 > 0`, which broke on exactly the accounts most likely to
 * be looking: a free tenant with no traffic has p50 of 0 too, so the upgrade
 * prompt disappeared and "p95: 0 ms" was rendered as though measured.
 */
function LatencyStat({
	label,
	value,
}: {
	label: string;
	value: number | null;
}) {
	const locked = value === null;
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
