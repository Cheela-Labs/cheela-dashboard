"use client";

import { Check, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Copies a value and confirms it did.
 *
 * `navigator.clipboard` needs a secure context, so it is absent over plain HTTP
 * and inside some embedded webviews. Falling back to a hidden textarea and
 * `execCommand` covers those: deprecated, but it is the only thing that works
 * there, and a copy button that silently does nothing is worse than a
 * deprecation.
 */
export function CopyButton({
	value,
	label = "Copy",
	size = "sm",
	icon = false,
}: {
	value: string;
	/**
	 * Button text, and the accessible name in `icon` mode.
	 *
	 * In icon mode nothing is rendered as text, so this is the only thing a
	 * screen reader has to distinguish one copy button from the next — make it
	 * name the value ("Copy deploy key"), not the action.
	 */
	label?: string;
	size?: "sm" | "md";
	/** Render a clipboard glyph instead of a word. For credentials sitting beside a label that already says what they are. */
	icon?: boolean;
}) {
	const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

	useEffect(() => {
		if (state === "idle") return;
		const timer = setTimeout(() => setState("idle"), 2000);
		return () => clearTimeout(timer);
	}, [state]);

	async function copy() {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(value);
			} else {
				const area = document.createElement("textarea");
				area.value = value;
				// Off-screen rather than hidden: a display:none element cannot be
				// selected, so the copy would quietly produce nothing.
				area.style.position = "fixed";
				area.style.left = "-9999px";
				document.body.append(area);
				area.select();
				document.execCommand("copy");
				area.remove();
			}
			setState("copied");
		} catch {
			setState("failed");
		}
	}

	if (icon) {
		const Glyph =
			state === "copied" ? Check : state === "failed" ? TriangleAlert : Copy;

		return (
			<button
				aria-label={label}
				className="rounded-lg border border-console-border p-2 text-console-fg-muted transition hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
				onClick={copy}
				title={
					state === "copied"
						? "Copied"
						: state === "failed"
							? "Copy failed — press ⌘C"
							: label
				}
				type="button"
			>
				<Glyph aria-hidden="true" className="h-4 w-4" />
				{/* The glyph alone is silent to assistive tech, and the state change
				    is the only feedback a sighted user gets — announce it too. */}
				<span className="sr-only" role="status">
					{state === "copied"
						? "Copied"
						: state === "failed"
							? "Copy failed, press Command C"
							: ""}
				</span>
			</button>
		);
	}

	return (
		<Button onClick={copy} size={size} type="button" variant="secondary">
			{state === "copied" ? "Copied" : state === "failed" ? "Press ⌘C" : label}
		</Button>
	);
}
