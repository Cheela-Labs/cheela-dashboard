import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-6">
			<FadeIn>
				<div className="max-w-md space-y-5 text-center">
					<div className="text-xs uppercase tracking-wide text-accent">404</div>
					<h1 className="text-3xl font-medium tracking-tight text-console-fg">
						Not found
					</h1>
					<p className="text-sm leading-6 text-console-fg-muted">
						That runtime or execution does not exist in this workspace.
					</p>
					<Button href="/">Back to overview</Button>
				</div>
			</FadeIn>
		</div>
	);
}
