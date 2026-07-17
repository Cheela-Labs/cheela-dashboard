"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
	children: ReactNode;
	className?: string;
	interactive?: boolean;
};

export function Card({ children, className, interactive = false }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-[24px] border border-[var(--border)] bg-[var(--surface)]/90 p-8 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition duration-300 ease-out",
				interactive &&
					"hover:-translate-y-1 hover:border-[rgba(228,179,40,0.35)] hover:shadow-[0_0_0_1px_rgba(228,179,40,0.08),0_10px_40px_rgba(0,0,0,0.28)]",
				className,
			)}
		>
			{children}
		</div>
	);
}
