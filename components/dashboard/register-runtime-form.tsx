"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCheelaApi } from "@/lib/use-cheela-api";

export function RegisterRuntimeForm() {
	const { request } = useCheelaApi();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [secret, setSecret] = useState<string | null>(null);
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [runtimeId, setRuntimeId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);

		const form = new FormData(event.currentTarget);
		const capabilities = String(form.get("capabilities") ?? "")
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean)
			.map((name) => ({ name }));

		try {
			const result = await request<{
				runtimeId: string;
				secret: string;
				apiKey: string;
			}>("/v1/runtimes", {
				method: "POST",
				body: JSON.stringify({
					version: form.get("version"),
					tier: form.get("tier"),
					capabilities,
					provider: {
						provider: form.get("provider"),
						model: form.get("model"),
						apiKey: form.get("apiKey"),
					},
					endpoint: form.get("endpoint") || undefined,
				}),
			});

			setRuntimeId(result.runtimeId);
			setSecret(result.secret);
			setApiKey(result.apiKey);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	if (secret && apiKey && runtimeId) {
		return (
			<Card className="max-w-3xl space-y-4 p-6 sm:p-8">
				<div className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">
					Registered
				</div>
				<h2 className="text-2xl font-medium tracking-[-0.04em] text-white">
					Runtime metadata saved
				</h2>
				<p className="text-sm text-[var(--muted)]">
					Set CHEELA_API_KEY in the runtime project, then run cheela deploy.
					Keep the transport secret on the customer runtime. Both are shown
					once.
				</p>
				<pre className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-black/50 p-4 font-mono text-xs text-[var(--primary)]">
					{`runtimeId: ${runtimeId}\nCHEELA_API_KEY: ${apiKey}\ntransportSecret: ${secret}`}
				</pre>
				<Button
					onClick={() => {
						router.push("/runtimes");
						router.refresh();
					}}
				>
					View runtimes
				</Button>
			</Card>
		);
	}

	return (
		<Card className="max-w-3xl p-6 sm:p-8">
			<form className="space-y-6" onSubmit={onSubmit}>
				<div className="grid gap-6 sm:grid-cols-2">
					<label className="block space-y-2 text-sm">
						<span className="text-[var(--muted)]">Version</span>
						<input
							name="version"
							required
							defaultValue="1.0.0"
							className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
						/>
					</label>
					<label className="block space-y-2 text-sm">
						<span className="text-[var(--muted)]">Tier</span>
						<select
							name="tier"
							defaultValue="free"
							className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
						>
							<option value="free">Free — signed HTTPS</option>
							<option value="pro">Pro — persistent session</option>
						</select>
					</label>
				</div>

				<label className="block space-y-2 text-sm">
					<span className="text-[var(--muted)]">
						Capabilities (comma-separated)
					</span>
					<input
						name="capabilities"
						required
						defaultValue="searchUsers, getOrders"
						className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
					/>
				</label>

				<div className="grid gap-6 sm:grid-cols-2">
					<label className="block space-y-2 text-sm">
						<span className="text-[var(--muted)]">Provider</span>
						<select
							name="provider"
							defaultValue="openai"
							className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
						>
							<option value="openai">OpenAI</option>
							<option value="anthropic">Anthropic</option>
							<option value="gemini">Gemini</option>
							<option value="openrouter">OpenRouter</option>
						</select>
					</label>
					<label className="block space-y-2 text-sm">
						<span className="text-[var(--muted)]">Model</span>
						<input
							name="model"
							required
							defaultValue="gpt-4o-mini"
							className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
						/>
					</label>
				</div>

				<label className="block space-y-2 text-sm">
					<span className="text-[var(--muted)]">Provider API key</span>
					<input
						name="apiKey"
						required
						type="password"
						placeholder="sk-…"
						className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
					/>
				</label>

				<label className="block space-y-2 text-sm">
					<span className="text-[var(--muted)]">
						HTTPS endpoint (free tier)
					</span>
					<input
						name="endpoint"
						type="url"
						placeholder="https://app.example.com/cheela/execute"
						className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
					/>
				</label>

				{error ? <p className="text-sm text-red-300">{error}</p> : null}

				<div className="flex flex-wrap gap-3 pt-2">
					<Button type="submit" disabled={loading}>
						{loading ? "Registering…" : "Register runtime"}
					</Button>
					<Button variant="secondary" href="/runtimes">
						Cancel
					</Button>
				</div>
			</form>
		</Card>
	);
}
