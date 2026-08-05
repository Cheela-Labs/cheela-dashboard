"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Scopes every figure on the page to one runtime.
 *
 * An account-wide error rate is the mean of unrelated things: one runtime
 * failing every request disappears into the traffic of the ones that are fine,
 * which is the exact failure an error rate exists to surface. The totals are
 * still worth having — they answer "what am I spending" — so this defaults to
 * all runtimes rather than forcing a choice.
 *
 * State lives in the URL, like the range picker beside it, so the server
 * component re-renders against the same slice and every card, chart and table
 * below agrees on what it is describing. It also makes a scoped view something
 * you can send to somebody.
 */
export function AnalyticsRuntimePicker({
	runtimes,
	activeRuntimeId,
}: {
	runtimes: Array<{ runtimeId: string; status?: string }>;
	activeRuntimeId?: string;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [pending, startTransition] = useTransition();

	function select(runtimeId: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (runtimeId) {
			params.set("runtime", runtimeId);
		} else {
			params.delete("runtime");
		}

		startTransition(() => {
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	// Nothing to pick between. Rendering a one-option select would imply a
	// choice that does not exist.
	if (runtimes.length < 2 && !activeRuntimeId) return null;

	return (
		<div className="flex items-center gap-2">
			<label
				className="font-mono text-2xs uppercase tracking-wide text-console-fg-muted"
				htmlFor="analytics-runtime"
			>
				Runtime
			</label>
			<select
				id="analytics-runtime"
				value={activeRuntimeId ?? ""}
				onChange={(event) => select(event.target.value)}
				className={cn(
					"rounded-lg border border-console-border bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-console-fg",
					"focus:border-accent/40 focus:outline-none",
					pending && "opacity-60",
				)}
			>
				<option value="">All runtimes</option>
				{runtimes.map((runtime) => (
					<option key={runtime.runtimeId} value={runtime.runtimeId}>
						{runtime.runtimeId}
					</option>
				))}
			</select>
		</div>
	);
}
