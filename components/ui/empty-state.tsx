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
				"flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-white/[0.01] px-6 py-16 text-center",
				className,
			)}
		>
			<h3 className="text-lg font-medium tracking-[-0.03em] text-white">
				{title}
			</h3>
			<p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
				{description}
			</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
