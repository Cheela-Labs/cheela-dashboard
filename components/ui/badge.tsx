"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
	children: ReactNode;
	className?: string;
	tone?: "default" | "primary" | "success" | "danger" | "muted";
};

const toneClasses = {
	default: "border-[var(--border)] bg-white/[0.03] text-[var(--foreground)]/90",
	primary:
		"border-[rgba(212,160,23,0.35)] bg-[rgba(212,160,23,0.06)] text-[var(--primary)]",
	success:
		"border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] text-emerald-300",
	danger:
		"border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] text-red-300",
	muted: "border-[var(--border)] bg-white/[0.02] text-[var(--muted)]",
};

export function Badge({ children, className, tone = "default" }: BadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
				toneClasses[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
