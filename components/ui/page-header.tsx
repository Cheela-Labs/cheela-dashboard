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
				"flex flex-col gap-6 border-b border-console-border pb-8 lg:flex-row lg:items-end lg:justify-between",
				className,
			)}
		>
			<div className="space-y-3">
				{eyebrow ? (
					<div className="font-mono text-2xs tracking-wide text-accent">
						{eyebrow}
					</div>
				) : null}
				<h1 className="font-display text-3xl font-semibold tracking-tight text-console-fg sm:text-4xl">
					{title}
				</h1>
				{description ? (
					<p className="max-w-2xl text-sm leading-relaxed text-console-fg-muted">
						{description}
					</p>
				) : null}
			</div>
			{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
		</div>
	);
}
