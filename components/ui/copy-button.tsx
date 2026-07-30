"use client";

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
}: {
	value: string;
	label?: string;
	size?: "sm" | "md";
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

	return (
		<Button onClick={copy} size={size} type="button" variant="secondary">
			{state === "copied" ? "Copied" : state === "failed" ? "Press ⌘C" : label}
		</Button>
	);
}
