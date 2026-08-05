"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useCheelaApi } from "@/lib/use-cheela-api";

/**
 * Renames a runtime.
 *
 * Exists because names only became required at registration — every runtime
 * created before that has none and shows its id everywhere, with no way to fix
 * it short of deleting and re-registering, which would invalidate its keys.
 */
export function RenameRuntimeButton({
	runtimeId,
	currentName,
}: {
	runtimeId: string;
	/** The name, or undefined on a runtime that predates the requirement. */
	currentName?: string;
}) {
	const { request } = useCheelaApi();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(currentName ?? "");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const trimmed = name.trim();
	const unchanged = trimmed === (currentName ?? "");

	async function save() {
		if (!trimmed || unchanged) return;
		setBusy(true);
		setError(null);
		try {
			await request(`/v1/runtimes/${runtimeId}`, {
				method: "PATCH",
				body: JSON.stringify({ name: trimmed }),
			});
			setOpen(false);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Rename failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			onOpenChange={(next) => {
				setOpen(next);
				// Reopening starts from what is stored, not from a half-typed edit
				// somebody abandoned.
				if (!next) {
					setName(currentName ?? "");
					setError(null);
				}
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="secondary">
					<Pencil className="size-3.5" />
					Rename
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-[420px]">
				<DialogHeader eyebrow="RUNTIME" title="Rename runtime" />

				<div className="space-y-4">
					<label className="block space-y-2 text-sm">
						<span className="text-console-fg-muted">Name</span>
						<input
							autoFocus
							className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-sm text-console-fg outline-none transition focus:border-accent/60"
							maxLength={100}
							onChange={(event) => setName(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && trimmed && !unchanged) {
									event.preventDefault();
									void save();
								}
							}}
							value={name}
						/>
					</label>

					{/* The id does not change, and people reasonably assume renaming
					    something changes how they refer to it in code. */}
					<p className="text-xs text-console-fg-muted">
						The runtime ID stays{" "}
						<code className="text-accent">{runtimeId}</code>. Nothing in your
						configuration needs to change.
					</p>

					{error ? <p className="text-sm text-danger">{error}</p> : null}

					<div className="flex gap-3 pt-1">
						<Button
							className="flex-1"
							onClick={() => setOpen(false)}
							variant="secondary"
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							disabled={!trimmed || unchanged || busy}
							onClick={() => void save()}
						>
							{busy ? "Saving…" : "Save"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
