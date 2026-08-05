import { QuotaBar } from "@/components/dashboard/quota-bar";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlans, fetchUsage } from "@/lib/live-data";
import { PRO_PRICE_USD } from "@/lib/pricing";
import { formatNumber } from "@/lib/utils";

export const metadata = {
	title: "Settings",
};

/** "in 35m" — the window is the hour, which is not obvious from a raw timestamp. */
function formatResetIn(periodEnd: string): string {
	const remainingMs = new Date(periodEnd).getTime() - Date.now();
	if (remainingMs <= 0) return "shortly";

	const hours = Math.floor(remainingMs / 3_600_000);
	if (hours >= 1) return `in ${hours}h`;
	return `in ${Math.max(1, Math.round(remainingMs / 60_000))}m`;
}

/** "14:00 UTC". Rendered server-side, so UTC rather than a locale guess. */
function formatResetAt(periodEnd: string): string {
	return `${new Date(periodEnd).toISOString().slice(11, 16)} UTC`;
}

/** Whole days until `iso`, floored at 0. Negative means it already lapsed. */
function daysUntil(iso: string): number {
	return Math.max(
		0,
		Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000),
	);
}

/** "12 Sep 2026" — unambiguous in every locale, unlike 09/12/2026. */
function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

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
		// Mirrors GET /v1/billing/plans. Kept in sync deliberately: this fallback
		// is what users see when the API is unreachable, so it must not advertise
		// anything the server no longer claims.
		{
			id: "free",
			name: "Free",
			priceUsd: 0,
			features: [
				"1 runtime",
				"100 executions/hour",
				"Signed HTTPS transport",
				"Tracing",
			],
		},
		{
			id: "pro",
			name: "Pro",
			priceUsd: PRO_PRICE_USD,
			features: [
				"10 runtimes",
				"2,000 executions/hour",
				"90-day retention",
				"Advanced analytics",
			],
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
					{usage ? (
						<div className="space-y-5">
							<div className="flex justify-between gap-4 text-sm">
								<span className="text-console-fg-muted">Tier</span>
								<span className="uppercase tracking-wide text-console-fg">
									{usage.tier}
								</span>
							</div>

							{/*
							  The current hour against the hourly allowance, not the whole
							  bucket. The bucket spans the rollover window — capacity is
							  refillPerHour × rolloverHours, so on Pro it read "1,240 / 48,000"
							  and answered a question nobody asks. The window is named by the
							  reset row below rather than by this label.

							  It can exceed the allowance, because rollover is real: spending
							  banked tokens is exactly how you run above the sustained rate.
							  QuotaBar clamps the bar at 100%, and the number beside it keeps
							  counting, which is the honest way round.
							*/}
							<QuotaBar
								label="Executions"
								used={usage.executions}
								limit={usage.quota?.refillPerHour}
							/>

							<dl className="space-y-3 border-t border-console-border pt-4 text-sm">
								{usage.periodEnd ? (
									<div className="flex justify-between gap-4">
										<dt className="text-console-fg-muted">
											Hourly allowance resets
										</dt>
										<dd className="text-console-fg">
											{formatResetIn(usage.periodEnd)}
											<span className="ml-2 text-console-fg-muted">
												{formatResetAt(usage.periodEnd)}
											</span>
										</dd>
									</div>
								) : null}
								{usage.quota ? (
									<div className="flex justify-between gap-4">
										<dt className="text-console-fg-muted">
											Rollover executions left
											{/* The enforced number: what you can spend right now,
											    banked allowance included. */}
										</dt>
										<dd className="text-console-fg">
											{usage.quota.remaining === null
												? "Unlimited"
												: formatNumber(usage.quota.remaining)}
										</dd>
									</div>
								) : null}
								<div className="flex justify-between gap-4">
									<dt className="text-console-fg-muted">Capability calls</dt>
									{/* Metered and shown, never a ceiling: an execution costs one
									    unit however many capabilities it calls. */}
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
						</div>
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

					{/*
					  The paid window. Nothing showed it before, so the one thing a
					  paying customer most wants from this page — how long they have
					  left — was the one thing missing. These are one-off Razorpay
					  orders rather than a recurring subscription, so this is an expiry
					  and is labelled as one.
					*/}
					{usage?.subscriptionEnd ? (
						<dl className="space-y-3 rounded-lg border border-console-border bg-white/[0.02] p-4 text-sm">
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Status</dt>
								<dd className="uppercase tracking-wide text-console-fg">
									{usage.subscriptionStatus ?? "active"}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">
									{daysUntil(usage.subscriptionEnd) === 0
										? "Expired"
										: "Expires"}
								</dt>
								<dd className="text-console-fg">
									{formatDate(usage.subscriptionEnd)}
								</dd>
							</div>
							<div className="flex justify-between gap-4">
								<dt className="text-console-fg-muted">Days remaining</dt>
								<dd
									className={
										daysUntil(usage.subscriptionEnd) <= 7
											? "text-danger"
											: "text-console-fg"
									}
								>
									{daysUntil(usage.subscriptionEnd)}
								</dd>
							</div>
							<p className="border-t border-console-border pt-3 text-xs text-console-fg-muted">
								Pro does not auto-renew. Pay again before this date to extend
								without a gap.
							</p>
						</dl>
					) : null}

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
								{/*
								  A list, not `features.join(" · ")`.

								  Joined, each plan read as one run of text — "1 runtime · 100
								  executions/hour · Community support" — so comparing a column
								  against the one beside it meant re-parsing a sentence rather
								  than reading across a row. The features are already a
								  string[]; they were being flattened at the last step.
								  Check-marked to match UpgradePlanDialog, so the two places
								  that sell Pro look like each other.
								*/}
								<ul className="mt-3 grow space-y-2">
									{tier.features.map((feature) => (
										<li
											className="flex gap-2 text-sm text-console-fg-muted"
											key={feature}
										>
											<span aria-hidden="true" className="text-accent">
												✓
											</span>
											<span>{feature}</span>
										</li>
									))}
								</ul>
								<div className="mt-4">
									{tier.id === "pro" ? (
										usage?.tier === "pro" || usage?.tier === "enterprise" ? (
											<div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
												You are on the {usage.tier} plan.
											</div>
										) : (
											// A page rather than a dialog: choosing an interval and
											// entering a coupon is more than a modal should carry,
											// and a checkout worth linking to is worth a URL.
											<Button href="/upgrade">Upgrade to Pro</Button>
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
