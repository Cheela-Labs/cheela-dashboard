"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects";
import { useCheelaApi } from "@/lib/use-cheela-api";

export function RegisterRuntimeForm() {
	const { request } = useCheelaApi();
	const { selectedProjectId, assignRuntime } = useProjects();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [runtimeId, setRuntimeId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);

		const form = new FormData(event.currentTarget);
		const name = String(form.get("name") ?? "").trim();

		try {
			const result = await request<{
				runtimeId: string;
				apiKey: string;
			}>("/v1/runtimes", {
				method: "POST",
				body: JSON.stringify({
					version: form.get("version") || "0.0.0",
					tier: form.get("tier") || "free",
					...(name ? { name } : {}),
				}),
			});

			setRuntimeId(result.runtimeId);
			setApiKey(result.apiKey);
			if (selectedProjectId) {
				assignRuntime(result.runtimeId, selectedProjectId);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	if (apiKey && runtimeId) {
		return (
			<Card className="max-w-3xl space-y-4 p-6 sm:p-8">
				<div className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">
					Created
				</div>
				<h2 className="text-2xl font-medium tracking-[-0.04em] text-white">
					Runtime identity ready
				</h2>
				<p className="text-sm text-[var(--muted)]">
					Store the API key as CHEELA_API_KEY in your project .env, reference it
					from cheela.config.ts, then run cheela deploy. This key is shown once.
				</p>
				<pre className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-black/50 p-4 font-mono text-xs text-[var(--primary)]">
					{`runtimeId: ${runtimeId}\nCHEELA_API_KEY=${apiKey}`}
				</pre>
				<pre className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-black/50 p-4 font-mono text-xs text-[var(--muted)]">
					{`# .env\nCHEELA_API_KEY=${apiKey}`}
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
				<label className="block space-y-2 text-sm">
					<span className="text-[var(--muted)]">Name (optional)</span>
					<input
						name="name"
						placeholder="orders-runtime"
						className="w-full rounded-2xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white outline-none transition focus:border-[rgba(228,179,40,0.45)]"
					/>
				</label>

				<div className="grid gap-6 sm:grid-cols-2">
					<label className="block space-y-2 text-sm">
						<span className="text-[var(--muted)]">Version</span>
						<input
							name="version"
							defaultValue="0.0.0"
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
							<option value="free">Free</option>
							<option value="pro">Pro</option>
						</select>
					</label>
				</div>

				<p className="text-sm leading-6 text-[var(--muted)]">
					Provider, model, and capabilities are configured locally and published
					with <code className="text-[var(--primary)]">cheela deploy</code>.
				</p>

				{error ? <p className="text-sm text-red-300">{error}</p> : null}

				<div className="flex flex-wrap gap-3 pt-2">
					<Button type="submit" disabled={loading}>
						{loading ? "Creating…" : "Create runtime"}
					</Button>
					<Button variant="secondary" href="/runtimes">
						Cancel
					</Button>
				</div>
			</form>
		</Card>
	);
}
