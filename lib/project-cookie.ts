/**
 * Where the selected project lives.
 *
 * A cookie rather than `localStorage`, because the pages that list runtimes are
 * server components and a server component cannot read `localStorage`. That is
 * precisely why the previous store could not work: selection lived in the
 * browser, the query that would have used it ran on the server, and the two had
 * no way to meet. Switching projects changed a label and nothing else.
 *
 * Written by a server action (`project-actions.ts`) so the attributes are set
 * once, server-side, and the next render is guaranteed to see the new value.
 *
 * Nothing is authorised by it. Every listing is still scoped to the
 * authenticated owner, and a projectId belonging to someone else reads as
 * absent rather than granting access to anything.
 */
export const PROJECT_COOKIE = "cheela.project";

/** A year. Selection is a preference; there is nothing to expire. */
export const PROJECT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
