"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { ExecutionSummary } from "@/lib/types";

function toCsv(rows: ExecutionSummary[]) {
	const header = [
		"executionId",
		"runtimeId",
		"status",
		"durationMs",
		"capabilityCalls",
		"startedAt",
		"completedAt",
	];
	const lines = rows.map((row) =>
		[
			row.executionId,
			row.runtimeId,
			row.status,
			row.durationMs ?? "",
			row.capabilityCalls,
			row.startedAt,
			row.completedAt ?? "",
		]
			.map((value) => `"${String(value).replace(/"/g, '""')}"`)
			.join(","),
	);
	return [header.join(","), ...lines].join("\n");
}

function download(content: string, filename: string, mime: string) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function ExportDownloadDialog({
	executions,
	trigger,
}: {
	executions: ExecutionSummary[];
	trigger: React.ReactNode;
}) {
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");

	function filtered() {
		return executions.filter((ex) => {
			const started = ex.startedAt.slice(0, 10);
			if (start && started < start) return false;
			if (end && started > end) return false;
			return true;
		});
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-[380px]">
				<DialogHeader eyebrow="EXPORT" title="Download executions" />

				<div className="mb-8 flex gap-4">
					<div className="flex-1">
						<div className="mb-2 text-xs text-console-fg-muted">Start date</div>
						<input
							type="date"
							value={start}
							onChange={(e) => setStart(e.target.value)}
							className="w-full rounded-md border border-console-border bg-console-bg px-3 py-2.5 text-sm text-console-fg outline-none focus:border-accent/60"
						/>
					</div>
					<div className="flex-1">
						<div className="mb-2 text-xs text-console-fg-muted">End date</div>
						<input
							type="date"
							value={end}
							onChange={(e) => setEnd(e.target.value)}
							className="w-full rounded-md border border-console-border bg-console-bg px-3 py-2.5 text-sm text-console-fg outline-none focus:border-accent/60"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() =>
							download(
								JSON.stringify(filtered(), null, 2),
								"executions.json",
								"application/json",
							)
						}
					>
						Export JSON
					</Button>
					<Button
						onClick={() =>
							download(toCsv(filtered()), "executions.csv", "text/csv")
						}
					>
						Download CSV
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
