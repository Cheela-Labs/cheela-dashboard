/** Client-safe API URL helper (no server-only imports). */
export function getApiUrl(): string {
	return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
}
