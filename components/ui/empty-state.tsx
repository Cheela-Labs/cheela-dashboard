import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	title: string;
	description: string;
	action?: ReactNode;
	className?: string;
};

export function EmptyState({
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-dashed border-console-border bg-white/[0.01] px-6 py-16 text-center",
				className,
			)}
		>
			<h3 className="text-lg font-medium tracking-tight text-console-fg">
				{title}
			</h3>
			<p className="mt-2 max-w-md text-sm leading-relaxed text-console-fg-muted">
				{description}
			</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
