"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { PROJECT_COOKIE, PROJECT_COOKIE_MAX_AGE } from "./project-cookie";

/**
 * Switches the selected project.
 *
 * A server action rather than a `document.cookie` write: the cookie is what the
 * server components read to scope their queries, and setting it here means the
 * revalidation below cannot race the write. Doing it in the browser leaves a
 * window where the refresh is issued before the new cookie is on the request.
 *
 * `revalidatePath("/", "layout")` because the selection changes the layout (the
 * switcher's label) as well as every page under it.
 *
 * Deliberately not `httpOnly: false` by accident — nothing client-side needs to
 * read it, since the selection is handed down from the server as props.
 */
export async function selectProjectAction(projectId: string): Promise<void> {
	const store = await cookies();
	store.set(PROJECT_COOKIE, projectId, {
		path: "/",
		maxAge: PROJECT_COOKIE_MAX_AGE,
		sameSite: "lax",
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
	});

	revalidatePath("/", "layout");
}
