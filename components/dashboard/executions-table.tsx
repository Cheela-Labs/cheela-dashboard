import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ExecutionSummary } from "@/lib/data";
import { formatDuration, formatRelativeTime } from "@/lib/utils";

function statusTone(status: ExecutionSummary["status"]) {
	if (status === "completed") return "success" as const;
	if (status === "failed") return "danger" as const;
	return "primary" as const;
}

export function ExecutionsTable({
	executions,
}: {
	executions: ExecutionSummary[];
}) {
	return (
		<div className="overflow-hidden rounded-[24px] border border-[var(--border)]">
			<div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] gap-4 border-b border-[var(--border)] bg-white/[0.02] px-5 py-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)] max-md:hidden">
				<span>Execution</span>
				<span>Runtime</span>
				<span>Status</span>
				<span>Duration</span>
				<span>When</span>
			</div>
			<div className="divide-y divide-[var(--border)]">
				{executions.map((execution) => (
					<Link
						key={execution.executionId}
						href={`/executions/${execution.executionId}`}
						className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.02] md:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr] md:items-center md:gap-4"
					>
						<div className="min-w-0">
							<div className="truncate font-mono text-sm text-white">
								{execution.executionId}
							</div>
							<div className="mt-1 truncate text-sm text-[var(--muted)]">
								{execution.preview}
							</div>
						</div>
						<div className="truncate font-mono text-sm text-[var(--muted)]">
							{execution.runtimeId}
						</div>
						<div>
							<Badge tone={statusTone(execution.status)}>
								{execution.status}
							</Badge>
						</div>
						<div className="text-sm text-[var(--muted)]">
							{execution.durationMs != null
								? formatDuration(execution.durationMs)
								: "—"}
						</div>
						<div className="text-sm text-[var(--muted)]">
							{formatRelativeTime(execution.startedAt)}
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
