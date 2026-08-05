/**
 * What Pro costs, for display only when the API cannot be reached.
 *
 * **The server is authoritative.** The charge is computed from `PRO_PRICE_USD`
 * in `apps/server`, and `GET /v1/billing/plans` returns it as `priceUsd` along
 * with the derived `yearly` block. Every page that shows a price reads that
 * response; these constants exist so a failed plans call renders something
 * true-as-of-last-release rather than a blank.
 *
 * The dashboard used to state the price in three places and they had drifted to
 * $49 while the pricing page, the marketing site, the structured data and the
 * server all said $50 — the button advertised one price and the checkout
 * charged another. One constant means the next change cannot half-land.
 *
 * Change alongside the server's default, and alongside `apps/website`'s pricing
 * page and homepage preview, which hold their own copies for the same reason.
 */
export const PRO_PRICE_USD = 50;

/**
 * Yearly is *derived*, exactly as the server derives it.
 *
 * Two independent prices drift, and the drift is invisible until somebody
 * notices the yearly plan has become the worse deal. Mirrors
 * `apps/server/src/domain/billing/pricing.ts`.
 */
export const YEARLY_DISCOUNT_PERCENT = 20;

export const YEARLY_FALLBACK = {
	priceUsd: Math.round(
		PRO_PRICE_USD * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100),
	),
	listPriceUsd: PRO_PRICE_USD * 12,
	discountPercent: YEARLY_DISCOUNT_PERCENT,
};
