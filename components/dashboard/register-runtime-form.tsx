"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { useProjects } from "@/lib/projects";
import { useCheelaApi } from "@/lib/use-cheela-api";

export function RegisterRuntimeForm() {
	const { request } = useCheelaApi();
	const { selectedProjectId } = useProjects();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [keys, setKeys] = useState<{
		deployKey: string;
		publicKey: string;
		secret: string;
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
				secret: string;
			}>("/v1/runtimes", {
				method: "POST",
				// No tier here — it follows the account's subscription, and the
				// server ignores a client-supplied one.
				body: JSON.stringify({
					version: form.get("version") || "0.0.0",
					name,
					// The server files it here. Omitting it lands the runtime in the
					// owner's default project, which is where every runtime used to go
					// regardless of what the switcher said.
					...(selectedProjectId ? { projectId: selectedProjectId } : {}),
				}),
			});

			setRuntimeId(result.runtimeId);
			setKeys({
				deployKey: result.deployKey,
				publicKey: result.publicKey,
				secret: result.secret,
			});
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
					Three credentials, and they are not interchangeable. Copy all of them
					now — the runtime secret in particular is shown here and nowhere else.
				</p>

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm text-console-fg">
							Deploy key — keep secret
						</span>
						<CopyButton icon label="Copy deploy key" value={keys.deployKey} />
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
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm text-console-fg">
							Public key — safe to embed
						</span>
						<CopyButton icon label="Copy public key" value={keys.publicKey} />
					</div>
					<p className="text-sm text-console-fg-muted">
						This is the one the chat widget uses. It can execute but never
						deploy, so viewing your page source gives nothing away.
					</p>
					<pre className="overflow-x-auto rounded-[16px] border border-console-border bg-black/50 p-4 font-mono text-xs text-console-fg-muted">
						{keys.publicKey}
					</pre>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm text-console-fg">
							Runtime secret — keep secret
						</span>
						<CopyButton icon label="Copy runtime secret" value={keys.secret} />
					</div>
					<p className="text-sm text-console-fg-muted">
						Store as CHEELA_RUNTIME_SECRET where your endpoint runs. Cheela
						signs every capability request with it, and your endpoint verifies
						that signature — without it, anyone who learns your endpoint URL can
						run your capabilities directly.
					</p>
					<pre className="overflow-x-auto rounded-[16px] border border-console-border bg-black/50 p-4 font-mono text-xs text-accent">
						{`CHEELA_RUNTIME_SECRET=${keys.secret}`}
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
					<span className="text-console-fg-muted">Name</span>
					{/* Required, and the browser enforces it before the request goes out
					    — the server rejects a nameless registration, and a round trip to
					    learn that is a worse way to find out. */}
					<input
						name="name"
						placeholder="orders-runtime"
						required
						maxLength={100}
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
