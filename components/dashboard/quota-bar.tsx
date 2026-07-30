import { formatNumber } from "@/lib/utils";

const WARN_AT = 0.8;

/**
 * One metered resource against its ceiling.
 *
 * An unlimited ceiling (enterprise, sent as `null`) renders as a plain count —
 * a progress bar against no limit is noise.
 */
export function QuotaBar({
	label,
	used,
	limit,
}: {
	label: string;
	used: number;
	/** `null` means unlimited — the wire format for an enterprise ceiling. */
	limit?: number | null;
}) {
	const unlimited = limit === undefined || limit === null;
	const ratio = unlimited ? 0 : Math.min(1, used / Math.max(limit, 1));
	const warning = !unlimited && ratio >= WARN_AT;

	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between gap-4 text-sm">
				<span className="text-console-fg-muted">{label}</span>
				<span className={warning ? "text-danger" : "text-console-fg"}>
					{formatNumber(used)}
					{unlimited ? (
						<span className="text-console-fg-muted"> / unlimited</span>
					) : (
						<span className="text-console-fg-muted">
							{" "}
							/ {formatNumber(limit)}
						</span>
					)}
				</span>
			</div>

			{unlimited ? null : (
				<div
					className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
					role="progressbar"
					aria-valuenow={used}
					aria-valuemin={0}
					aria-valuemax={limit}
					aria-label={label}
				>
					<div
						className={`h-full rounded-full transition-[width] ${
							warning ? "bg-danger" : "bg-accent"
						}`}
						style={{ width: `${Math.round(ratio * 100)}%` }}
					/>
				</div>
			)}

			{warning ? (
				<p className="text-xs text-danger">
					{Math.round(ratio * 100)}% of your daily {label.toLowerCase()} used.
				</p>
			) : null}
		</div>
	);
}
