import { UpgradeButton } from "@/components/billing/upgrade-button";
import { UpgradePlanDialog } from "@/components/dashboard/dialogs/upgrade-plan-dialog";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getApiUrl } from "@/lib/api-url";
import { fetchPlans, fetchUsage } from "@/lib/live-data";
import { formatNumber } from "@/lib/utils";

export const metadata = {
	title: "Settings",
};

function formatPlanPrice(plan: {
	priceUsd?: number | null;
	priceLabel?: string;
}) {
	if (plan.priceLabel) return plan.priceLabel;
	if (plan.priceUsd == null) return "Contact Us";
	if (plan.priceUsd === 0) return "$0";
	return `$${plan.priceUsd}/month`;
}

export default async function SettingsPage() {
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

	const fallbackPlans = [
		{
			id: "free",
			name: "Free",
			priceUsd: 0,
			features: ["HTTP transport", "Tracing"],
		},
		{
			id: "pro",
			name: "Pro",
			priceUsd: 49,
			features: ["Sessions", "Advanced analytics"],
		},
		{
			id: "enterprise",
			name: "Enterprise",
			priceUsd: null,
			priceLabel: "Contact Us",
			contactUrl: "mailto:sales@cheela.ai",
			features: ["Custom limits", "Dedicated support"],
		},
	];

	const displayPlans = plans.length ? plans : fallbackPlans;

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Workspace"
					title="Settings"
					description="Usage limits and billing for your Cheela Cloud workspace."
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				<Card className="space-y-5 p-6 sm:p-8">
					<h2 className="text-lg font-medium text-console-fg">Usage Limits</h2>
					<p className="text-sm leading-6 text-console-fg-muted">
						Live usage for the authenticated owner. API{" "}
						<code className="text-accent">{getApiUrl()}</code>
					</p>
					{usage ? (
						<dl className="space-y-3 text-sm">
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Tier</dt>
								<dd className="uppercase tracking-wide text-console-fg">
									{usage.tier}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Executions today</dt>
								<dd className="text-console-fg">
									{formatNumber(usage.executions)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Capability calls</dt>
								<dd className="text-console-fg">
									{formatNumber(usage.capabilityCalls)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Input tokens</dt>
								<dd className="text-console-fg">
									{formatNumber(usage.inputTokens)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Output tokens</dt>
								<dd className="text-console-fg">
									{formatNumber(usage.outputTokens)}
								</dd>
							</div>
						</dl>
					) : (
						<p className="text-sm text-console-fg-muted">
							Usage is unavailable until the API is reachable.
						</p>
					)}
				</Card>
			</FadeIn>

			<FadeIn delay={0.1}>
				<Card className="space-y-5 p-6 sm:p-8">
					<h2 className="text-lg font-medium text-console-fg">Billing</h2>
					<p className="text-sm leading-6 text-console-fg-muted">
						Prices are shown in USD. Pro checkout is charged in INR via Razorpay
						using the configured USD→INR conversion rate.
					</p>
					<div className="grid gap-3 lg:grid-cols-3">
						{displayPlans.map((tier) => (
							<div
								key={tier.id}
								className="flex flex-col rounded-lg border border-console-border bg-white/[0.02] px-4 py-4"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="text-sm font-medium text-console-fg">
										{tier.name}
									</div>
									<div className="text-sm text-accent">
										{formatPlanPrice(tier)}
									</div>
								</div>
								<div className="mt-2 grow text-sm text-console-fg-muted">
									{tier.features.join(" · ")}
								</div>
								<div className="mt-4">
									{tier.id === "pro" ? (
										usage?.tier === "pro" || usage?.tier === "enterprise" ? (
											<UpgradeButton currentTier={usage?.tier} />
										) : (
											<UpgradePlanDialog
												currentTier={usage?.tier}
												trigger={<Button>Upgrade to Pro</Button>}
											/>
										)
									) : null}
									{tier.id === "enterprise" &&
									"contactUrl" in tier &&
									tier.contactUrl ? (
										<Button variant="secondary" href={tier.contactUrl}>
											Contact Us
										</Button>
									) : null}
								</div>
							</div>
						))}
					</div>
				</Card>
			</FadeIn>
		</div>
	);
}
