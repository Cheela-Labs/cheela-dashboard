import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-console-bg px-6">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="text-xs uppercase tracking-wide text-accent">
						Cheela Cloud
					</div>
					<h1 className="mt-3 text-3xl font-medium tracking-tight text-console-fg">
						Sign in
					</h1>
				</div>
				<AuthForm mode="sign-in" />
			</div>
		</div>
	);
}
