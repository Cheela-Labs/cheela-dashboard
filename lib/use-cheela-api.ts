"use client";

const PROXY_PREFIX = "/api/proxy";

export function useCheelaApi() {
	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		const response = await fetch(`${PROXY_PREFIX}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(init?.headers ?? {}),
			},
		});

		if (!response.ok) {
			const body = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			throw new Error(
				body?.error?.message ?? `Request failed (${response.status})`,
			);
		}

		return (await response.json()) as T;
	}

	return { request, apiUrl: PROXY_PREFIX };
}
