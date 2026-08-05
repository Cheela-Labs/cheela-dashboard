import { Check } from "lucide-react";
import { UpgradeCheckout } from "@/components/billing/upgrade-checkout";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlans, fetchUsage } from "@/lib/live-data";
import { PRO_PRICE_USD, YEARLY_FALLBACK } from "@/lib/pricing";

export const metadata = {
	title: "Upgrade",
};

export default async function UpgradePage() {
	let usage: Awaited<ReturnType<typeof fetchUsage>> | null = null;
	let plans: Awaited<ReturnType<typeof fetchPlans>>["plans"] = [];
	let error: string | null = null;

	try {
		const [usageResult, plansResult] = await Promise.all([
			fetchUsage(),
			fetchPlans(),
		]);
		usage = usageResult;
		plans = plansResult.plans;
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load billing";
	}

	const pro = plans.find((plan) => plan.id === "pro");
	const monthlyUsd = pro?.priceUsd ?? PRO_PRICE_USD;
	const yearly = pro?.yearly ?? YEARLY_FALLBACK;
	const features = pro?.features ?? [];

	return (
		<div className="space-y-8">
			<FadeIn>
				<PageHeader
					eyebrow="Billing"
					title="Upgrade to Pro"
					description="More runtimes, a higher hourly allowance, longer retention and deeper analytics."
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			<div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
				<FadeIn delay={0.05}>
					<UpgradeCheckout
						currentTier={usage?.tier}
						monthlyUsd={monthlyUsd}
						yearly={yearly}
					/>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="space-y-4 p-6 sm:p-8">
						<h2 className="text-lg font-medium text-console-fg">
							What Pro includes
						</h2>
						{features.length === 0 ? (
							<p className="text-sm text-console-fg-muted">
								Plan details are unavailable until the API is reachable.
							</p>
						) : (
							<ul className="space-y-2">
								{features.map((feature) => (
									<li
										className="flex gap-2 text-sm text-console-fg-muted"
										key={feature}
									>
										<Check className="mt-0.5 size-4 shrink-0 text-accent" />
										<span>{feature}</span>
									</li>
								))}
							</ul>
						)}
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
