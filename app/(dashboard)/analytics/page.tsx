import {
	Activity,
	AlertTriangle,
	Clock3,
	Coins,
	Waypoints,
} from "lucide-react";
import { CapabilityBars } from "@/components/dashboard/capability-bars";
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

export default async function AnalyticsPage() {
	let analytics: Awaited<ReturnType<typeof fetchAnalytics>> | null = null;
	let error: string | null = null;

	try {
		analytics = await fetchAnalytics();
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
				<Card className="border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.05)] p-5 text-sm text-red-200">
					{error}
				</Card>
			) : null}

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
				<div className="grid gap-6 lg:grid-cols-2">
					<FadeIn delay={0.1}>
						<Card className="space-y-6 p-6 sm:p-8">
							<div>
								<h2 className="text-xl font-medium tracking-[-0.03em] text-white">
									Popular capabilities
								</h2>
								<p className="mt-1 text-sm text-[var(--muted)]">
									Most invoked tools across registered runtimes.
								</p>
							</div>
							{capabilityEntries.length === 0 ? (
								<p className="text-sm text-[var(--muted)]">No capability calls yet.</p>
							) : (
								<CapabilityBars data={data.popularCapabilities} />
							)}
						</Card>
					</FadeIn>

					<FadeIn delay={0.15}>
						<Card className="space-y-6 p-6 sm:p-8">
							<div>
								<h2 className="text-xl font-medium tracking-[-0.03em] text-white">
									Runtime usage
								</h2>
								<p className="mt-1 text-sm text-[var(--muted)]">
									Executions attributed per runtime ID.
								</p>
							</div>
							<div className="space-y-3">
								{runtimeEntries.length === 0 ? (
									<p className="text-sm text-[var(--muted)]">No runtime usage yet.</p>
								) : (
									runtimeEntries.map(([runtimeId, count]) => (
										<div
											key={runtimeId}
											className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3"
										>
											<span className="truncate font-mono text-sm text-white">
												{runtimeId}
											</span>
											<span className="text-sm text-[var(--muted)]">
												{formatNumber(count)}
											</span>
										</div>
									))
								)}
							</div>

							<div className="flex items-start gap-3 rounded-[20px] border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.05)] p-4">
								<AlertTriangle className="mt-0.5 size-4 text-red-300" />
								<div>
									<div className="text-sm text-white">Error rate</div>
									<p className="mt-1 text-sm leading-6 text-[var(--muted)]">
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
			)}
		</div>
	);
}
