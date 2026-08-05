"use client";

import { Check, Loader2, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BillingInterval, BillingQuote } from "@/lib/types";
import { useCheelaApi } from "@/lib/use-cheela-api";
import { cn } from "@/lib/utils";

declare global {
	interface Window {
		Razorpay?: new (
			options: Record<string, unknown>,
		) => {
			open: () => void;
		};
	}
}

function loadRazorpay(): Promise<void> {
	if (typeof window === "undefined" || window.Razorpay)
		return Promise.resolve();

	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Razorpay"));
		document.body.appendChild(script);
	});
}

/** Paise → "₹4,150". The charge is in INR whatever the plan is quoted in. */
function formatInr(paise: number): string {
	return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export function UpgradeCheckout({
	monthlyUsd,
	yearly,
	currentTier,
}: {
	monthlyUsd: number;
	yearly: { priceUsd: number; listPriceUsd: number; discountPercent: number };
	currentTier?: string;
}) {
	const { request } = useCheelaApi();
	const [interval, setInterval] = useState<BillingInterval>("monthly");
	const [code, setCode] = useState("");
	const [applied, setApplied] = useState<BillingQuote["coupon"] | null>(null);
	const [quote, setQuote] = useState<BillingQuote | null>(null);
	const [couponError, setCouponError] = useState<string | null>(null);
	const [checkingCode, setCheckingCode] = useState(false);
	const [paying, setPaying] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const alreadyPro = currentTier === "pro" || currentTier === "enterprise";

	/**
	 * Warm the checkout script while the page is idle.
	 *
	 * Everything used to happen after the click — DNS, TLS, the script download,
	 * an order round trip, and only then the modal loading its own payment
	 * methods. That whole chain was the gap between pressing Upgrade and being
	 * able to touch Card or UPI.
	 */
	useEffect(() => {
		if (alreadyPro) return;
		void loadRazorpay().catch(() => {});
	}, [alreadyPro]);

	/**
	 * Re-quote whenever the interval changes.
	 *
	 * The amount shown always comes from the server, never from arithmetic here:
	 * this page and the charge have to agree, and only one of them can be the
	 * authority.
	 */
	useEffect(() => {
		let cancelled = false;

		void (async () => {
			try {
				const next = await request<BillingQuote>("/v1/billing/quote", {
					method: "POST",
					body: JSON.stringify({
						interval,
						...(applied ? { code: applied.code } : {}),
					}),
				});
				if (!cancelled) setQuote(next);
			} catch {
				// A failed quote leaves the USD figures below, which are static and
				// still correct. The charge is computed server-side regardless.
				if (!cancelled) setQuote(null);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [interval, applied, request]);

	async function applyCode() {
		const trimmed = code.trim();
		if (!trimmed) return;

		setCheckingCode(true);
		setCouponError(null);
		try {
			const next = await request<BillingQuote>("/v1/billing/quote", {
				method: "POST",
				body: JSON.stringify({ interval, code: trimmed }),
			});
			setQuote(next);
			setApplied(next.coupon ?? null);
		} catch (error) {
			setApplied(null);
			setCouponError(
				error instanceof Error ? error.message : "Could not check that code",
			);
		} finally {
			setCheckingCode(false);
		}
	}

	async function pay() {
		setPaying(true);
		setMessage(null);

		try {
			const [, order] = await Promise.all([
				loadRazorpay(),
				request<{
					orderId: string;
					amount: number;
					currency: string;
					keyId: string;
				}>("/v1/billing/checkout", {
					method: "POST",
					body: JSON.stringify({
						plan: "pro",
						interval,
						// Sent as a key to look up, not as a discount. The server
						// re-validates it and computes the amount itself.
						...(applied ? { code: applied.code } : {}),
					}),
				}),
			]);

			if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");

			const razorpay = new window.Razorpay({
				key: order.keyId,
				amount: order.amount,
				currency: order.currency,
				name: "Cheela Cloud",
				description: interval === "yearly" ? "Pro — yearly" : "Pro — monthly",
				order_id: order.orderId,
				theme: { color: "#FFA600" },
				handler: async (response: {
					razorpay_order_id: string;
					razorpay_payment_id: string;
					razorpay_signature: string;
				}) => {
					await request("/v1/billing/verify", {
						method: "POST",
						body: JSON.stringify(response),
					});
					setMessage("Upgraded to Pro. Welcome aboard.");
				},
			});

			razorpay.open();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Checkout failed");
		} finally {
			setPaying(false);
		}
	}

	if (alreadyPro) {
		return (
			<Card className="p-6 text-sm text-success sm:p-8">
				You are on the {currentTier} plan.
			</Card>
		);
	}

	const usd = interval === "yearly" ? yearly.priceUsd : monthlyUsd;
	const perMonth =
		interval === "yearly"
			? Math.round((yearly.priceUsd / 12) * 100) / 100
			: null;

	return (
		<Card className="space-y-6 p-6 sm:p-8">
			{/*
			  A two-position control, not a range input. "Slider" describes how it
			  looks; a range with two stops is a worse toggle in every way that
			  matters — keyboard, screen reader, and the tap target.
			*/}
			<fieldset
				aria-label="Billing interval"
				className="inline-flex rounded-lg border border-console-border bg-white/[0.02] p-1"
			>
				{(["monthly", "yearly"] as const).map((option) => (
					<button
						aria-pressed={interval === option}
						className={cn(
							"rounded-md px-4 py-1.5 text-sm capitalize transition",
							interval === option
								? "bg-accent text-ink-0"
								: "text-console-fg-muted hover:text-console-fg",
						)}
						key={option}
						onClick={() => setInterval(option)}
						type="button"
					>
						{option}
						{option === "yearly" ? (
							<span
								className={cn(
									"ml-2 text-2xs",
									interval === "yearly" ? "text-ink-0/80" : "text-accent",
								)}
							>
								−{yearly.discountPercent}%
							</span>
						) : null}
					</button>
				))}
			</fieldset>

			<div>
				<div className="flex items-baseline gap-2">
					<span className="font-display text-4xl font-bold text-console-fg">
						${usd}
					</span>
					<span className="text-sm text-console-fg-muted">
						/{interval === "yearly" ? "year" : "month"}
					</span>
				</div>
				{interval === "yearly" ? (
					<p className="mt-1 text-sm text-console-fg-muted">
						${perMonth}/month, billed yearly —{" "}
						<span className="text-accent">
							save ${yearly.listPriceUsd - yearly.priceUsd} a year
						</span>
					</p>
				) : null}
			</div>

			<div className="space-y-2 border-t border-console-border pt-5">
				<label
					className="font-mono text-2xs uppercase tracking-wide text-console-fg-muted"
					htmlFor="coupon"
				>
					Coupon code
				</label>
				<div className="flex gap-2">
					<input
						className="min-w-0 flex-1 rounded-lg border border-console-border bg-black/30 px-3 py-2 font-mono text-sm uppercase text-console-fg placeholder:normal-case placeholder:text-console-fg-muted focus:border-accent/40 focus:outline-none"
						id="coupon"
						onChange={(event) => setCode(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								void applyCode();
							}
						}}
						placeholder="Have a code?"
						value={code}
					/>
					<Button
						disabled={checkingCode || !code.trim()}
						onClick={() => void applyCode()}
						variant="secondary"
					>
						{checkingCode ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Tag className="size-4" />
						)}
						Apply
					</Button>
				</div>

				{couponError ? (
					<p className="text-xs text-danger">{couponError}</p>
				) : null}

				{applied ? (
					<p className="flex items-center gap-1.5 text-xs text-success">
						<Check className="size-3.5" />
						{applied.code} applied — {applied.percentOff}% off
					</p>
				) : null}
			</div>

			{/*
			  Every figure here comes from POST /v1/billing/quote. The page never
			  computes a discount: `/checkout` re-validates the code and works the
			  amount out again, so a tampered quote changes what is displayed and
			  nothing about what is charged.
			*/}
			{quote ? (
				<dl className="space-y-2 border-t border-console-border pt-5 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-console-fg-muted">Subtotal</dt>
						<dd className="text-console-fg">{formatInr(quote.listAmount)}</dd>
					</div>
					{quote.coupon ? (
						<div className="flex justify-between gap-4">
							<dt className="text-console-fg-muted">
								Discount ({quote.coupon.code})
							</dt>
							<dd className="text-success">
								−{formatInr(quote.coupon.discount)}
							</dd>
						</div>
					) : null}
					<div className="flex justify-between gap-4 border-t border-console-border pt-2 font-medium">
						<dt className="text-console-fg">Total today</dt>
						<dd className="text-console-fg">{formatInr(quote.amount)}</dd>
					</div>
					<p className="pt-1 text-xs text-console-fg-muted">
						Charged in INR via Razorpay at the configured USD→INR rate.
					</p>
				</dl>
			) : null}

			<div className="space-y-3">
				<Button className="w-full" disabled={paying} onClick={() => void pay()}>
					{paying
						? "Opening checkout…"
						: `Pay ${quote ? formatInr(quote.amount) : `$${usd}`}`}
				</Button>
				{message ? (
					<p className="text-sm text-console-fg-muted">{message}</p>
				) : null}
				{/*
				  Stated rather than implied. These are one-off Razorpay orders, not
				  a recurring subscription — nothing renews on its own, and a page
				  that let somebody assume otherwise would be setting up a lapse
				  they did not see coming.
				*/}
				<p className="text-xs text-console-fg-muted">
					One-time payment. Pro runs for{" "}
					{interval === "yearly" ? "365 days" : "30 days"} and does not
					auto-renew — pay again to extend.
				</p>
			</div>
		</Card>
	);
}
