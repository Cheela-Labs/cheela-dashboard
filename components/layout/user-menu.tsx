"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Session from "supertokens-web-js/recipe/session";

function initialsFor(email: string | null): string {
	if (!email) return "?";
	return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const [email, setEmail] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch("/api/me")
			.then((response) => (response.ok ? response.json() : null))
			.then((data: { email?: string } | null) => {
				if (!cancelled && data?.email) setEmail(data.email);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		function onClickOutside(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", onClickOutside);
		return () => document.removeEventListener("mousedown", onClickOutside);
	}, []);

	async function onSignOut() {
		await Session.signOut();
		router.push("/sign-in");
		router.refresh();
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="flex size-9 items-center justify-center rounded-full border border-console-border bg-console-surface text-xs font-medium text-console-fg transition hover:border-accent/60"
				aria-haspopup="menu"
				aria-expanded={open}
			>
				{initialsFor(email)}
			</button>

			{open ? (
				<div
					role="menu"
					className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-console-border bg-ink-1 shadow-lg"
				>
					{email ? (
						<div className="truncate border-b border-console-border px-4 py-3 text-sm text-console-fg-muted">
							{email}
						</div>
					) : null}
					<button
						type="button"
						role="menuitem"
						onClick={onSignOut}
						className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-console-fg transition-colors hover:bg-white/[0.04]"
					>
						<LogOut className="size-4" />
						Sign out
					</button>
				</div>
			) : null}
		</div>
	);
}
