import { RegisterRuntimeForm } from "@/components/dashboard/register-runtime-form";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function NewRuntimePage() {
	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Registry"
					title="Register runtime"
					actions={
						<Button variant="secondary" href="/runtimes">
							Back to runtimes
						</Button>
					}
				/>
			</FadeIn>

			<FadeIn delay={0.05}>
				<RegisterRuntimeForm />
			</FadeIn>
		</div>
	);
}
