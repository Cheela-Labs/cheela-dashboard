import { Boxes, Radio } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";

type RuntimeCardData = {
	runtimeId: string;
	version: string;
	tier: string;
	capabilityNames: string[];
	status: "healthy" | "degraded" | "offline";
	updatedAt: string;
	connection?: {
		status: "online" | "offline";
		transport?: string;
	};
	deployment?: {
		version?: number;
		status: "active";
		deployedAt?: string;
	} | null;
};

function statusTone(status: RuntimeCardData["status"]) {
	if (status === "healthy") return "success" as const;
	if (status === "degraded") return "accent" as const;
	return "danger" as const;
}

export function RuntimeCard({ runtime }: { runtime: RuntimeCardData }) {
	return (
		<Card interactive className="p-6">
			<Link href={`/runtimes/${runtime.runtimeId}`} className="block space-y-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center rounded-lg border border-console-border bg-black/40 text-accent">
							<Boxes className="size-5" />
						</div>
						<div>
							<div className="font-mono text-sm text-console-fg">
								{runtime.runtimeId}
							</div>
							{/* Provider and model are identical for every runtime — one
							    central credential, one model — so naming them here was a
							    column of the same string repeated down the page. */}
							<div className="mt-1 text-xs text-console-fg-muted">
								v{runtime.version}
							</div>
						</div>
					</div>
					<Badge tone={statusTone(runtime.status)}>{runtime.status}</Badge>
				</div>

				<div className="flex flex-wrap gap-2">
					{runtime.capabilityNames.map((capability) => (
						<span
							key={capability}
							className="rounded-full border border-console-border bg-white/[0.02] px-3 py-1 text-xs text-console-fg-muted"
						>
							{capability}
						</span>
					))}
				</div>

				<div className="flex items-center justify-between text-xs text-console-fg-muted">
					<span className="inline-flex items-center gap-1.5">
						<Radio className="size-3.5 text-accent" />
						{runtime.connection?.status ?? runtime.status}
						{runtime.connection?.transport
							? ` · ${runtime.connection.transport}`
							: ""}
					</span>
					<span>{formatRelativeTime(runtime.updatedAt)}</span>
				</div>
				<div className="text-xs text-console-fg-muted">
					Deployment{" "}
					{runtime.deployment
						? `v${runtime.deployment.version} · active`
						: "not deployed"}
				</div>
			</Link>
		</Card>
	);
}
