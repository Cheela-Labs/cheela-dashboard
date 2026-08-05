"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Delete confirmation that makes you type the name.
 *
 * Both things this guards are irreversible and immediate: deleting a runtime
 * kills a public key that may be embedded in a live page, and deleting a
 * project cannot be undone. A one-click "Are you sure?" is muscle memory by the
 * third time somebody sees it; typing the name is the smallest friction that
 * cannot be cleared without reading.
 *
 * `consequences` is rendered above the input rather than below it, for the same
 * reason: the one moment somebody is actually reading is before they start
 * typing, so anything that would change their mind has to be there already.
 */
export function ConfirmDeleteDialog({
	trigger,
	title,
	/** The exact string that must be typed. Compared literally, after trimming. */
	confirmValue,
	label,
	description,
	consequences,
	onConfirm,
}: {
	trigger: ReactNode;
	title: string;
	confirmValue: string;
	/** What to call the thing in the input's label, e.g. "project name". */
	label: string;
	description: ReactNode;
	consequences?: string[];
	onConfirm: () => Promise<void>;
}) {
	const [open, setOpen] = useState(false);
	const [typed, setTyped] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const matches = typed.trim() === confirmValue;

	async function confirm() {
		if (!matches) return;
		setBusy(true);
		setError(null);
		try {
			await onConfirm();
			setOpen(false);
			setTyped("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				// Reset on close so reopening never starts with the name already
				// typed from last time.
				if (!next) {
					setTyped("");
					setError(null);
				}
			}}
		>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-[440px]">
				<DialogHeader eyebrow="DELETE" title={title} />

				<div className="space-y-4">
					<div className="text-sm leading-6 text-console-fg-muted">
						{description}
					</div>

					{consequences && consequences.length > 0 ? (
						<ul className="space-y-1.5 rounded-lg border border-danger/25 bg-danger/5 p-4 text-sm text-console-fg-muted">
							{consequences.map((line) => (
								<li className="flex gap-2" key={line}>
									<span aria-hidden="true" className="text-danger">
										•
									</span>
									<span>{line}</span>
								</li>
							))}
						</ul>
					) : null}

					<label className="block space-y-2 text-sm">
						<span className="text-console-fg-muted">
							Type <code className="text-accent">{confirmValue}</code> to
							confirm the {label}
						</span>
						<input
							autoComplete="off"
							className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 font-mono text-sm text-console-fg outline-none transition focus:border-danger/60"
							onChange={(event) => setTyped(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && matches) {
									event.preventDefault();
									void confirm();
								}
							}}
							value={typed}
						/>
					</label>

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
							disabled={!matches || busy}
							onClick={() => void confirm()}
							variant="danger"
						>
							{busy ? "Deleting…" : "Delete"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
