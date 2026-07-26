"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCheelaApi } from "@/lib/use-cheela-api";

const PROVIDERS = ["openai", "anthropic", "gemini", "openrouter"] as const;

const inputClass =
	"w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60";

interface ProviderResponse {
	readonly hasProviderKey: boolean;
}

/**
 * Provider credentials and capability endpoint for one runtime.
 *
 * The API key field is write-only — the server never returns a stored key, only
 * whether one exists — so an empty field means "leave the stored key alone",
 * not "clear it". Clearing is the explicit Remove key action.
 */
export function ProviderEndpointForm({
	runtimeId,
	provider,
	model,
	endpoint,
	hasProviderKey,
}: {
	runtimeId: string;
	provider: string;
	model: string;
	endpoint?: string;
	hasProviderKey: boolean;
}) {
	const { request } = useCheelaApi();
	const router = useRouter();
	const [keyStored, setKeyStored] = useState(hasProviderKey);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		setStatus(null);

		const form = new FormData(event.currentTarget);
		const apiKey = String(form.get("apiKey") ?? "").trim();
		const nextEndpoint = String(form.get("endpoint") ?? "").trim();

		try {
			const result = await request<ProviderResponse>(
				`/v1/runtimes/${runtimeId}/provider`,
				{
					method: "PUT",
					body: JSON.stringify({
						provider: form.get("provider"),
						model: form.get("model"),
						...(apiKey ? { apiKey } : {}),
						...(nextEndpoint ? { endpoint: nextEndpoint } : {}),
					}),
				},
			);

			setKeyStored(result.hasProviderKey);
			setStatus("Saved");
			event.currentTarget.reset();
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	async function removeKey() {
		setSaving(true);
		setError(null);
		setStatus(null);

		try {
			const result = await request<ProviderResponse>(
				`/v1/runtimes/${runtimeId}/provider-key`,
				{ method: "DELETE" },
			);
			setKeyStored(result.hasProviderKey);
			setStatus("API key removed");
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Remove failed");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="space-y-5 p-6">
			<div className="space-y-1">
				<h2 className="text-lg font-medium text-console-fg">
					Provider &amp; endpoint
				</h2>
				<p className="text-sm leading-6 text-console-fg-muted">
					Cheela calls the model with this key and reaches your capabilities at
					this endpoint. Both are required for server-side execution.
				</p>
			</div>

			<form className="space-y-5" onSubmit={onSubmit}>
				<div className="grid gap-5 sm:grid-cols-2">
					<label className="block space-y-2 text-sm">
						<span className="text-console-fg-muted">Provider</span>
						<select
							name="provider"
							defaultValue={provider}
							className={inputClass}
						>
							{PROVIDERS.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
					</label>
					<label className="block space-y-2 text-sm">
						<span className="text-console-fg-muted">Model</span>
						<input name="model" defaultValue={model} className={inputClass} />
					</label>
				</div>

				<label className="block space-y-2 text-sm">
					<span className="flex items-center justify-between gap-3">
						<span className="text-console-fg-muted">Provider API key</span>
						<span
							className={
								keyStored
									? "text-xs text-accent"
									: "text-xs text-console-fg-muted"
							}
						>
							{keyStored ? "configured ✓" : "not set"}
						</span>
					</span>
					<input
						name="apiKey"
						type="password"
						autoComplete="off"
						placeholder={keyStored ? "Leave blank to keep current key" : "sk-…"}
						className={inputClass}
					/>
					<span className="block text-xs text-console-fg-muted">
						Encrypted at rest and never returned by the API.
					</span>
				</label>

				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">Capability endpoint</span>
					<input
						name="endpoint"
						type="url"
						defaultValue={endpoint ?? ""}
						placeholder="https://app.example.com/cheela/execute"
						className={inputClass}
					/>
				</label>

				{error ? <p className="text-sm text-danger">{error}</p> : null}
				{status ? <p className="text-sm text-accent">{status}</p> : null}

				<div className="flex flex-wrap gap-3">
					<Button type="submit" disabled={saving}>
						{saving ? "Saving…" : "Save"}
					</Button>
					{keyStored ? (
						<Button
							type="button"
							variant="secondary"
							disabled={saving}
							onClick={removeKey}
						>
							Remove key
						</Button>
					) : null}
				</div>
			</form>
		</Card>
	);
}
