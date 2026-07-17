import { cn } from "@/lib/utils";

export function CapabilityBars({ data }: { data: Record<string, number> }) {
	const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
	const max = Math.max(...entries.map(([, value]) => value), 1);

	return (
		<div className="space-y-4">
			{entries.map(([name, value]) => (
				<div key={name} className="space-y-2">
					<div className="flex items-center justify-between gap-4 text-sm">
						<span className="font-mono text-white">{name}</span>
						<span className="text-[var(--muted)]">{value}</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
						<div
							className={cn(
								"h-full rounded-full bg-[linear-gradient(90deg,rgba(212,160,23,0.95),rgba(228,179,40,0.55))]",
							)}
							style={{ width: `${(value / max) * 100}%` }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}
