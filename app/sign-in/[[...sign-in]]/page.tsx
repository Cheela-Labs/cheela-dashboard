import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">
						Cheela Cloud
					</div>
					<h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white">
						Sign in
					</h1>
				</div>
				<div className="flex justify-center">
					<SignIn />
				</div>
			</div>
		</div>
	);
}
