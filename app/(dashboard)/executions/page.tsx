import { ExecutionsTable } from "@/components/dashboard/executions-table";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { fetchExecutions } from "@/lib/live-data";

export const metadata = {
	title: "Executions",
};

export default async function ExecutionsPage() {
	let executions: Awaited<ReturnType<typeof fetchExecutions>> = [];
	let error: string | null = null;

	try {
		executions = await fetchExecutions(100);
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to load executions";
	}

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Execution engine"
					title="Executions"
					description="Every agent loop gets a unique execution ID — messages, capability calls, latency, and final response for full replay."
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					{error}
				</Card>
			) : null}

			<FadeIn delay={0.05}>
				{executions.length === 0 && !error ? (
					<EmptyState
						title="No executions yet"
						description="POST /v1/executions against a registered runtime to populate this list."
					/>
				) : (
					<ExecutionsTable executions={executions} />
				)}
			</FadeIn>
		</div>
	);
}
