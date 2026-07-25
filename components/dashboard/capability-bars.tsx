export function CapabilityBars({ data }: { data: Record<string, number> }) {
	const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
	const max = Math.max(...entries.map(([, value]) => value), 1);

	return (
		<div className="space-y-4">
			{entries.map(([name, value]) => (
				<div key={name} className="space-y-2">
					<div className="flex items-center justify-between gap-4 text-sm">
						<span className="font-mono text-console-fg">{name}</span>
						<span className="text-console-fg-muted">{value}</span>
					</div>
					<div className="h-2 overflow-hidden rounded-pill bg-white/[0.04]">
						<div
							className="h-full rounded-pill bg-accent"
							style={{ width: `${(value / max) * 100}%` }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}
