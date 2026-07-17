import { FadeIn } from "@/components/motion/fade-in";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getApiUrl } from "@/lib/api-url";
import { fetchPlans, fetchUsage } from "@/lib/live-data";
import { formatNumber } from "@/lib/utils";

export const metadata = {
	title: "Settings",
};

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

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Workspace"
					title="Settings"
					description="Clerk authenticates the dashboard. Razorpay upgrades your Cheela Cloud tier. Live usage is read from the API."
				/>
			</FadeIn>

			{error ? (
				<Card className="border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.05)] p-5 text-sm text-red-200">
					{error}
				</Card>
			) : null}

			<div className="grid gap-6 lg:grid-cols-2">
				<FadeIn delay={0.05}>
					<Card className="space-y-5 p-6 sm:p-8">
						<h2 className="text-lg font-medium text-white">API connection</h2>
						<p className="text-sm leading-6 text-[var(--muted)]">
							Dashboard requests use your Clerk session JWT. The server verifies
							it with <code className="text-[var(--primary)]">CLERK_SECRET_KEY</code>.
						</p>
						<div className="rounded-[16px] border border-[var(--border)] bg-black/40 p-4 font-mono text-xs text-[var(--muted)]">
							{getApiUrl()}
						</div>
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
							</dl>
						) : null}
					</Card>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="space-y-5 p-6 sm:p-8">
						<h2 className="text-lg font-medium text-white">Billing</h2>
						<div className="space-y-3">
							{(plans.length
								? plans
								: [
										{
											id: "free",
											name: "Free",
											priceInr: 0,
											features: ["HTTP transport", "Tracing"],
										},
										{
											id: "pro",
											name: "Pro",
											priceInr: 999,
											features: ["Sessions", "Advanced analytics"],
										},
									]
							).map((tier) => (
								<div
									key={tier.id}
									className="rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3"
								>
									<div className="flex items-center justify-between gap-3">
										<div className="text-sm font-medium text-white">
											{tier.name}
										</div>
										<div className="text-sm text-[var(--primary)]">
											{tier.priceInr === 0 ? "₹0" : `₹${tier.priceInr}`}
										</div>
									</div>
									<div className="mt-1 text-sm text-[var(--muted)]">
										{tier.features.join(" · ")}
									</div>
								</div>
							))}
						</div>
						<UpgradeButton currentTier={usage?.tier} />
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
