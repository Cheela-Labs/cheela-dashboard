"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils";

type RuntimeDetailData = {
	runtimeId: string;
	version: string;
	status: "healthy" | "degraded" | "offline";
	capabilityNames: string[];
	updatedAt: string;
};

function statusTone(status: RuntimeDetailData["status"]) {
	if (status === "healthy") return "success" as const;
	if (status === "degraded") return "accent" as const;
	return "danger" as const;
}

export function RuntimeDetailDialog({
	runtime,
	trigger,
}: {
	runtime: RuntimeDetailData;
	trigger: ReactNode;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<div className="mb-6 flex items-center justify-between">
					<div className="font-mono text-xs tracking-wide text-accent">
						RUNTIME
					</div>
					<Badge tone={statusTone(runtime.status)}>{runtime.status}</Badge>
				</div>
				<DialogHeader title={runtime.runtimeId} className="mb-6 mt-0" />

				<div className="mb-2 space-y-5">
					<div>
						<div className="mb-2 text-2xs tracking-wide text-console-fg-muted">
							VERSION
						</div>
						<div className="text-sm text-console-fg">v{runtime.version}</div>
					</div>
					<div>
						<div className="mb-2 text-2xs tracking-wide text-console-fg-muted">
							CAPABILITIES
						</div>
						<div className="flex flex-wrap gap-1.5">
							{runtime.capabilityNames.length === 0 ? (
								<span className="text-sm text-console-fg-muted">—</span>
							) : (
								runtime.capabilityNames.map((cap) => (
									<span
										key={cap}
										className="rounded-pill border border-console-border px-2 py-0.5 text-2xs text-console-fg-muted"
									>
										{cap}
									</span>
								))
							)}
						</div>
					</div>
					<div>
						<div className="mb-2 text-2xs tracking-wide text-console-fg-muted">
							VERSION
						</div>
						<div className="text-sm text-console-fg">v{runtime.version}</div>
					</div>
					<div>
						<div className="mb-2 text-2xs tracking-wide text-console-fg-muted">
							UPDATED
						</div>
						<div className="text-sm text-console-fg-muted">
							{formatRelativeTime(runtime.updatedAt)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
