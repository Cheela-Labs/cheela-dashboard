import {
	Activity,
	AlertTriangle,
	Boxes,
	Clock3,
	Coins,
	Download,
	Plus,
} from "lucide-react";
import { ExportDownloadDialog } from "@/components/dashboard/dialogs/export-download-dialog";
import { RegisterRuntimeDialog } from "@/components/dashboard/dialogs/register-runtime-dialog";
import { ExecutionsTable } from "@/components/dashboard/executions-table";
import { RuntimePreviewRow } from "@/components/dashboard/runtime-preview-row";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { getApiUrl } from "@/lib/api-url";
import {
	fetchAnalytics,
	fetchExecutions,
	fetchRuntimes,
} from "@/lib/live-data";
import { formatDuration, formatNumber } from "@/lib/utils";

export default async function OverviewPage() {
	const [runtimesResult, executionsResult, analyticsResult] =
		await Promise.allSettled([
			fetchRuntimes(),
			fetchExecutions(8),
			fetchAnalytics(),
		]);

	const runtimes =
		runtimesResult.status === "fulfilled" ? runtimesResult.value : [];
	const executions =
		executionsResult.status === "fulfilled" ? executionsResult.value : [];
	const analytics =
		analyticsResult.status === "fulfilled"
			? analyticsResult.value
			: {
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

	const apiError =
		runtimesResult.status === "rejected" ||
		executionsResult.status === "rejected" ||
		analyticsResult.status === "rejected";

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Overview"
					title="Control plane"
					// description={`Live data from ${getApiUrl()}. Cheela orchestrates — your infrastructure executes.`}
					actions={
						<>
							<Button variant="secondary" href="/analytics">
								View analytics
							</Button>
							<RegisterRuntimeDialog
								trigger={
									<Button>
										<Plus className="size-4" />
										Register runtime
									</Button>
								}
							/>
						</>
					}
				/>
			</FadeIn>

			{apiError ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					Could not reach the Cheela API at {getApiUrl()}. Check{" "}
					<code className="text-accent">NEXT_PUBLIC_API_URL</code>, CORS, and
					that the server is running with the same Clerk secret.
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Requests"
						value={analytics.requests}
						delta={`${analytics.completed} completed`}
						icon={Activity}
					/>
					<MetricCard
						label="Runtimes"
						value={runtimes.length}
						delta={`${runtimes.filter((r) => r.status === "healthy").length} healthy`}
						icon={Boxes}
					/>
					<MetricCard
						label="Avg latency"
						value={formatDuration(analytics.averageLatencyMs || 0)}
						delta="across executions"
						icon={Clock3}
					/>
					<MetricCard
						label="Tokens"
						value={formatNumber(analytics.totalTokens)}
						delta={`${formatNumber(analytics.errors)} errors`}
						icon={Coins}
					/>
				</div>
			</FadeIn>

			<div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
				<FadeIn delay={0.1}>
					<section className="space-y-4">
						<div className="flex items-end justify-between gap-4">
							<div>
								<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
									Recent executions
								</h2>
								<p className="mt-1 text-sm text-console-fg-muted">
									Latest agent loops from the execution engine.
								</p>
							</div>
							<div className="flex gap-2">
								{executions.length > 0 ? (
									<ExportDownloadDialog
										executions={executions}
										trigger={
											<Button variant="secondary" size="sm">
												<Download className="size-3.5" />
												Download
											</Button>
										}
									/>
								) : null}
								<Button variant="ghost" size="sm" href="/executions">
									View all
								</Button>
							</div>
						</div>
						{executions.length === 0 ? (
							<EmptyState
								title="No executions yet"
								description="Run an agent through POST /v1/executions to see live traces here."
							/>
						) : (
							<ExecutionsTable executions={executions} />
						)}
					</section>
				</FadeIn>

				<FadeIn delay={0.15}>
					<section className="space-y-4">
						<div>
							<h2 className="font-display text-xl font-semibold tracking-tight text-console-fg">
								Runtimes
							</h2>
							<p className="mt-1 text-sm text-console-fg-muted">
								Registered metadata for your workspace.
							</p>
						</div>
						{runtimes.length === 0 ? (
							<EmptyState
								title="No runtimes"
								description="Register a runtime to start routing capability calls."
								action={
									<Button href="/runtimes/new" size="sm">
										Register runtime
									</Button>
								}
							/>
						) : (
							<div className="space-y-4">
								{runtimes.map((runtime) => (
									<RuntimePreviewRow
										key={runtime.runtimeId}
										runtime={runtime}
									/>
								))}
							</div>
						)}
					</section>
				</FadeIn>
			</div>

			<FadeIn delay={0.2}>
				<Card className="p-0">
					<div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
						<div className="space-y-4">
							<div className="inline-flex items-center gap-2 rounded-pill border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-2xs tracking-wide text-accent">
								<AlertTriangle className="size-3.5" />
								Live
							</div>
							<h2 className="font-display text-2xl font-semibold tracking-tight text-console-fg sm:text-3xl">
								Connected to Cheela Cloud
							</h2>
							<p className="max-w-xl text-md leading-relaxed text-console-fg-muted">
								This dashboard authenticates with Clerk and reads live registry,
								execution, analytics, and billing data from your deployed API.
							</p>
						</div>
						<div className="rounded-lg border border-console-border bg-black/40 p-5 font-mono text-sm text-console-fg-muted">
							<div className="text-accent">Connection</div>
							<div className="mt-4 space-y-2 break-all">
								<div>API {getApiUrl()}</div>
								<div>Auth Clerk JWT → server</div>
								<div>Billing Pro $49/mo (USD · Razorpay INR checkout)</div>
							</div>
						</div>
					</div>
				</Card>
			</FadeIn>
		</div>
	);
}
