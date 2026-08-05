"use client";

import {
	Activity,
	BarChart3,
	Boxes,
	ChevronDown,
	FolderKanban,
	Menu,
	Plus,
	Settings,
	Waypoints,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/", label: "Overview", icon: Activity },
	{ href: "/runtimes", label: "Runtimes", icon: Boxes },
	{ href: "/executions", label: "Executions", icon: Waypoints },
	{ href: "/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => {
				const Icon = item.icon;
				const active =
					item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"group flex items-center gap-3 rounded-md px-3.5 py-3 text-sm transition-colors duration-base",
							active
								? "border border-accent/30 bg-accent/15 text-console-fg"
								: "border border-transparent text-console-fg-muted hover:bg-white/[0.03] hover:text-console-fg",
						)}
					>
						<Icon
							className={cn(
								"size-4",
								active
									? "text-accent"
									: "text-console-fg-muted group-hover:text-console-fg",
							)}
						/>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
	const { projects, selectedProject, selectProject, createProject, pending } =
		useProjects();
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const onWorkspacePage = pathname.startsWith("/workspace");

	return (
		<div className="mb-6">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className={cn(
					"flex w-full items-center justify-between rounded-md border bg-white/[0.02] p-4 text-left transition-colors",
					onWorkspacePage || open
						? "border-accent/30"
						: "border-console-border hover:border-accent/20",
				)}
			>
				<div>
					<div className="text-2xs tracking-wide text-console-fg-muted">
						WORKSPACE
					</div>
					<div className="mt-2 text-sm font-medium text-console-fg">
						{selectedProject?.name ?? "—"}
					</div>
					<div className="mt-1 text-2xs text-console-fg-muted">
						{projects.length} project{projects.length === 1 ? "" : "s"}
					</div>
				</div>
				<ChevronDown
					className={cn(
						"size-4 text-console-fg-muted transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open ? (
				<div className="mt-2 space-y-1 rounded-md border border-console-border bg-ink-0 p-2">
					{projects.map((project) => (
						<button
							key={project.projectId}
							type="button"
							onClick={() => {
								void selectProject(project.projectId);
								setOpen(false);
								onNavigate?.();
							}}
							className={cn(
								"flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
								project.projectId === selectedProject?.projectId
									? "bg-accent/15 text-console-fg"
									: "text-console-fg-muted hover:bg-white/[0.03] hover:text-console-fg",
							)}
						>
							<FolderKanban className="size-3.5 shrink-0" />
							<span className="truncate">{project.name}</span>
						</button>
					))}
					<button
						type="button"
						disabled={pending}
						onClick={async () => {
							const name = window.prompt("Project name");
							if (!name?.trim()) return;
							setOpen(false);
							onNavigate?.();
							// Awaited so a failure surfaces instead of the menu closing on
							// a project that was never created.
							try {
								await createProject(name);
							} catch (error) {
								window.alert(
									error instanceof Error
										? error.message
										: "Could not create the project",
								);
							}
						}}
						className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm text-accent transition-colors hover:bg-white/[0.03] disabled:opacity-50"
					>
						<Plus className="size-3.5" />
						Create New Project
					</button>
					<Link
						href="/workspace"
						onClick={() => {
							setOpen(false);
							onNavigate?.();
						}}
						className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-console-fg-muted transition-colors hover:bg-white/[0.03] hover:text-console-fg"
					>
						Manage workspace
					</Link>
				</div>
			) : null}
		</div>
	);
}

export function Sidebar() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-pill border border-console-border bg-black/70 p-3 text-console-fg backdrop-blur-xl lg:hidden"
				aria-label="Open navigation"
				onClick={() => setOpen(true)}
			>
				<Menu className="size-4" />
			</button>

			{open ? (
				<button
					type="button"
					aria-label="Close navigation overlay"
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
					onClick={() => setOpen(false)}
				/>
			) : null}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-console-border bg-console-bg/95 p-5 backdrop-blur-2xl transition-transform duration-base lg:static lg:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="mb-8 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2.5">
						<Image
							src="/logo-mark.svg"
							alt=""
							width={22}
							height={22}
							className="size-[22px]"
						/>
						<span className="font-display text-sm font-semibold text-console-fg">
							Cheela
						</span>
					</Link>
					<button
						type="button"
						className="rounded-pill border border-console-border p-2 text-console-fg lg:hidden"
						aria-label="Close navigation"
						onClick={() => setOpen(false)}
					>
						<X className="size-4" />
					</button>
				</div>

				<WorkspaceSwitcher onNavigate={() => setOpen(false)} />
				<NavLinks onNavigate={() => setOpen(false)} />

				<div className="mt-auto rounded-md border border-console-border bg-white/[0.02] p-4">
					<div className="text-2xs tracking-wide text-accent">PRINCIPLE</div>
					<p className="mt-3 text-sm leading-relaxed text-console-fg-muted">
						Cheela orchestrates. Your infrastructure executes.
					</p>
				</div>
			</aside>
		</>
	);
}
