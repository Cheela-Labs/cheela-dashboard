import { Plus } from "lucide-react";
import { RegisterRuntimeDialog } from "@/components/dashboard/dialogs/register-runtime-dialog";
import { RuntimeCard } from "@/components/dashboard/runtime-card";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { fetchRuntimes } from "@/lib/live-data";

export const metadata = {
	title: "Runtimes",
};

export default async function RuntimesPage() {
	let runtimes: Awaited<ReturnType<typeof fetchRuntimes>> = [];
	let error: string | null = null;

	try {
		runtimes = await fetchRuntimes();
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load runtimes";
	}

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Registry"
					title="Runtimes"
					description="Registered runtime metadata only — versions, capability manifests, provider config. Executable capability code never leaves customer infrastructure."
					actions={
						<RegisterRuntimeDialog
							trigger={
								<Button>
									<Plus className="size-4" />
									Register runtime
								</Button>
							}
						/>
					}
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				{runtimes.length === 0 && !error ? (
					<EmptyState
						title="No runtimes registered"
						description="Deploy metadata with the register form or POST /v1/runtimes."
						action={
							<Button href="/runtimes/new" size="sm">
								Register runtime
							</Button>
						}
					/>
				) : (
					<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
						{runtimes.map((runtime) => (
							<RuntimeCard key={runtime.runtimeId} runtime={runtime} />
						))}
					</div>
				)}
			</FadeIn>
		</div>
	);
}
