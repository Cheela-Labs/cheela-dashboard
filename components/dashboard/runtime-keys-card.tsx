"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useCheelaApi } from "@/lib/use-cheela-api";

type KeyType = "deploy" | "public";

const inputClass =
	"w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60";

interface RotateResponse {
	readonly apiKey: string;
	readonly prefix: string;
	readonly gracePeriodMs: number;
}

/**
 * Runtime credentials.
 *
 * Two keys, and the difference is the point: the deploy key is secret and can
 * publish a manifest; the public key is meant to be embedded in a page and can
 * only execute. Rotation is a prerequisite for embedding a key at all — the
 * public one is leaked by design.
 */
export function RuntimeKeysCard({
	runtimeId,
	deployKeyPrefix,
	publicKeyPrefix,
	allowedOrigins,
}: {
	runtimeId: string;
	deployKeyPrefix: string;
	publicKeyPrefix: string;
	allowedOrigins: string[];
}) {
	const { request } = useCheelaApi();
	const router = useRouter();
	const [issued, setIssued] = useState<{ type: KeyType; key: string } | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function rotate(type: KeyType) {
		setBusy(true);
		setError(null);

		try {
			const result = await request<RotateResponse>(
				`/v1/runtimes/${runtimeId}/rotate-key`,
				{ method: "POST", body: JSON.stringify({ type }) },
			);
			// Shown once — only the hash is stored, so there is no second chance.
			setIssued({ type, key: result.apiKey });
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Rotation failed");
		} finally {
			setBusy(false);
		}
	}

	async function revoke(type: KeyType) {
		setBusy(true);
		setError(null);

		try {
			await request(`/v1/runtimes/${runtimeId}/revoke-key`, {
				method: "POST",
				body: JSON.stringify({ type }),
			});
			setIssued(null);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Revocation failed");
		} finally {
			setBusy(false);
		}
	}

	async function saveOrigins(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError(null);

		const raw = String(new FormData(event.currentTarget).get("origins") ?? "");
		const origins = raw
			.split(/[\s,]+/)
			.map((origin) => origin.trim())
			.filter(Boolean);

		try {
			await request(`/v1/runtimes/${runtimeId}/allowed-origins`, {
				method: "PUT",
				body: JSON.stringify({ origins }),
			});
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card className="space-y-6 p-6">
			<div className="space-y-1">
				<h2 className="text-lg font-medium text-console-fg">API keys</h2>
				<p className="text-sm leading-6 text-console-fg-muted">
					Keys are stored hashed and shown only once. Rotating issues a
					replacement and keeps the old key working for 24 hours; revoking cuts
					it off immediately.
				</p>
			</div>

			<KeyRow
				title="Deploy key"
				description="Secret. Used by cheela deploy and CI. Never put this in a browser."
				prefix={deployKeyPrefix}
				busy={busy}
				onRotate={() => rotate("deploy")}
				onRevoke={() => revoke("deploy")}
			/>

			<KeyRow
				title="Public key"
				description="Embeddable. Used by the chat widget. Can execute, never deploy."
				prefix={publicKeyPrefix}
				busy={busy}
				onRotate={() => rotate("public")}
				onRevoke={() => revoke("public")}
			/>

			{issued ? (
				<div className="space-y-2 rounded-[16px] border border-accent/40 bg-accent/5 p-4">
					<div className="text-xs uppercase tracking-wide text-accent">
						New {issued.type} key — copy it now
					</div>
					<pre className="overflow-x-auto font-mono text-xs text-console-fg">
						{issued.key}
					</pre>
					<p className="text-xs text-console-fg-muted">
						This is the only time it will be shown.
					</p>
				</div>
			) : null}

			<form
				className="space-y-3 border-t border-console-border pt-5"
				onSubmit={saveOrigins}
			>
				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">
						Allowed origins for the public key
					</span>
					<input
						name="origins"
						defaultValue={allowedOrigins.join(", ")}
						placeholder="https://app.example.com, https://www.example.com"
						className={inputClass}
					/>
					<span className="block text-xs text-console-fg-muted">
						Leave blank to allow any origin. An embeddable key with no origin
						restriction is a blank cheque against your provider quota.
					</span>
				</label>

				{error ? <p className="text-sm text-danger">{error}</p> : null}

				<Button type="submit" variant="secondary" disabled={busy}>
					{busy ? "Saving…" : "Save origins"}
				</Button>
			</form>
		</Card>
	);
}

function KeyRow({
	title,
	description,
	prefix,
	busy,
	onRotate,
	onRevoke,
}: {
	title: string;
	description: string;
	prefix: string;
	busy: boolean;
	onRotate: () => void;
	onRevoke: () => void;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-console-border bg-white/[0.02] p-4">
			<div className="min-w-0 space-y-1">
				<div className="text-sm text-console-fg">{title}</div>
				<div className="font-mono text-xs text-console-fg-muted">{prefix}</div>
				<p className="text-xs text-console-fg-muted">{description}</p>
			</div>

			<div className="flex shrink-0 gap-2">
				<Button
					size="sm"
					variant="secondary"
					disabled={busy}
					onClick={onRotate}
				>
					Rotate
				</Button>
				{/* Revocation has no grace window, so it asks first. */}
				<Dialog>
					<DialogTrigger asChild>
						<Button size="sm" variant="ghost" disabled={busy}>
							Revoke
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-[420px]">
						<DialogHeader eyebrow="REVOKE KEY" title={`Revoke ${title}?`} />
						<p className="text-sm leading-6 text-console-fg-muted">
							The current key stops working immediately — no grace period.
							Anything still using it will start failing with 401.
						</p>
						<div className="mt-5 flex gap-3">
							<Button disabled={busy} onClick={onRevoke}>
								Revoke now
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
