import { apiFetch } from "./api";
import type {
	AnalyticsSummary,
	ExecutionDetail,
	ExecutionSummary,
	OwnerUsage,
	RuntimeSummary,
	TraceCapabilityCall,
} from "./types";
import { normalizeRuntime } from "./types";

export async function fetchRuntimes() {
	const data = await apiFetch<{ runtimes: RuntimeSummary[] }>("/v1/runtimes");
	return data.runtimes.map(normalizeRuntime);
}

export async function fetchRuntime(runtimeId: string) {
	const runtime = await apiFetch<RuntimeSummary>(`/v1/runtimes/${runtimeId}`);
	return normalizeRuntime(runtime);
}

export async function fetchExecutions(limit = 50) {
	const data = await apiFetch<{ executions: ExecutionSummary[] }>(
		`/v1/executions?limit=${limit}`,
	);
	return data.executions;
}

export async function fetchExecution(executionId: string) {
	const data = await apiFetch<
		ExecutionSummary & {
			capabilityCalls?: number | TraceCapabilityCall[];
			messages?: unknown[];
			inputTokens?: number;
			outputTokens?: number;
			totalTokens?: number;
			error?: string;
		}
	>(`/v1/executions/${executionId}`);

	const detailCalls = Array.isArray(data.capabilityCalls)
		? data.capabilityCalls
		: [];

	return {
		executionId: data.executionId,
		runtimeId: data.runtimeId,
		status: data.status,
		finishReason: data.finishReason,
		durationMs: data.durationMs,
		startedAt: data.startedAt,
		completedAt: data.completedAt,
		preview: data.preview,
		error: data.error,
		capabilityCalls: Array.isArray(data.capabilityCalls)
			? data.capabilityCalls.length
			: (data.capabilityCalls ?? 0),
		capabilityCallsDetail: detailCalls,
		messages: data.messages,
		inputTokens: data.inputTokens,
		outputTokens: data.outputTokens,
		totalTokens: data.totalTokens,
	} satisfies ExecutionDetail & {
		capabilityCallsDetail: TraceCapabilityCall[];
	};
}

export async function fetchAnalytics(
	query: { from?: string; to?: string; bucket?: string } = {},
) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value) params.set(key, value);
	}

	const search = params.toString();
	return apiFetch<AnalyticsSummary>(
		`/v1/analytics/summary${search ? `?${search}` : ""}`,
	);
}

export async function fetchUsage() {
	return apiFetch<OwnerUsage>("/v1/billing/usage");
}

export async function fetchPlans() {
	return apiFetch<{
		plans: Array<{
			id: string;
			name: string;
			priceUsd: number | null;
			priceLabel?: string;
			contactUrl?: string;
			currency?: string;
			interval?: string;
			features: string[];
			razorpayEnabled?: boolean;
		}>;
	}>("/v1/billing/plans");
}
