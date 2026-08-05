/** Mirrors the server's SubscriptionTier — enterprise accounts exist and this used to omit them. */
export type RuntimeTier = "free" | "pro" | "enterprise";

export type RuntimeSummary = {
	runtimeId: string;
	/** The project this runtime is filed under. Absent on pre-projects runtimes. */
	projectId?: string;
	version: string;
	tier: RuntimeTier;
	capabilities: string[] | Array<{ name: string }>;
	/**
	 * Optional because the control plane stopped sending it per-runtime: every
	 * runtime executes on one central credential and model now, so the list route
	 * omits it entirely and only the detail route reports it.
	 *
	 * This type is a hand-written assertion about a JSON response, not something
	 * derived from the server, so declaring it required did not make it present —
	 * it only stopped `tsc` from noticing when the field went away, and the
	 * dereference below threw at runtime instead.
	 */
	provider?: string | { provider: string; model?: string };
	model?: string;
	endpoint?: string;
	/** Display fragments. The full keys are recoverable via POST /reveal-key. */
	deployKeyPrefix?: string;
	publicKeyPrefix?: string;
	allowedOrigins?: string[];
	status?: "healthy" | "degraded" | "offline";
	updatedAt: string;
	createdAt?: string;
	connection?: {
		status: "online" | "offline";
		transport?: string;
	};
	deployment?: {
		version?: number;
		status: "active";
		deployedAt?: string;
	} | null;
};

/** A grouping of runtimes within one owner, as the server records it. */
export type Project = {
	projectId: string;
	name: string;
	/** Exactly one per owner. Where a runtime lands when none is named. */
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ExecutionSummary = {
	executionId: string;
	runtimeId: string;
	status: "running" | "completed" | "failed";
	finishReason?: string;
	durationMs?: number;
	capabilityCalls: number;
	startedAt: string;
	completedAt?: string;
	error?: string;
};

/**
 * One turn of an execution with its content removed — what the server stores
 * in place of the conversation. `parts` holds part *types* in order, so a run
 * can be read as user → assistant → tool without anything anybody wrote being
 * available to read.
 */
export type MessageShape = {
	role: "system" | "user" | "assistant" | "tool";
	parts: string[];
};

export type AnalyticsBucket = "hour" | "day";

export type AnalyticsRange = {
	from: string;
	to: string;
	bucket: AnalyticsBucket;
	/** True when the tier narrowed the requested window or bucket. */
	clamped: boolean;
	maxWindowDays: number;
};

export type AnalyticsSeriesPoint = {
	t: string;
	requests: number;
	errors: number;
	p50: number;
	/** Null when the tier does not include it. */
	p95: number | null;
	totalTokens: number;
};

export type RuntimeBreakdownEntry = {
	runtimeId: string;
	requests: number;
	errors: number;
	averageLatencyMs: number;
};

export type AnalyticsSummary = {
	ownerId?: string;
	requests: number;
	completed: number;
	failed: number;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	capabilityCalls: number;
	averageLatencyMs: number;
	runtimeUsage: Record<string, number>;
	popularCapabilities: Record<string, number>;
	errors: number;
	/** Optional so an older control plane still renders the cards above. */
	range?: AnalyticsRange;
	series?: AnalyticsSeriesPoint[];
	/** p95/p99 are null when the tier does not include them. */
	latency?: { p50: number; p95: number | null; p99: number | null };
	runtimeBreakdown?: RuntimeBreakdownEntry[];
};

export type OwnerUsage = {
	ownerId: string;
	tier: "free" | "pro" | "enterprise";
	executions: number;
	capabilityCalls: number;
	inputTokens: number;
	outputTokens: number;
	/** Ceilings the counts above are measured against. Optional so an older API still renders. */
	/** `null` for a field means unlimited (enterprise). */
	limits?: {
		maxExecutionsPerHour: number | null;
		rolloverHours: number;
		maxRuntimes: number | null;
	};
	/**
	 * What the owner can spend right now.
	 *
	 * A token bucket cannot be drawn as "used of limit": what is left is
	 * `remaining` of `capacity`, and what can be sustained is `refillPerHour`.
	 * Collapsing them would make this panel disagree with the enforcement.
	 */
	quota?: {
		remaining: number | null;
		capacity: number | null;
		refillPerHour: number | null;
	};
	/** ISO. The usage window is the hour. */
	periodStart?: string;
	periodEnd?: string;
	/**
	 * The paid subscription window — a different thing from `periodEnd`, which
	 * bounds the hourly quota. Optional so an older control plane still renders.
	 */
	subscriptionStatus?: "none" | "active" | "past_due" | "cancelled";
	/** When Pro lapses. These are one-off orders, so an expiry, not a renewal. */
	subscriptionEnd?: string | null;
};

export type BillingInterval = "monthly" | "yearly";

/** What a checkout would cost. Amounts are paise (INR). */
export type BillingQuote = {
	interval: BillingInterval;
	currency: string;
	/** Before any coupon. */
	listAmount: number;
	amount: number;
	coupon?: { code: string; percentOff: number; discount: number };
};

export type TraceCapabilityCall = {
	capability: string;
	toolCallId: string;
	durationMs: number;
	error?: string;
	timestamp: string;
	input?: unknown;
	output?: unknown;
};

export type ExecutionDetail = ExecutionSummary & {
	messageShape?: MessageShape[];
	capabilityCallsDetail?: TraceCapabilityCall[];
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
};

export function normalizeRuntime(runtime: RuntimeSummary): RuntimeSummary & {
	capabilityNames: string[];
	providerName: string;
	modelName: string;
	status: "healthy" | "degraded" | "offline";
	deployment?: {
		version?: number;
		status: "active";
		deployedAt?: string;
	} | null;
} {
	const capabilityNames = runtime.capabilities.map((cap) =>
		typeof cap === "string" ? cap : cap.name,
	);
	const providerName =
		(typeof runtime.provider === "string"
			? runtime.provider
			: runtime.provider?.provider) ?? "—";
	const modelName =
		runtime.model ??
		(typeof runtime.provider === "object"
			? runtime.provider?.model
			: undefined) ??
		"—";

	return {
		...runtime,
		capabilityNames,
		providerName,
		modelName,
		// An absent signal is not a positive one. Defaulting to "healthy" meant a
		// runtime whose status the API did not send rendered as fine.
		status: runtime.status ?? "offline",
		connection: runtime.connection,
		deployment: runtime.deployment,
	};
}
