"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
	children,
	className,
	...props
}: ComponentProps<typeof RadixDialog.Content>) {
	return (
		<RadixDialog.Portal>
			<RadixDialog.Overlay
				className={cn(
					"fixed inset-0 z-50 bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-base",
					"data-[state=open]:opacity-100",
				)}
			/>
			<RadixDialog.Content
				className={cn(
					"fixed left-1/2 top-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 scale-95 rounded-lg border border-line-dark-1 bg-ink-1 p-8 text-console-fg opacity-0 shadow-lg transition-all duration-base ease-out",
					"data-[state=open]:scale-100 data-[state=open]:opacity-100",
					className,
				)}
				{...props}
			>
				{children}
			</RadixDialog.Content>
		</RadixDialog.Portal>
	);
}

export function DialogHeader({
	eyebrow,
	title,
	className,
}: {
	eyebrow?: string;
	title: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mb-6", className)}>
			{eyebrow ? (
				<div className="mb-3 font-mono text-xs tracking-wide text-accent">
					{eyebrow}
				</div>
			) : null}
			<RadixDialog.Title className="font-display text-xl font-semibold tracking-tight text-console-fg">
				{title}
			</RadixDialog.Title>
		</div>
	);
}

export function DialogDescription(
	props: ComponentProps<typeof RadixDialog.Description>,
) {
	return (
		<RadixDialog.Description
			{...props}
			className={cn("text-sm text-console-fg-muted", props.className)}
		/>
	);
}

export function DialogFooter({
	children,
	className,
}: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("flex gap-3", className)}>{children}</div>;
}
