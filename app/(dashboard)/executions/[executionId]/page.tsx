import { notFound } from "next/navigation";
import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem, StaggerLine } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchExecution } from "@/lib/live-data";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";

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
	const turns = execution.messageShape ?? [];
	const isRunning = execution.status === "running";

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Trace"
					title={execution.executionId}
					actions={
						<>
							<Badge
								tone={
									execution.status === "completed"
										? "success"
										: execution.status === "failed"
											? "danger"
											: "accent"
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
						<h2 className="text-lg font-medium text-console-fg">Summary</h2>
						<dl className="space-y-4 text-sm">
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Runtime</dt>
								<dd className="font-mono text-console-fg">
									{execution.runtimeId}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Duration</dt>
								<dd className="text-console-fg">
									{execution.durationMs != null
										? formatDuration(execution.durationMs)
										: "—"}
								</dd>
							</div>
							<div className="flex justify-between gap-4 border-b border-console-border pb-3">
								<dt className="text-console-fg-muted">Capability calls</dt>
								<dd className="text-console-fg">{execution.capabilityCalls}</dd>
							</div>
							{/*
							  Turn count comes from `messageShape`, the content-free record
							  the server keeps in place of the conversation. Absent on traces
							  written before that field existed.
							*/}
							{turns.length > 0 ? (
								<div className="flex justify-between gap-4 border-b border-console-border pb-3">
									<dt className="text-console-fg-muted">Turns</dt>
									<dd className="text-console-fg">{turns.length}</dd>
								</div>
							) : null}
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Started</dt>
								<dd className="text-console-fg">
									{formatRelativeTime(execution.startedAt)}
								</dd>
							</div>
						</dl>
					</Card>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="p-0">
						<div className="space-y-5 p-6 sm:p-8">
							<h2 className="text-lg font-medium text-console-fg">
								Execution timeline
							</h2>
							<Stagger className="relative space-y-4 pl-2" delay={0.2}>
								{/*
								  The spine has to clear the container's own `pl-2` to reach the
								  node dots: 8px padding + the node's 1px border + the dot's
								  `left-3` + half of `size-3` puts every dot's centre at 27px.
								*/}
								<StaggerLine className="absolute bottom-2 left-[27px] top-2 w-px bg-accent/40" />
								<StaggerItem className="relative rounded-lg border border-console-border bg-black/40 py-3 pl-12 pr-4">
									<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_6px] shadow-accent/15" />
									<div className="text-sm text-console-fg">User message</div>
									<div className="mt-1 text-xs text-console-fg-muted">
										Content is not stored
									</div>
								</StaggerItem>
								{calls.map((call, index) => (
									<StaggerItem
										key={call.toolCallId}
										className="relative rounded-lg border border-console-border bg-black/40 py-3 pl-12 pr-4"
									>
										<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-console-border bg-black" />
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="font-mono text-sm text-console-fg">
												{index + 1}. {call.capability}
											</div>
											{call.error ? (
												<Badge tone="danger">error</Badge>
											) : (
												<Badge tone="success">ok</Badge>
											)}
										</div>
										<div className="mt-1 text-xs text-console-fg-muted">
											{formatDuration(call.durationMs)}
											{call.error ? ` · ${call.error}` : ""}
										</div>
									</StaggerItem>
								))}
								<StaggerItem
									className={cn(
										"relative rounded-lg border bg-black/40 py-3 pl-12 pr-4",
										isRunning ? "border-accent/30" : "border-console-border",
									)}
								>
									{/*
									  A run still in flight gets a live dot. The ping ring is
									  purely decorative — the state is already in the status
									  badge and in the line of text below it.
									*/}
									{isRunning ? (
										<span
											aria-hidden
											className="absolute left-3 top-1/2 size-3 -translate-y-1/2"
										>
											<span className="absolute inset-0 rounded-full bg-accent/60 motion-safe:animate-ping" />
											<span className="absolute inset-0 rounded-full bg-accent" />
										</span>
									) : (
										<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-console-border bg-black" />
									)}
									<div className="text-sm text-console-fg">Final response</div>
									<div className="mt-1 text-xs text-console-fg-muted">
										{execution.status === "completed"
											? "Assistant message returned to application"
											: execution.status === "failed"
												? (execution.error ?? "Execution failed")
												: "Agent loop still running"}
									</div>
								</StaggerItem>
							</Stagger>
						</div>
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
