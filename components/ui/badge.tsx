"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "danger" | "info";

type BadgeProps = {
	children: ReactNode;
	className?: string;
	tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
	neutral: "border-console-border bg-white/[0.03] text-console-fg/90",
	accent: "border-accent/35 bg-accent/10 text-accent",
	success: "border-success/35 bg-success/10 text-success",
	danger: "border-danger/35 bg-danger/10 text-danger",
	info: "border-info/35 bg-info/10 text-info",
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-pill border px-3 py-1 font-mono text-2xs font-medium tracking-wide",
				toneClasses[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
