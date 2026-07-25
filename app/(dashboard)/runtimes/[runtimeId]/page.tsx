import { notFound } from "next/navigation";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchRuntime } from "@/lib/live-data";
import { formatRelativeTime } from "@/lib/utils";

export default async function RuntimeDetailPage({
	params,
}: {
	params: Promise<{ runtimeId: string }>;
}) {
	const { runtimeId } = await params;

	let runtime: Awaited<ReturnType<typeof fetchRuntime>>;
	try {
		runtime = await fetchRuntime(runtimeId);
	} catch {
		notFound();
	}

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Runtime"
					title={runtime.runtimeId}
					description={`Version ${runtime.version} · ${runtime.providerName} / ${runtime.modelName}`}
					actions={
						<>
							<Badge
								tone={
									runtime.status === "healthy"
										? "success"
										: runtime.status === "degraded"
											? "accent"
											: "danger"
								}
							>
								{runtime.status}
							</Badge>
							<Button variant="secondary" href="/executions">
								View executions
							</Button>
						</>
					}
				/>
			</FadeIn>

			<div className="grid gap-6 lg:grid-cols-2">
				<FadeIn delay={0.05}>
					<Card className="space-y-5 p-6">
						<h2 className="text-lg font-medium text-console-fg">
							Configuration
						</h2>
						<dl className="space-y-4 text-sm">
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Connection</dt>
								<dd className="text-console-fg">
									{runtime.connection?.status ?? runtime.status}
									{runtime.connection?.transport
										? ` · ${runtime.connection.transport}`
										: ""}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Deployment</dt>
								<dd className="text-console-fg">
									{runtime.deployment
										? `v${runtime.deployment.version} · ${runtime.deployment.status}`
										: "Not deployed"}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Tier</dt>
								<dd className="text-console-fg">{runtime.tier}</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Provider</dt>
								<dd className="text-console-fg">
									{runtime.providerName} · {runtime.modelName}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Transport</dt>
								<dd className="text-console-fg">
									{runtime.connection?.transport ??
										(runtime.tier === "pro"
											? "Persistent session"
											: "Signed HTTPS")}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Updated</dt>
								<dd className="text-console-fg">
									{formatRelativeTime(runtime.updatedAt)}
								</dd>
							</div>
						</dl>
						{runtime.endpoint ? (
							<div className="rounded-[16px] border border-console-border bg-black/40 p-4 font-mono text-xs text-console-fg-muted">
								{runtime.endpoint}
							</div>
						) : null}
					</Card>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="space-y-5 p-6">
						<h2 className="text-lg font-medium text-console-fg">
							Capability manifest
						</h2>
						<p className="text-sm leading-6 text-console-fg-muted">
							Names only. Handlers execute inside the customer runtime.
						</p>
						<div className="flex flex-wrap gap-2">
							{runtime.capabilityNames.map((capability) => (
								<span
									key={capability}
									className="rounded-full border border-console-border bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-console-fg"
								>
									{capability}
								</span>
							))}
						</div>
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
