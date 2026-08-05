import { apiFetch } from "./api";
import type {
	AnalyticsSummary,
	ExecutionDetail,
	ExecutionSummary,
	MessageShape,
	OwnerUsage,
	Project,
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

/**
 * @param projectId Narrows the listing to one project. Omitted means every
 * runtime the owner has, which is what the analytics and executions views want
 * — those are owner-scoped on the server and have no project filter to pass.
 */
export async function fetchRuntimes(projectId?: string) {
	const runtimes: RuntimeSummary[] = [];
	let cursor: string | null = null;

	for (let page = 0; page < MAX_RUNTIME_PAGES; page += 1) {
		const query = new URLSearchParams();
		if (projectId) query.set("projectId", projectId);
		if (cursor) query.set("cursor", cursor);
		const suffix = query.size > 0 ? `?${query}` : "";

		const data: { runtimes: RuntimeSummary[]; nextCursor: string | null } =
			await apiFetch(`/v1/runtimes${suffix}`);

		runtimes.push(...data.runtimes);
		cursor = data.nextCursor;
		if (!cursor) break;
	}

	return runtimes.map(normalizeRuntime);
}

/**
 * The owner's projects.
 *
 * `GET /v1/projects` creates the default on first read, so this never returns
 * an empty list for a live account — which is what lets the selector treat
 * "no projects" as an API failure rather than a state to render.
 */
export async function fetchProjects() {
	const data = await apiFetch<{ projects: Project[] }>("/v1/projects");
	return data.projects;
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

/**
 * One runtime's executions.
 *
 * A different route from `fetchExecutions`, because `GET /v1/executions` is
 * owner-scoped with no runtime filter, while `GET /v1/traces/runtime/:id`
 * exists precisely for this and is served by the `{runtimeId, startedAt}`
 * index. It returns raw traces rather than the mapped summary, so the shapes
 * are reconciled here — a panel showing every runtime's executions beside
 * figures scoped to one would be worse than not scoping at all.
 */
export async function fetchExecutionsForRuntime(runtimeId: string, limit = 50) {
	const data = await apiFetch<{
		traces: Array<{
			executionId: string;
			runtimeId: string;
			status: ExecutionSummary["status"];
			finishReason?: string;
			durationMs?: number;
			capabilityCalls?: unknown[];
			startedAt: string;
			completedAt?: string;
			error?: string;
		}>;
	}>(`/v1/traces/runtime/${encodeURIComponent(runtimeId)}?limit=${limit}`);

	return data.traces.map(
		(trace): ExecutionSummary => ({
			executionId: trace.executionId,
			runtimeId: trace.runtimeId,
			status: trace.status,
			finishReason: trace.finishReason,
			durationMs: trace.durationMs,
			capabilityCalls: trace.capabilityCalls?.length ?? 0,
			startedAt: trace.startedAt,
			completedAt: trace.completedAt,
			error: trace.error,
		}),
	);
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
	query: {
		from?: string;
		to?: string;
		bucket?: string;
		/** Narrows every figure to one runtime. Omitted means the whole account. */
		runtimeId?: string;
	} = {},
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
