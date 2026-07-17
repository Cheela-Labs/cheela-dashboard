import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">
						Cheela Cloud
					</div>
					<h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white">
						Create account
					</h1>
				</div>
				<div className="flex justify-center">
					<SignUp />
				</div>
			</div>
		</div>
	);
}
