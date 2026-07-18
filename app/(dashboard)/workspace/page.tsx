"use client";

import { FolderKanban, Plus } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

export default function WorkspacePage() {
	const {
		projects,
		selectedProjectId,
		selectProject,
		createProject,
		projectRuntimes,
	} = useProjects();

	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Workspace"
					title="Projects"
					description="Switch between projects in this browser. Runtimes stay owner-scoped on the server and can be linked to a project locally."
					actions={
						<Button
							onClick={() => {
								const name = window.prompt("Project name");
								if (!name?.trim()) return;
								createProject(name);
							}}
						>
							<Plus className="size-4" />
							Create New Project
						</Button>
					}
				/>
			</FadeIn>

			<div className="grid gap-4 lg:grid-cols-2">
				{projects.map((project) => {
					const runtimeCount = projectRuntimes(project.id).length;
					const selected = project.id === selectedProjectId;
					return (
						<FadeIn key={project.id}>
							<button
								type="button"
								onClick={() => selectProject(project.id)}
								className="w-full text-left"
							>
								<Card
									interactive
									className={cn(
										"space-y-4 p-6",
										selected && "border-[rgba(212,160,23,0.35)]",
									)}
								>
									<div className="flex items-start gap-3">
										<div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-black/40 text-[var(--primary)]">
											<FolderKanban className="size-5" />
										</div>
										<div>
											<div className="text-lg font-medium text-white">
												{project.name}
											</div>
											<div className="mt-1 text-xs text-[var(--muted)]">
												{runtimeCount} linked runtime
												{runtimeCount === 1 ? "" : "s"}
												{selected ? " · current" : ""}
											</div>
										</div>
									</div>
								</Card>
							</button>
						</FadeIn>
					);
				})}
			</div>
		</div>
	);
}
