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
	const [keys, setKeys] = useState<{
		deployKey: string;
		publicKey: string;
	} | null>(null);
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
				deployKey: string;
				publicKey: string;
			}>("/v1/runtimes", {
				method: "POST",
				// No tier here — it follows the account's subscription, and the
				// server ignores a client-supplied one.
				body: JSON.stringify({
					version: form.get("version") || "0.0.0",
					...(name ? { name } : {}),
				}),
			});

			setRuntimeId(result.runtimeId);
			setKeys({ deployKey: result.deployKey, publicKey: result.publicKey });
			if (selectedProjectId) {
				assignRuntime(result.runtimeId, selectedProjectId);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	if (keys && runtimeId) {
		return (
			<Card className="max-w-3xl space-y-4 p-6 sm:p-8">
				<div className="text-xs uppercase tracking-wide text-accent">
					Created
				</div>
				<h2 className="text-2xl font-medium tracking-tight text-console-fg">
					Runtime identity ready
				</h2>
				<p className="text-sm text-console-fg-muted">
					Two keys, and they are not interchangeable. Both are shown once — only
					their hashes are stored.
				</p>

				<div className="space-y-2">
					<div className="text-sm text-console-fg">
						Deploy key — keep secret
					</div>
					<p className="text-sm text-console-fg-muted">
						Store as CHEELA_API_KEY in your project .env, reference it from
						cheela.config.ts, then run cheela deploy.
					</p>
					<pre className="overflow-x-auto rounded-[16px] border border-console-border bg-black/50 p-4 font-mono text-xs text-accent">
						{`runtimeId: ${runtimeId}\nCHEELA_API_KEY=${keys.deployKey}`}
					</pre>
				</div>

				<div className="space-y-2">
					<div className="text-sm text-console-fg">
						Public key — safe to embed
					</div>
					<p className="text-sm text-console-fg-muted">
						This is the one the chat widget uses. It can execute but never
						deploy, so viewing your page source gives nothing away.
					</p>
					<pre className="overflow-x-auto rounded-[16px] border border-console-border bg-black/50 p-4 font-mono text-xs text-console-fg-muted">
						{keys.publicKey}
					</pre>
				</div>
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
					<span className="text-console-fg-muted">Name (optional)</span>
					<input
						name="name"
						placeholder="orders-runtime"
						className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60"
					/>
				</label>

				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">Version</span>
					<input
						name="version"
						defaultValue="0.0.0"
						className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60"
					/>
				</label>

				<p className="text-sm leading-6 text-console-fg-muted">
					Provider, model, and capabilities are configured locally and published
					with <code className="text-accent">cheela deploy</code>.
				</p>

				{error ? <p className="text-sm text-danger">{error}</p> : null}

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
