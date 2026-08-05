import { notFound } from "next/navigation";
import { DeleteRuntimeButton } from "@/components/dashboard/delete-runtime-button";
import { RenameRuntimeButton } from "@/components/dashboard/rename-runtime-button";
import { RuntimeKeysCard } from "@/components/dashboard/runtime-keys-card";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchRuntime } from "@/lib/live-data";

export default async function RuntimeDetailPage({
	params,
}: {
	params: Promise<{ runtimeId: string }>;
}) {
	const { runtimeId } = await params;

	let runtime: Awaited<ReturnType<typeof fetchRuntime>>;
	try {
		runtime = await fetchRuntime(runtimeId);
	} catch {
		notFound();
	}

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Runtime"
					title={runtime.displayName}
					// The id stays visible: it is what goes into cheela.config.ts and
					// into a support message, and the name is not unique.
					description={`${runtime.runtimeId} · v${runtime.version}`}
					actions={
						<>
							<Badge
								tone={
									runtime.status === "healthy"
										? "success"
										: runtime.status === "degraded"
											? "accent"
											: "danger"
								}
							>
								{runtime.status}
							</Badge>
							<Button variant="secondary" href="/executions">
								View executions
							</Button>
							<RenameRuntimeButton
								currentName={runtime.name}
								runtimeId={runtime.runtimeId}
							/>
							<DeleteRuntimeButton runtimeId={runtime.runtimeId} />
						</>
					}
				/>
			</FadeIn>

			<div className="grid gap-6 lg:grid-cols-2">
				{/*
				  Keys and capabilities, and nothing else.

				  The Configuration card restated facts identical for every runtime on
				  the platform — one central OpenRouter credential, one model, one
				  transport — beside a tier that belongs to the account rather than to
				  the runtime. The endpoint form was a second way to write something
				  `cheela deploy` already sets from cheela.config.ts, and two ways to
				  write one field is one too many.
				*/}
				<FadeIn delay={0.05}>
					<RuntimeKeysCard
						runtimeId={runtime.runtimeId}
						deployKeyPrefix={runtime.deployKeyPrefix ?? "—"}
						publicKeyPrefix={runtime.publicKeyPrefix ?? "—"}
						allowedOrigins={runtime.allowedOrigins ?? []}
					/>
				</FadeIn>

				<FadeIn delay={0.1}>
					<Card className="space-y-5 p-6">
						<h2 className="text-lg font-medium text-console-fg">
							Capability manifest
						</h2>
						<p className="text-sm leading-6 text-console-fg-muted">
							Names only. Handlers execute inside the customer runtime.
						</p>
						<div className="flex flex-wrap gap-2">
							{runtime.capabilityNames.map((capability) => (
								<span
									key={capability}
									className="rounded-full border border-console-border bg-white/[0.02] px-3 py-1.5 font-mono text-xs text-console-fg"
								>
									{capability}
								</span>
							))}
						</div>
					</Card>
				</FadeIn>
			</div>
		</div>
	);
}
