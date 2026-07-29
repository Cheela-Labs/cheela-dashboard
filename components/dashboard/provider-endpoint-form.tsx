"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCheelaApi } from "@/lib/use-cheela-api";

const inputClass =
	"w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60";

interface EndpointResponse {
	readonly endpoint?: string;
}

/**
 * Capability endpoint for one runtime.
 *
 * Provider and model used to be set here, backed by a customer-supplied API
 * key. They are not configurable any more: every execution runs on Cheela's own
 * OpenRouter credential so the tokens can be metered and billed. They are shown
 * read-only because "which model answered" is still worth knowing.
 */
export function ProviderEndpointForm({
	runtimeId,
	provider,
	model,
	endpoint,
}: {
	runtimeId: string;
	provider: string;
	model: string;
	endpoint?: string;
}) {
	const { request } = useCheelaApi();
	const router = useRouter();
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError(null);
		setStatus(null);

		const form = new FormData(event.currentTarget);
		const nextEndpoint = String(form.get("endpoint") ?? "").trim();

		try {
			await request<EndpointResponse>(`/v1/runtimes/${runtimeId}/endpoint`, {
				method: "PUT",
				body: JSON.stringify({ endpoint: nextEndpoint }),
			});

			setStatus("Saved");
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card className="space-y-5 p-6">
			<div className="space-y-1">
				<h2 className="text-lg font-medium text-console-fg">
					Model &amp; endpoint
				</h2>
				<p className="text-sm leading-6 text-console-fg-muted">
					Cheela runs your executions on its own model and reaches your
					capabilities at this endpoint.
				</p>
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2 text-sm">
					<span className="block text-console-fg-muted">Provider</span>
					<div className="rounded-lg border border-console-border bg-black/20 px-4 py-3 text-console-fg-muted">
						{provider}
					</div>
				</div>
				<div className="space-y-2 text-sm">
					<span className="block text-console-fg-muted">Model</span>
					<div className="rounded-lg border border-console-border bg-black/20 px-4 py-3 text-console-fg-muted">
						{model}
					</div>
				</div>
			</div>

			<form className="space-y-5" onSubmit={onSubmit}>
				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">Capability endpoint</span>
					<input
						className={inputClass}
						defaultValue={endpoint ?? ""}
						name="endpoint"
						placeholder="https://app.example.com/cheela/execute"
						type="url"
					/>
				</label>

				{error ? <p className="text-sm text-danger">{error}</p> : null}
				{status ? <p className="text-sm text-accent">{status}</p> : null}

				<Button disabled={saving} type="submit">
					{saving ? "Saving…" : "Save"}
				</Button>
			</form>
		</Card>
	);
}
