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
				"rounded-[24px] border border-[var(--border)] bg-white/[0.02] p-5 transition duration-300 hover:border-[rgba(228,179,40,0.28)]",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="text-sm text-[var(--muted)]">{label}</div>
					<div className="mt-3 text-3xl font-medium tracking-[-0.04em] text-white">
						{typeof value === "number" ? formatNumber(value) : value}
					</div>
					{delta ? (
						<div className="mt-2 text-xs text-[var(--primary)]">{delta}</div>
					) : null}
				</div>
				<div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-black/40 text-[var(--primary)]">
					<Icon className="size-5" />
				</div>
			</div>
		</div>
	);
}
