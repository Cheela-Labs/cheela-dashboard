"use client";

import { RuntimeDetailDialog } from "@/components/dashboard/dialogs/runtime-detail-dialog";
import { Badge } from "@/components/ui/badge";

type RuntimePreviewData = {
	runtimeId: string;
	displayName: string;
	version: string;
	capabilityNames: string[];
	status: "healthy" | "degraded" | "offline";
	updatedAt: string;
};

function statusTone(status: RuntimePreviewData["status"]) {
	if (status === "healthy") return "success" as const;
	if (status === "degraded") return "accent" as const;
	return "danger" as const;
}

export function RuntimePreviewRow({
	runtime,
}: {
	runtime: RuntimePreviewData;
}) {
	return (
		<RuntimeDetailDialog
			runtime={runtime}
			trigger={
				<button
					type="button"
					className="w-full cursor-pointer rounded-lg border border-console-border p-5 text-left transition-colors hover:border-accent/30"
				>
					<div className="mb-3 flex items-center justify-between">
						<div className="text-sm font-medium text-console-fg">
							{runtime.displayName}
						</div>
						<Badge tone={statusTone(runtime.status)}>{runtime.status}</Badge>
					</div>
					<div className="mb-3 font-mono text-xs text-console-fg-muted">
						{runtime.runtimeId} · v{runtime.version}
					</div>
					<div className="flex flex-wrap gap-1.5">
						{runtime.capabilityNames.slice(0, 2).map((cap) => (
							<span
								key={cap}
								className="rounded-pill border border-console-border px-2 py-0.5 text-2xs text-console-fg-muted"
							>
								{cap}
							</span>
						))}
					</div>
				</button>
			}
		/>
	);
}
