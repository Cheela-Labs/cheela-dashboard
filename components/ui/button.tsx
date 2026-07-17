"use client";

import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const baseClassName =
	"inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
	primary:
		"bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] shadow-[0_0_0_1px_rgba(0,0,0,0.12)_inset]",
	secondary:
		"border border-[var(--border)] bg-[var(--surface)] text-white hover:border-[rgba(228,179,40,0.32)] hover:bg-white/5",
	outline:
		"border border-[var(--border)] bg-transparent text-white hover:border-[rgba(228,179,40,0.32)] hover:bg-white/5",
	ghost: "bg-transparent text-white hover:bg-white/5",
	link: "bg-transparent px-0 py-0 text-[var(--primary)] underline-offset-4 hover:underline",
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
