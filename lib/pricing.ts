/**
 * What Pro costs, for display only when the API cannot be reached.
 *
 * **The server is authoritative.** The charge is computed from `PRO_PRICE_USD`
 * in `apps/server`, and `GET /v1/billing/plans` returns it as `priceUsd` along
 * with the derived `yearly` block. Every page that shows a price reads that
 * response; these constants exist so a failed plans call renders something
 * true-as-of-last-release rather than a blank.
 *
 * The dashboard once stated the price in three places and they had drifted
 * apart, so the button advertised one figure and the checkout charged another.
 * One constant means the next change cannot half-land.
 *
 * Change alongside the server's `PRO_PRICE_USD` default, and alongside
 * `apps/website`'s pricing page, homepage preview and structured data, which
 * hold their own copies for the same reason. There are five places in total and
 * they must agree — structured data especially, because a price in JSON-LD that
 * disagrees with the page is a Google Merchant violation, not just a typo.
 */
export const PRO_PRICE_USD = 49;

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
