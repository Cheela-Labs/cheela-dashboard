import { FadeIn } from "@/components/motion/fade-in";
import { RegisterRuntimeForm } from "@/components/dashboard/register-runtime-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function NewRuntimePage() {
	return (
		<div className="space-y-10">
			<FadeIn>
				<PageHeader
					eyebrow="Registry"
					title="Register runtime"
					description="Store metadata for a customer runtime. Cheela will sign free-tier HTTPS requests or accept a Pro outbound session."
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
