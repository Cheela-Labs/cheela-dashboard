// Server-only by construction: `next/headers` throws if this is ever pulled
// into a client component, which is why there is no `server-only` import here
// to add a dependency for.
import { cookies } from "next/headers";
import { cache } from "react";
import { fetchProjects } from "./live-data";
import { PROJECT_COOKIE } from "./project-cookie";
import type { Project } from "./types";

export type ProjectSelection = {
	projects: Project[];
	/** Undefined only when the projects call failed; see below. */
	selectedProjectId?: string;
	/** What went wrong, for a page that wants to say so rather than show nothing. */
	error?: string;
};

/**
 * The owner's projects and which one is selected.
 *
 * `cache()` because the layout and the page beneath it both need this within
 * one render, and they should not each pay for the round trip.
 *
 * The cookie is *validated against the real list* rather than trusted. A
 * projectId that has been deleted, or that belongs to another account after a
 * sign-out and sign-in on the same browser, would otherwise be passed to
 * `?projectId=` and come back empty — the server filters by owner as well as
 * project, so a foreign id is not an error, it is a listing with nothing in it.
 * An empty page with a project name in the header is the worst possible way to
 * report that; falling back to the default is the least surprising.
 */
export const resolveProjects = cache(async (): Promise<ProjectSelection> => {
	let projects: Project[];
	try {
		projects = await fetchProjects();
	} catch (error) {
		// Not fatal. The dashboard has to render even when the control plane is
		// unreachable, and the pages beneath already report their own failures.
		return {
			projects: [],
			error: error instanceof Error ? error.message : String(error),
		};
	}

	const requested = (await cookies()).get(PROJECT_COOKIE)?.value;
	const selected =
		projects.find((project) => project.projectId === requested) ??
		projects.find((project) => project.isDefault) ??
		projects[0];

	return { projects, selectedProjectId: selected?.projectId };
});
