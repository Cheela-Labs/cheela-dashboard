"use client";

import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function useCheelaApi() {
	const { getToken } = useAuth();

	async function request<T>(path: string, init?: RequestInit): Promise<T> {
		const token = await getToken();
		const response = await fetch(`${API_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(init?.headers ?? {}),
			},
		});

		if (!response.ok) {
			const body = (await response.json().catch(() => null)) as {
				error?: { message?: string };
			} | null;
			throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
		}

		return (await response.json()) as T;
	}

	return { request, apiUrl: API_URL };
}
