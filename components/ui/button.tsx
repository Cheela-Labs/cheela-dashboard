"use client";

import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Variant =
	| "primary"
	| "secondary"
	| "outline"
	| "ghost"
	| "link"
	| "danger";
type Size = "sm" | "md" | "lg";

const baseClassName =
	"inline-flex items-center justify-center gap-2 rounded-md font-body font-medium transition-transform duration-fast ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-console-bg disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
	primary: "bg-accent text-ink-0",
	secondary:
		"border border-console-border bg-console-surface text-console-fg hover:bg-white/5",
	outline:
		"border border-console-border bg-transparent text-console-fg hover:bg-white/5",
	ghost: "bg-transparent text-console-fg hover:bg-white/5",
	link: "bg-transparent px-0 py-0 text-accent underline-offset-4 hover:underline",
	// Destructive actions. Filled rather than outlined: a delete button that
	// looks like every other button is one somebody clicks without reading.
	danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<Size, string> = {
	sm: "px-3.5 py-2 text-xs",
	md: "px-5 py-3 text-sm",
	lg: "px-6 py-3.5 text-sm",
};

type ButtonCommonProps = {
	children: ReactNode;
	variant?: Variant;
	size?: Size;
	className?: string;
};

type ButtonAsButtonProps = ButtonCommonProps &
	ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsAnchorProps = ButtonCommonProps &
	AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Button(props: ButtonAsButtonProps | ButtonAsAnchorProps) {
	const {
		children,
		variant = "primary",
		size = "md",
		className,
		...rest
	} = props;
	const classes = cn(
		baseClassName,
		variantClasses[variant],
		sizeClasses[size],
		className,
	);

	if ("href" in props && props.href) {
		const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
		return (
			<a className={classes} {...anchorProps} href={props.href}>
				{children}
			</a>
		);
	}

	const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
	return (
		<button type="button" className={classes} {...buttonProps}>
			{children}
		</button>
	);
}
