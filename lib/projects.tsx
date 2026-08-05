"use client";

import { useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { selectProjectAction } from "./project-actions";
import type { Project } from "./types";
import { useCheelaApi } from "./use-cheela-api";

/**
 * Projects, as the server records them.
 *
 * This used to be a `localStorage` store of client-invented projects with ids
 * like `proj_a1b2c3d4` that existed nowhere else. Meanwhile the control plane
 * had the real thing the whole time — a `projects` collection, CRUD routes, a
 * `projectId` on every runtime and a `?projectId=` filter on the listing. The
 * two never met, so switching project renamed a heading and every page went on
 * showing every runtime the owner had.
 *
 * The list and the selection are resolved on the server (see
 * `projects-server.ts`) and handed down, because the pages that list runtimes
 * are server components and the query has to carry the projectId. This provider
 * covers the parts that are genuinely interactive: switching and creating.
 */

type ProjectsContextValue = {
	projects: Project[];
	selectedProjectId?: string;
	selectedProject?: Project;
	/** True while a switch or a create is in flight. */
	pending: boolean;
	selectProject: (projectId: string) => Promise<void>;
	createProject: (name: string) => Promise<Project>;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({
	projects,
	selectedProjectId,
	children,
}: {
	projects: Project[];
	selectedProjectId?: string;
	children: ReactNode;
}) {
	const router = useRouter();
	const { request } = useCheelaApi();
	const [pending, setPending] = useState(false);

	const selectProject = useCallback(
		async (projectId: string) => {
			if (projectId === selectedProjectId) return;
			setPending(true);
			try {
				// The action writes the cookie and revalidates. `refresh()` is what
				// pulls the new server render into this tree — without it the selector
				// would move and the runtime list would not.
				await selectProjectAction(projectId);
				router.refresh();
			} finally {
				setPending(false);
			}
		},
		[router, selectedProjectId],
	);

	const createProject = useCallback(
		async (name: string) => {
			setPending(true);
			try {
				const project = await request<Project>("/v1/projects", {
					method: "POST",
					body: JSON.stringify({ name }),
				});
				// Select it straight away: creating a project and staying in the old
				// one is never what anybody meant.
				await selectProjectAction(project.projectId);
				router.refresh();
				return project;
			} finally {
				setPending(false);
			}
		},
		[request, router],
	);

	const value = useMemo<ProjectsContextValue>(
		() => ({
			projects,
			selectedProjectId,
			selectedProject: projects.find(
				(project) => project.projectId === selectedProjectId,
			),
			pending,
			selectProject,
			createProject,
		}),
		[projects, selectedProjectId, pending, selectProject, createProject],
	);

	return (
		<ProjectsContext.Provider value={value}>
			{children}
		</ProjectsContext.Provider>
	);
}

export function useProjects(): ProjectsContextValue {
	const value = useContext(ProjectsContext);
	if (!value) {
		throw new Error("useProjects must be used within ProjectsProvider");
	}
	return value;
}
