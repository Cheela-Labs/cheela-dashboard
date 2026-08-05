"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects";

export function CreateProjectButton() {
	const { createProject, pending } = useProjects();
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="flex flex-col items-end gap-2">
			<Button
				disabled={pending}
				onClick={async () => {
					const name = window.prompt("Project name");
					if (!name?.trim()) return;
					setError(null);
					try {
						await createProject(name);
					} catch (err) {
						setError(
							err instanceof Error ? err.message : "Could not create project",
						);
					}
				}}
			>
				<Plus className="size-4" />
				{pending ? "Creating…" : "Create New Project"}
			</Button>
			{error ? <p className="text-xs text-danger">{error}</p> : null}
		</div>
	);
}
