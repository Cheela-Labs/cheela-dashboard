"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api-url";

export function Topbar({ title }: { title?: string }) {
	return (
		<header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[#090909]/80 backdrop-blur-2xl">
			<div className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:pl-8">
				<div className="pl-12 lg:pl-0">
					<div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
						Dashboard
					</div>
					<div className="mt-1 text-sm font-medium text-white">
						{title ?? "Control plane"}
					</div>
					{/* <div className="mt-1 hidden font-mono text-[11px] text-[var(--muted)] sm:block">
						API · {getApiUrl()}
					</div> */}
				</div>

				<div className="flex items-center gap-3">
					<div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.02] px-4 py-2 text-sm text-[var(--muted)] md:flex">
						<Search className="size-4" />
						<span>Search runtimes, executions…</span>
						<kbd className="ml-4 rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-white/50">
							⌘K
						</kbd>
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
