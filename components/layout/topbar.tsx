"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects";
import { useCheelaApi } from "@/lib/use-cheela-api";

const PAGES = [
	{ href: "/", label: "Overview", keywords: ["home", "dashboard"] },
	{ href: "/runtimes", label: "Runtimes", keywords: ["runtime", "registry"] },
	{
		href: "/runtimes/new",
		label: "Create Runtime",
		keywords: ["register", "new runtime"],
	},
	{
		href: "/executions",
		label: "Executions",
		keywords: ["traces", "runs"],
	},
	{ href: "/analytics", label: "Analytics", keywords: ["metrics", "usage"] },
	{ href: "/settings", label: "Settings", keywords: ["billing", "limits"] },
	{
		href: "/workspace",
		label: "Workspace",
		keywords: ["projects", "project"],
	},
] as const;

type SearchResult = {
	id: string;
	href: string;
	label: string;
	group: "Pages" | "Projects" | "Runtimes";
};

function matches(query: string, ...parts: string[]) {
	const q = query.trim().toLowerCase();
	if (!q) return false;
	return parts.some((part) => part.toLowerCase().includes(q));
}

export function Topbar({ title }: { title?: string }) {
	const router = useRouter();
	const { request } = useCheelaApi();
	const { projects, selectProject, selectedProject } = useProjects();
	const inputRef = useRef<HTMLInputElement>(null);
	const listId = useId();
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [runtimes, setRuntimes] = useState<
		Array<{ runtimeId: string; provider?: string; model?: string }>
	>([]);

	const loadRuntimes = useRef(async () => {
		try {
			const data = await request<{
				runtimes: Array<{
					runtimeId: string;
					provider?: string | { provider: string };
					model?: string;
				}>;
			}>("/v1/runtimes");
			setRuntimes(
				data.runtimes.map((runtime) => ({
					runtimeId: runtime.runtimeId,
					provider:
						typeof runtime.provider === "string"
							? runtime.provider
							: runtime.provider?.provider,
					model: runtime.model,
				})),
			);
		} catch {
			setRuntimes([]);
		}
	});

	useEffect(() => {
		void loadRuntimes.current();
	}, []);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				inputRef.current?.focus();
				setOpen(true);
			}
			if (event.key === "Escape") {
				setOpen(false);
				inputRef.current?.blur();
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const results = useMemo(() => {
		const q = query.trim();
		if (!q) return [] as SearchResult[];

		const pageResults: SearchResult[] = PAGES.filter((page) =>
			matches(q, page.label, page.href, ...page.keywords),
		).map((page) => ({
			id: `page:${page.href}`,
			href: page.href,
			label: page.label,
			group: "Pages",
		}));

		const projectResults: SearchResult[] = projects
			.filter((project) => matches(q, project.name, project.id))
			.map((project) => ({
				id: `project:${project.id}`,
				href: `/workspace?project=${project.id}`,
				label: project.name,
				group: "Projects",
			}));

		const runtimeResults: SearchResult[] = runtimes
			.filter((runtime) =>
				matches(
					q,
					runtime.runtimeId,
					runtime.provider ?? "",
					runtime.model ?? "",
				),
			)
			.map((runtime) => ({
				id: `runtime:${runtime.runtimeId}`,
				href: `/runtimes/${runtime.runtimeId}`,
				label: runtime.runtimeId,
				group: "Runtimes",
			}));

		return [...projectResults, ...runtimeResults, ...pageResults].slice(0, 12);
	}, [projects, query, runtimes]);

	function navigateTo(result: SearchResult) {
		if (result.group === "Projects") {
			const projectId = result.id.replace("project:", "");
			selectProject(projectId);
			router.push("/workspace");
		} else {
			router.push(result.href);
		}
		setQuery("");
		setOpen(false);
	}

	return (
		<header className="sticky top-0 z-20 border-b border-console-border bg-console-bg/80 backdrop-blur-2xl">
			<div className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:pl-8">
				<div className="pl-12 lg:pl-0">
					<div className="text-2xs tracking-wide text-console-fg-muted">
						DASHBOARD
					</div>
					<div className="mt-1 text-sm font-medium text-console-fg">
						{title ?? selectedProject.name}
					</div>
				</div>

				<div className="flex items-center gap-3">
					<div className="relative hidden md:block">
						<div className="flex items-center gap-2 rounded-md border border-console-border bg-white/[0.02] px-4 py-2 text-sm text-console-fg-muted">
							<Search className="size-4 shrink-0" />
							<input
								ref={inputRef}
								value={query}
								onChange={(event) => {
									setQuery(event.target.value);
									setOpen(true);
								}}
								onFocus={() => setOpen(true)}
								onBlur={() => {
									window.setTimeout(() => setOpen(false), 150);
								}}
								placeholder="Search projects, runtimes, pages…"
								className="w-56 bg-transparent text-sm text-console-fg outline-none placeholder:text-console-fg-muted lg:w-72"
								aria-autocomplete="list"
								aria-controls={listId}
								aria-expanded={open && results.length > 0}
								role="combobox"
							/>
							<kbd className="ml-2 rounded-sm border border-console-border px-1.5 py-0.5 text-2xs text-console-fg/50">
								⌘K
							</kbd>
						</div>

						{open && query.trim() ? (
							<div
								id={listId}
								role="listbox"
								className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,24rem)] overflow-hidden rounded-lg border border-console-border bg-ink-1 shadow-lg"
							>
								{results.length === 0 ? (
									<div className="px-4 py-3 text-sm text-console-fg-muted">
										No matches
									</div>
								) : (
									<ul className="max-h-80 overflow-y-auto py-1">
										{results.map((result) => (
											<li key={result.id}>
												<button
													type="button"
													role="option"
													className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04]"
													onMouseDown={(event) => event.preventDefault()}
													onClick={() => navigateTo(result)}
												>
													<span className="truncate text-console-fg">
														{result.label}
													</span>
													<span className="shrink-0 text-2xs tracking-wide text-console-fg-muted">
														{result.group}
													</span>
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						) : null}
					</div>
					<Button variant="ghost" size="sm" aria-label="Notifications">
						<Bell className="size-4" />
					</Button>
					<UserButton
						appearance={{
							elements: {
								avatarBox: "size-9",
							},
						}}
					/>
				</div>
			</div>
		</header>
	);
}
