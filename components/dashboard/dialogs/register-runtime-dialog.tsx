"use client";

import type { ReactNode } from "react";
import { RegisterRuntimeForm } from "@/components/dashboard/register-runtime-form";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "@/components/ui/dialog";

export function RegisterRuntimeDialog({ trigger }: { trigger: ReactNode }) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-[520px]">
				<DialogHeader eyebrow="REGISTER RUNTIME" title="New runtime" />
				<div className="max-h-[70vh] overflow-y-auto">
					<RegisterRuntimeForm />
				</div>
			</DialogContent>
		</Dialog>
	);
}
