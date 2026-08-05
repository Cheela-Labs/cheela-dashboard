"use client";

import { FolderKanban, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "@/components/dashboard/dialogs/confirm-delete-dialog";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects";
import { useCheelaApi } from "@/lib/use-cheela-api";
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
	const { request } = useCheelaApi();
	const router = useRouter();

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

						{/*
						  Outside the selecting button, not inside it: a delete control
						  nested in a button that switches project is one stray click from
						  doing the wrong thing, and nested interactive elements are
						  invalid HTML besides.

						  The default project gets no delete control at all rather than a
						  disabled one — `ensureDefault` recreates it on the next read, so
						  there is no state in which the action could succeed.
						*/}
						{project.isDefault ? null : (
							<div className="mt-2 flex justify-end">
								<ConfirmDeleteDialog
									blockedReason={
										count > 0
											? `${count} runtime${count === 1 ? " is" : "s are"} still in this project. Delete or move ${count === 1 ? "it" : "them"} first — deleting a project never deletes what is inside it.`
											: null
									}
									confirmValue={project.name}
									description={
										<>
											This removes the project only. It cannot be undone, and
											the name becomes available again.
										</>
									}
									label="project name"
									onConfirm={async () => {
										await request(`/v1/projects/${project.projectId}`, {
											method: "DELETE",
										});
										router.refresh();
									}}
									title={`Delete ${project.name}`}
									trigger={
										<Button size="sm" variant="ghost">
											<Trash2 className="size-3.5" />
											Delete
										</Button>
									}
								/>
							</div>
						)}
					</FadeIn>
				);
			})}
		</div>
	);
}
