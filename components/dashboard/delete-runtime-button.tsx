"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "@/components/dashboard/dialogs/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { useCheelaApi } from "@/lib/use-cheela-api";

export function DeleteRuntimeButton({ runtimeId }: { runtimeId: string }) {
	const { request } = useCheelaApi();
	const router = useRouter();

	return (
		<ConfirmDeleteDialog
			confirmValue={runtimeId}
			consequences={[
				"The deploy key and public key stop working immediately — any page embedding the public key breaks.",
				"Execution traces for this runtime are deleted, including capability inputs and outputs.",
				"Usage counts stay, so past analytics and billing still reconcile.",
			]}
			description={
				<>
					This cannot be undone. There is no grace period on the keys — if you
					only want to replace a leaked one, rotate it instead.
				</>
			}
			label="runtime ID"
			onConfirm={async () => {
				await request(`/v1/runtimes/${runtimeId}`, { method: "DELETE" });
				// Back to the list: staying on the detail page of something that no
				// longer exists would just 404 on the next render.
				router.push("/runtimes");
				router.refresh();
			}}
			title="Delete runtime"
			trigger={
				<Button size="sm" variant="secondary">
					<Trash2 className="size-3.5" />
					Delete
				</Button>
			}
		/>
	);
}
