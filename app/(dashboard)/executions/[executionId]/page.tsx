import { notFound } from "next/navigation";
import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchExecution } from "@/lib/live-data";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";

/**
 * The rail between the steps, drawn per step instead of once down the track.
 *
 * A single full-height rule cannot know where the first and last dots are —
 * both nodes size to their own text, and the last one grows when it carries an
 * error message — so it overshot both ends. Each step owning its own segment
 * makes the line start at the first dot and stop at the last whatever those
 * nodes measure. It also puts the rail above the translucent card backgrounds
 * rather than striping through them.
 *
 * `left-[18px]` is the dot centre in node coordinates (`left-3` plus half of
 * `size-3`). The callers' `-bottom-5` overshoots the 16px `space-y-4` gap by
 * enough to cover both cards' 1px borders; overlap is invisible on a solid
 * line, a 2px break would not be.
 */
const RAIL = "absolute left-[18px] w-px bg-accent/40";

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
							<Stagger className="space-y-4 pl-2" delay={0.2}>
								<StaggerItem className="relative rounded-lg border border-console-border bg-black/40 py-3 pl-12 pr-4">
									<div className={cn(RAIL, "-bottom-5 top-1/2")} />
									<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full border border-console-border bg-black" />
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
										<div className={cn(RAIL, "-bottom-5 top-0")} />
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
									<div className={cn(RAIL, "bottom-1/2 top-0")} />
									{/*
									  The accent dot marks where the run got to, so it belongs on
									  the head of the trace rather than on the opening message. A
									  run still in flight pings; a finished one just glows. The
									  ring is decorative either way — the state is already in the
									  status badge and in the line of text below.
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
										<div className="absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_6px] shadow-accent/15" />
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
