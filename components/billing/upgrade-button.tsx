"use client";

import { useEffect, useState } from "react";
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

	/**
	 * Fetch the checkout script while the page is idle, not when the button is
	 * pressed.
	 *
	 * Everything used to happen after the click: a cold DNS lookup and TLS
	 * handshake to checkout.razorpay.com, the script download, then an order
	 * round trip, and only then the modal — which then loads its own payment
	 * methods. That whole chain was the gap between pressing Upgrade and being
	 * able to touch Card or UPI.
	 *
	 * Warming it here moves the two slowest parts off the interaction. Placed
	 * before the early return below because hooks cannot be conditional; the
	 * tier check therefore lives inside, so nobody already paying downloads a
	 * payment script they will never open.
	 *
	 * Failure is ignored deliberately — the click path calls this again and is
	 * where an error belongs. A toast about a script nobody asked for yet is
	 * noise.
	 */
	useEffect(() => {
		if (currentTier === "pro" || currentTier === "enterprise") return;
		void loadRazorpay().catch(() => {});
	}, [currentTier]);

	if (currentTier === "pro" || currentTier === "enterprise") {
		return (
			<div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
				You are on the {currentTier} plan.
			</div>
		);
	}

	async function handleUpgrade() {
		setLoading(true);
		setMessage(null);

		try {
			// Concurrent, because they do not depend on each other. Serially this
			// was a script download followed by an order round trip; the script
			// is usually already warm from the effect above, so this mostly costs
			// nothing — but on a cold cache it halves the wait rather than
			// stacking it.
			const [, order] = await Promise.all([
				loadRazorpay(),
				request<{
					orderId: string;
					amount: number;
					currency: string;
					keyId: string;
				}>("/v1/billing/checkout", {
					method: "POST",
					body: JSON.stringify({ plan: "pro" }),
				}),
			]);

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
				{loading ? "Opening checkout…" : "Upgrade to Pro — $49"}
			</Button>
			{message ? (
				<p className="text-sm text-console-fg-muted">{message}</p>
			) : null}
		</div>
	);
}
