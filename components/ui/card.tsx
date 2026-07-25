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
				"rounded-lg border border-console-border bg-console-surface/60 p-8 shadow-xs transition-shadow duration-base",
				interactive && "hover:border-accent/35 hover:shadow-md",
				className,
			)}
		>
			{children}
		</div>
	);
}
