"use client";

import { type ReactNode, useState } from "react";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PRO_PRICE_LABEL } from "@/lib/pricing";

const FEATURES = [
	"10 runtimes",
	"2,000 executions / hour",
	"Insights analytics",
	"Priority support",
];

export function UpgradePlanDialog({
	trigger,
	currentTier,
}: {
	trigger: ReactNode;
	currentTier?: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-[420px]">
				<DialogHeader eyebrow="UPGRADE" title="Cheela Cloud Pro" />
				<div className="mb-6 font-display text-2xl font-bold text-console-fg">
					{PRO_PRICE_LABEL}
					<span className="text-sm font-normal text-console-fg-muted">/mo</span>
				</div>
				<div className="mb-8 flex flex-col gap-3">
					{FEATURES.map((feature) => (
						<div
							key={feature}
							className="flex gap-2 text-sm text-console-fg-muted"
						>
							<span className="text-accent">✓</span>
							{feature}
						</div>
					))}
				</div>
				<UpgradeButton
					currentTier={currentTier}
					onUpgraded={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
