"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Sequenced entrance for a list of steps.
 *
 * `Stagger` is the variant root; `StaggerItem` and `StaggerLine` inherit their
 * cue from it through motion's context rather than props, which is what lets
 * the items themselves stay server-rendered — only these three wrappers cross
 * the client boundary. Plain elements in between do not interrupt the
 * propagation, so a positioned spine or a layout div can sit anywhere in the
 * subtree.
 *
 * Use this instead of a `FadeIn` per row: `FadeIn` takes a hardcoded `delay`,
 * so a list of unknown length would need the caller to invent one per index.
 */
export function Stagger({
	children,
	className,
	delay = 0,
	step = 0.07,
}: {
	children: ReactNode;
	className?: string;
	/** Seconds before the first child starts. */
	delay?: number;
	/** Seconds between each child. */
	step?: number;
}) {
	const reducedMotion = useReducedMotion();

	if (reducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: {
					transition: { delayChildren: delay, staggerChildren: step },
				},
			}}
		>
			{children}
		</motion.div>
	);
}

/** One step. Matches `FadeIn`'s fade-and-rise, over a shorter distance. */
export function StaggerItem({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const reducedMotion = useReducedMotion();

	if (reducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			className={className}
			variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
			transition={{ duration: 0.35, ease: "easeOut" }}
		>
			{children}
		</motion.div>
	);
}

/**
 * The rule connecting the steps — draws itself downward ahead of them.
 *
 * Separate from `StaggerItem` because a vertical hairline that slides down 8px
 * reads as a glitch; growing along its own length reads as a track being laid.
 * The caller must not put a Tailwind transform on this, since motion owns the
 * element's `transform`.
 */
export function StaggerLine({ className }: { className?: string }) {
	const reducedMotion = useReducedMotion();

	if (reducedMotion) {
		return <div className={className} />;
	}

	return (
		<motion.div
			className={className}
			style={{ transformOrigin: "top" }}
			variants={{
				hidden: { scaleY: 0, opacity: 0 },
				visible: { scaleY: 1, opacity: 1 },
			}}
			transition={{ duration: 0.5, ease: "easeOut" }}
		/>
	);
}
