import { auth } from "@clerk/nextjs/server";
import { getApiUrl } from "./api-url";

export class ApiError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

async function getAuthHeaders(): Promise<HeadersInit> {
	const session = await auth();
	const token = await session.getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

export async function apiFetch<T>(
	path: string,
	init?: RequestInit,
): Promise<T> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${getApiUrl()}${path}`, {
		...init,
		headers: {
			...headers,
			...(init?.headers ?? {}),
		},
		cache: "no-store",
	});

	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			error?: { message?: string; code?: string };
		} | null;
		throw new ApiError(
			body?.error?.message ?? `Request failed (${response.status})`,
			response.status,
			body?.error?.code,
		);
	}

	return (await response.json()) as T;
}
