import type { Metadata } from "next";

/**
 * The one page here a crawler can actually reach.
 *
 * `robots.ts` disallows the whole host, but a disallowed URL can still be
 * indexed from an external link — Google will list it without crawling it.
 * `noindex` is what removes it, and it is only seen because this route returns
 * 200 rather than redirecting.
 */
export const metadata: Metadata = {
	title: "Sign up",
	robots: { index: false, follow: false },
};

import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-console-bg px-6">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="text-xs uppercase tracking-wide text-accent">
						Cheela Cloud
					</div>
					<h1 className="mt-3 text-3xl font-medium tracking-tight text-console-fg">
						Create account
					</h1>
				</div>
				<AuthForm mode="sign-up" />
			</div>
		</div>
	);
}
