/**
 * What Pro costs, for display.
 *
 * The dashboard used to state this in three places and they had drifted to $49
 * while the pricing page, the marketing homepage, the structured data and the
 * server all said $50 — so the button advertised one price and the checkout
 * charged another. One constant means the next change cannot half-land.
 *
 * **The server is authoritative, not this file.** The charge is computed from
 * `PRO_PRICE_USD` in `apps/server`, and `GET /v1/billing/plans` returns that
 * value as `priceUsd`. This is a copy kept for rendering without a round trip
 * on a dialog header and a button label, so it has to be changed alongside the
 * server's default — and alongside `apps/website`'s pricing page and homepage
 * preview, which hold their own copies for the same reason.
 *
 * If that coupling ever bites, the drift-proof version is to read
 * `/v1/billing/plans` and accept a loading state in the two places a purchase
 * decision is actually made.
 */
export const PRO_PRICE_USD = 50;

/** `$50`. The form used in a button or a heading. */
export const PRO_PRICE_LABEL = `$${PRO_PRICE_USD}`;

/** `$50/mo`. The form used where the interval matters. */
export const PRO_PRICE_MONTHLY_LABEL = `${PRO_PRICE_LABEL}/mo`;
