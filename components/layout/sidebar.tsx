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
	Sparkles,
	Waypoints,
	X,
} from "lucide-react";
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
							"group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition duration-300",
							active
								? "border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.08)] text-white"
								: "border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-white/[0.03] hover:text-white",
						)}
					>
						<Icon
							className={cn(
								"size-4 transition",
								active
									? "text-[var(--primary)]"
									: "text-[var(--muted)] group-hover:text-white",
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
	const { projects, selectedProject, selectProject, createProject } =
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
					"flex w-full items-center justify-between rounded-[20px] border bg-white/[0.02] p-4 text-left transition",
					onWorkspacePage || open
						? "border-[rgba(212,160,23,0.28)]"
						: "border-[var(--border)] hover:border-[rgba(212,160,23,0.2)]",
				)}
			>
				<div>
					<div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
						Workspace
					</div>
					<div className="mt-2 text-sm font-medium text-white">
						{selectedProject.name}
					</div>
					<div className="mt-1 text-xs text-[var(--muted)]">
						{projects.length} project{projects.length === 1 ? "" : "s"}
					</div>
				</div>
				<ChevronDown
					className={cn(
						"size-4 text-[var(--muted)] transition",
						open && "rotate-180",
					)}
				/>
			</button>

			{open ? (
				<div className="mt-2 space-y-1 rounded-[20px] border border-[var(--border)] bg-black/40 p-2">
					{projects.map((project) => (
						<button
							key={project.id}
							type="button"
							onClick={() => {
								selectProject(project.id);
								setOpen(false);
								onNavigate?.();
							}}
							className={cn(
								"flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition",
								project.id === selectedProject.id
									? "bg-[rgba(212,160,23,0.08)] text-white"
									: "text-[var(--muted)] hover:bg-white/[0.03] hover:text-white",
							)}
						>
							<FolderKanban className="size-3.5 shrink-0" />
							<span className="truncate">{project.name}</span>
						</button>
					))}
					<button
						type="button"
						onClick={() => {
							const name = window.prompt("Project name");
							if (!name?.trim()) return;
							createProject(name);
							setOpen(false);
							onNavigate?.();
						}}
						className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm text-[var(--primary)] transition hover:bg-white/[0.03]"
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
						className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.03] hover:text-white"
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
				className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-black/70 p-3 text-white backdrop-blur-xl lg:hidden"
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
					"fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border)] bg-[#0b0b0b]/95 p-5 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="mb-8 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]">
							<Sparkles className="size-4" />
						</div>
						<div>
							<div className="text-sm font-medium uppercase tracking-[0.16em] text-white">
								Cheela
							</div>
							<div className="text-xs text-[var(--muted)]">
								Cloud control plane
							</div>
						</div>
					</Link>
					<button
						type="button"
						className="rounded-full border border-[var(--border)] p-2 text-white lg:hidden"
						aria-label="Close navigation"
						onClick={() => setOpen(false)}
					>
						<X className="size-4" />
					</button>
				</div>

				<WorkspaceSwitcher onNavigate={() => setOpen(false)} />
				<NavLinks onNavigate={() => setOpen(false)} />

				<div className="mt-auto rounded-[20px] border border-[var(--border)] bg-[radial-gradient(circle_at_top,_rgba(212,160,23,0.12),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-4">
					<div className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">
						Principle
					</div>
					<p className="mt-3 text-sm leading-6 text-[var(--muted)]">
						Cheela orchestrates. Your infrastructure executes.
					</p>
				</div>
			</aside>
		</>
	);
}
