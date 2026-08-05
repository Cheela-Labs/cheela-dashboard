import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ProjectsProvider } from "@/lib/projects";
import { resolveProjects } from "@/lib/projects-server";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Resolved here so every page below shares one lookup — `resolveProjects` is
	// `cache()`d, so a page that also needs the selected id does not pay again.
	const { projects, selectedProjectId } = await resolveProjects();

	return (
		<ProjectsProvider projects={projects} selectedProjectId={selectedProjectId}>
			<div className="relative min-h-screen bg-console-bg lg:grid lg:grid-cols-[280px_1fr]">
				<Sidebar />
				<div className="min-w-0">
					<Topbar />
					<main className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
						{children}
					</main>
				</div>
			</div>
		</ProjectsProvider>
	);
}
