export type RuntimeTier = "free" | "pro";

export type RuntimeSummary = {
	runtimeId: string;
	version: string;
	tier: RuntimeTier;
	capabilities: string[] | Array<{ name: string }>;
	provider: string | { provider: string; model?: string; hasApiKey?: boolean };
	model?: string;
	endpoint?: string;
	/** Whether a provider API key is stored for this runtime. The key itself is never returned. */
	hasProviderKey?: boolean;
	/** Display fragments only — the keys themselves are stored hashed. */
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

export type ExecutionSummary = {
	executionId: string;
	runtimeId: string;
	status: "running" | "completed" | "failed";
	finishReason?: string;
	durationMs?: number;
	capabilityCalls: number;
	startedAt: string;
	completedAt?: string;
	preview: string;
	error?: string;
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
	p95: number;
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
	latency?: { p50: number; p95: number; p99: number };
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
	limits?: {
		maxExecutionsPerDay: number;
		maxCapabilityCallsPerDay: number;
	};
	/** ISO. The usage window is the UTC day. */
	periodStart?: string;
	periodEnd?: string;
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
	messages?: unknown[];
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
		typeof runtime.provider === "string"
			? runtime.provider
			: runtime.provider.provider;
	const modelName =
		runtime.model ??
		(typeof runtime.provider === "object"
			? runtime.provider.model
			: undefined) ??
		"—";

	return {
		...runtime,
		capabilityNames,
		providerName,
		modelName,
		status: runtime.status ?? "healthy",
		connection: runtime.connection,
		deployment: runtime.deployment,
	};
}
