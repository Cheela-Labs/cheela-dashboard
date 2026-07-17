export type RuntimeTier = "free" | "pro";

export type RuntimeSummary = {
	runtimeId: string;
	version: string;
	tier: RuntimeTier;
	capabilities: string[] | Array<{ name: string }>;
	provider: string | { provider: string; model?: string };
	model?: string;
	endpoint?: string;
	status?: "healthy" | "degraded" | "offline";
	updatedAt: string;
	createdAt?: string;
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
};

export type OwnerUsage = {
	ownerId: string;
	tier: "free" | "pro" | "enterprise";
	executions: number;
	capabilityCalls: number;
	inputTokens: number;
	outputTokens: number;
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
		(typeof runtime.provider === "object" ? runtime.provider.model : undefined) ??
		"—";

	return {
		...runtime,
		capabilityNames,
		providerName,
		modelName,
		status: runtime.status ?? "healthy",
	};
}
