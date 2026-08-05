"use client";

import { FolderKanban } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * The project cards, with the runtime count each one actually has.
 *
 * The count is passed in rather than derived here: it comes from
 * `GET /v1/runtimes?projectId=`, which is a server call. The previous version
 * counted a `localStorage` map that was only ever written when a runtime was
 * registered through this dashboard — anything created by the CLI or
 * `cheela deploy` counted as zero, in every project, forever.
 */
export function ProjectGrid({
	runtimeCounts,
}: {
	runtimeCounts: Record<string, number>;
}) {
	const { projects, selectedProjectId, selectProject } = useProjects();

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{projects.map((project) => {
				const count = runtimeCounts[project.projectId] ?? 0;
				const selected = project.projectId === selectedProjectId;

				return (
					<FadeIn key={project.projectId}>
						<button
							type="button"
							onClick={() => void selectProject(project.projectId)}
							className="w-full text-left"
						>
							<Card
								interactive
								className={cn("space-y-4 p-6", selected && "border-accent/35")}
							>
								<div className="flex items-start gap-3">
									<div className="flex size-11 items-center justify-center rounded-lg border border-console-border bg-black/40 text-accent">
										<FolderKanban className="size-5" />
									</div>
									<div>
										<div className="text-lg font-medium text-console-fg">
											{project.name}
											{project.isDefault ? (
												<span className="ml-2 font-mono text-2xs uppercase tracking-wide text-console-fg-muted">
													default
												</span>
											) : null}
										</div>
										<div className="mt-1 text-xs text-console-fg-muted">
											{count} runtime{count === 1 ? "" : "s"}
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
	);
}
