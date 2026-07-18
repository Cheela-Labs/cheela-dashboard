"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCheelaApi } from "@/lib/use-cheela-api";

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
	if (typeof window === "undefined") {
		return Promise.resolve();
	}
	if (window.Razorpay) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Razorpay"));
		document.body.appendChild(script);
	});
}

export function UpgradeButton({
	currentTier,
	onUpgraded,
}: {
	currentTier?: string;
	onUpgraded?: () => void;
}) {
	const { request } = useCheelaApi();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (currentTier === "pro" || currentTier === "enterprise") {
		return (
			<div className="rounded-2xl border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.08)] px-4 py-3 text-sm text-emerald-300">
				You are on the {currentTier} plan.
			</div>
		);
	}

	async function handleUpgrade() {
		setLoading(true);
		setMessage(null);

		try {
			await loadRazorpay();

			const order = await request<{
				orderId: string;
				amount: number;
				currency: string;
				keyId: string;
			}>("/v1/billing/checkout", {
				method: "POST",
				body: JSON.stringify({ plan: "pro" }),
			});

			if (!window.Razorpay) {
				throw new Error("Razorpay checkout is unavailable");
			}

			const razorpay = new window.Razorpay({
				key: order.keyId,
				amount: order.amount,
				currency: order.currency,
				name: "Cheela Cloud",
				description: "Pro plan",
				order_id: order.orderId,
				theme: { color: "#d4a017" },
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
					onUpgraded?.();
				},
			});

			razorpay.open();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Checkout failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-3">
			<Button onClick={handleUpgrade} disabled={loading}>
				{loading ? "Opening checkout…" : "Upgrade to Pro — ₹999"}
			</Button>
			{message ? (
				<p className="text-sm text-[var(--muted)]">{message}</p>
			) : null}
		</div>
	);
}
