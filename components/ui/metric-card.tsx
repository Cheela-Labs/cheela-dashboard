import type { LucideIcon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type MetricCardProps = {
	label: string;
	value: string | number;
	delta?: string;
	icon: LucideIcon;
	className?: string;
};

export function MetricCard({
	label,
	value,
	delta,
	icon: Icon,
	className,
}: MetricCardProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-console-border bg-white/[0.02] p-5 transition-colors duration-base hover:border-accent/28",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="text-sm text-console-fg-muted">{label}</div>
					<div className="mt-3 font-display text-3xl font-semibold tracking-tight text-console-fg">
						{typeof value === "number" ? formatNumber(value) : value}
					</div>
					{delta ? (
						<div className="mt-2 text-xs text-accent">{delta}</div>
					) : null}
				</div>
				<div className="flex size-11 items-center justify-center rounded-md border border-console-border bg-black/40 text-accent">
					<Icon className="size-5" />
				</div>
			</div>
		</div>
	);
}
