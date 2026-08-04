import { apiFetch } from "./api";
import type {
	AnalyticsSummary,
	ExecutionDetail,
	ExecutionSummary,
	MessageShape,
	OwnerUsage,
	RuntimeSummary,
	TraceCapabilityCall,
} from "./types";
import { normalizeRuntime } from "./types";

/**
 * Every runtime the owner has, following the cursor.
 *
 * `GET /v1/runtimes` is paginated now. Free and Pro cap out at 1 and 10
 * runtimes so they never reach a second page, but Enterprise has no ceiling —
 * reading only the first page would silently hide the rest from the very
 * customers most likely to have them. Bounded so a cursor bug cannot spin
 * forever.
 */
const MAX_RUNTIME_PAGES = 20;

export async function fetchRuntimes() {
	const runtimes: RuntimeSummary[] = [];
	let cursor: string | null = null;

	for (let page = 0; page < MAX_RUNTIME_PAGES; page += 1) {
		const data: { runtimes: RuntimeSummary[]; nextCursor: string | null } =
			await apiFetch(
				cursor
					? `/v1/runtimes?cursor=${encodeURIComponent(cursor)}`
					: "/v1/runtimes",
			);

		runtimes.push(...data.runtimes);
		cursor = data.nextCursor;
		if (!cursor) break;
	}

	return runtimes.map(normalizeRuntime);
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
			messageShape?: MessageShape[];
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
		error: data.error,
		capabilityCalls: Array.isArray(data.capabilityCalls)
			? data.capabilityCalls.length
			: (data.capabilityCalls ?? 0),
		capabilityCallsDetail: detailCalls,
		messageShape: data.messageShape,
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
