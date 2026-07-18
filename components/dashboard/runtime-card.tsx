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
	providerName: string;
	modelName: string;
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
	if (status === "degraded") return "primary" as const;
	return "danger" as const;
}

export function RuntimeCard({ runtime }: { runtime: RuntimeCardData }) {
	return (
		<Card interactive className="p-6">
			<Link href={`/runtimes/${runtime.runtimeId}`} className="block space-y-5">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-black/40 text-[var(--primary)]">
							<Boxes className="size-5" />
						</div>
						<div>
							<div className="font-mono text-sm text-white">
								{runtime.runtimeId}
							</div>
							<div className="mt-1 text-xs text-[var(--muted)]">
								v{runtime.version} · {runtime.providerName}/{runtime.modelName}
							</div>
						</div>
					</div>
					<Badge tone={statusTone(runtime.status)}>{runtime.status}</Badge>
				</div>

				<div className="flex flex-wrap gap-2">
					{runtime.capabilityNames.map((capability) => (
						<span
							key={capability}
							className="rounded-full border border-[var(--border)] bg-white/[0.02] px-3 py-1 text-xs text-[var(--muted)]"
						>
							{capability}
						</span>
					))}
				</div>

				<div className="flex items-center justify-between text-xs text-[var(--muted)]">
					<span className="inline-flex items-center gap-1.5">
						<Radio className="size-3.5 text-[var(--primary)]" />
						{runtime.connection?.status ?? runtime.status}
						{runtime.connection?.transport
							? ` · ${runtime.connection.transport}`
							: ` · ${runtime.tier} transport`}
					</span>
					<span>{formatRelativeTime(runtime.updatedAt)}</span>
				</div>
				<div className="text-xs text-[var(--muted)]">
					Deployment{" "}
					{runtime.deployment
						? `v${runtime.deployment.version} · active`
						: "not deployed"}
				</div>
			</Link>
		</Card>
	);
}
