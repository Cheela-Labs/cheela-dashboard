import { UpgradeButton } from "@/components/billing/upgrade-button";
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
				<Card className="border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.05)] p-5 text-sm text-red-200">
					{error}
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				<Card className="space-y-5 p-6 sm:p-8">
					<h2 className="text-lg font-medium text-white">Usage Limits</h2>
					<p className="text-sm leading-6 text-[var(--muted)]">
						Live usage for the authenticated owner. API{" "}
						<code className="text-[var(--primary)]">{getApiUrl()}</code>
					</p>
					{usage ? (
						<dl className="space-y-3 text-sm">
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Tier</dt>
								<dd className="uppercase tracking-[0.12em] text-white">
									{usage.tier}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Executions today</dt>
								<dd className="text-white">{formatNumber(usage.executions)}</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Capability calls</dt>
								<dd className="text-white">
									{formatNumber(usage.capabilityCalls)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Input tokens</dt>
								<dd className="text-white">
									{formatNumber(usage.inputTokens)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-[var(--muted)]">Output tokens</dt>
								<dd className="text-white">
									{formatNumber(usage.outputTokens)}
								</dd>
							</div>
						</dl>
					) : (
						<p className="text-sm text-[var(--muted)]">
							Usage is unavailable until the API is reachable.
						</p>
					)}
				</Card>
			</FadeIn>

			<FadeIn delay={0.1}>
				<Card className="space-y-5 p-6 sm:p-8">
					<h2 className="text-lg font-medium text-white">Billing</h2>
					<p className="text-sm leading-6 text-[var(--muted)]">
						Prices are shown in USD. Pro checkout is charged in INR via Razorpay
						using the configured USD→INR conversion rate.
					</p>
					<div className="grid gap-3 lg:grid-cols-3">
						{displayPlans.map((tier) => (
							<div
								key={tier.id}
								className="flex flex-col rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-4"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="text-sm font-medium text-white">
										{tier.name}
									</div>
									<div className="text-sm text-[var(--primary)]">
										{formatPlanPrice(tier)}
									</div>
								</div>
								<div className="mt-2 grow text-sm text-[var(--muted)]">
									{tier.features.join(" · ")}
								</div>
								<div className="mt-4">
									{tier.id === "pro" ? (
										<UpgradeButton currentTier={usage?.tier} />
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
