import { CreateProjectButton } from "@/components/dashboard/create-project-button";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchRuntimes } from "@/lib/live-data";
import { resolveProjects } from "@/lib/projects-server";

export const metadata = {
	title: "Workspace",
};

export default async function WorkspacePage() {
	const { projects, error } = await resolveProjects();

	// One unfiltered listing bucketed by project, rather than one request per
	// project: the tier caps runtimes at 1 (free) or 10 (pro), so this is a
	// single page for almost every account and the alternative is N round trips
	// to produce N counts.
	let runtimeCounts: Record<string, number> = {};
	let runtimesError: string | null = null;

	try {
		const runtimes = await fetchRuntimes();
		runtimeCounts = runtimes.reduce<Record<string, number>>(
			(counts, runtime) => {
				if (!runtime.projectId) return counts;
				counts[runtime.projectId] = (counts[runtime.projectId] ?? 0) + 1;
				return counts;
			},
			{},
		);
	} catch (err) {
		runtimesError =
			err instanceof Error ? err.message : "Failed to load runtimes";
	}

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Workspace"
					title="Projects"
					description="A project groups runtimes within your account. Switching one changes which runtimes the overview and registry show; billing, quota and analytics stay account-wide."
					actions={<CreateProjectButton />}
				/>
			</FadeIn>

			{error ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					Could not load projects: {error}
				</Card>
			) : null}

			{runtimesError ? (
				<Card className="border-danger/25 bg-danger/5 p-5 text-sm text-danger">
					Projects loaded, but their runtime counts did not: {runtimesError}
				</Card>
			) : null}

			{projects.length === 0 ? (
				error ? null : (
					<Card className="p-5 text-sm text-console-fg-muted">
						No projects yet.
					</Card>
				)
			) : (
				<ProjectGrid runtimeCounts={runtimeCounts} />
			)}
		</div>
	);
}
