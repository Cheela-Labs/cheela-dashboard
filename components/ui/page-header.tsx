import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	className?: string;
};

export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 border-b border-[var(--border)] pb-8 lg:flex-row lg:items-end lg:justify-between",
				className,
			)}
		>
			<div className="space-y-3">
				{eyebrow ? (
					<div className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--primary)]">
						{eyebrow}
					</div>
				) : null}
				<h1 className="text-3xl font-medium tracking-[-0.05em] text-white sm:text-4xl">
					{title}
				</h1>
				{description ? (
					<p className="max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
		</div>
	);
}
