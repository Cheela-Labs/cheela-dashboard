import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ProjectsProvider } from "@/lib/projects";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProjectsProvider>
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
