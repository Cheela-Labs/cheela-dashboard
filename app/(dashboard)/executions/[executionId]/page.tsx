import { notFound } from "next/navigation";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchExecution } from "@/lib/live-data";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

export default async function ExecutionDetailPage({
	params,
}: {
	params: Promise<{ executionId: string }>;
}) {
	const { executionId } = await params;

	let execution: Awaited<ReturnType<typeof fetchExecution>>;
	try {
		execution = await fetchExecution(executionId);
	} catch {
		notFound();
	}

	const calls = execution.capabilityCallsDetail ?? [];

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Trace"
					title={execution.executionId}
					description={execution.preview}
					actions={
						<>
							<Badge
								tone={
									execution.status === "completed"
										? "success"
										: execution.status === "failed"
											? "danger"
											: "primary"
								}
							>
								{execution.status}
							</Badge>
							<Button
								variant="secondary"
								href={`/runtimes/${execution.runtimeId}`}
							>
								Open runtime
							</Button>
						</>
					}
				/>
			</FadeIn>

			<div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
				<FadeIn delay={0.05}>
					<Card className="space-y-5 p-6">
						<h2 className="text-lg font-medium text-white">Summary</h2>
						<dl className="space-y-4 text-sm">
							<div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
								<dt className="text-[var(--muted)]">Runtime</dt>
								<dd className="font-mono text-white">{execution.runtimeId}</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
								<dt className="text-[var(--muted)]">Duration</dt>
								<dd className="text-white">
									{execution.durationMs != null
										? formatDuration(execution.durationMs)
										: "—"}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
								<dt className="text-[var(--muted)]">Capability calls</dt>
								<dd className="text-white">{execution.capabilityCalls}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Started</dt>
								<dd className="text-white">
									{formatRelativeTime(execution.startedAt)}
								</dd>
							</div>
						</dl>
					</Card>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="relative overflow-hidden p-0">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.1),_transparent_50%)]" />
						<div className="relative space-y-5 p-6 sm:p-8">
							<h2 className="text-lg font-medium text-white">
								Execution timeline
							</h2>
							<div className="relative space-y-4 pl-2">
								<div className="absolute bottom-2 left-[19px] top-2 w-px bg-[linear-gradient(180deg,rgba(212,160,23,0.75),rgba(212,160,23,0.08))]" />
								<div className="relative rounded-2xl border border-[var(--border)] bg-black/40 py-3 pl-12 pr-4">
									<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full bg-[var(--primary)] shadow-[0_0_0_6px_rgba(212,160,23,0.16)]" />
									<div className="text-sm text-white">User message</div>
									<div className="mt-1 text-xs text-[var(--muted)]">
										{execution.preview}
									</div>
								</div>
								{calls.map((call, index) => (
									<div
										key={call.toolCallId}
										className="relative rounded-2xl border border-[var(--border)] bg-black/40 py-3 pl-12 pr-4"
									>
										<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-[var(--border)] bg-black" />
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="font-mono text-sm text-white">
												{index + 1}. {call.capability}
											</div>
											{call.error ? (
												<Badge tone="danger">error</Badge>
											) : (
												<Badge tone="success">ok</Badge>
											)}
										</div>
										<div className="mt-1 text-xs text-[var(--muted)]">
											{formatDuration(call.durationMs)}
											{call.error ? ` · ${call.error}` : ""}
										</div>
									</div>
								))}
								<div className="relative rounded-2xl border border-[var(--border)] bg-black/40 py-3 pl-12 pr-4">
									<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-[var(--border)] bg-black" />
									<div className="text-sm text-white">Final response</div>
									<div className="mt-1 text-xs text-[var(--muted)]">
										{execution.status === "completed"
											? "Assistant message returned to application"
											: execution.status === "failed"
												? (execution.error ?? "Execution failed")
												: "Agent loop still running"}
									</div>
								</div>
							</div>
						</div>
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
