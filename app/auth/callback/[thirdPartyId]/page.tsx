"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";

export default function OAuthCallbackPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function completeSignIn() {
			try {
				const response = await ThirdParty.signInAndUp();
				if (cancelled) return;

				if (response.status === "OK") {
					router.push("/");
					router.refresh();
					return;
				}
				if (response.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
					setError(
						"That provider didn't share an email address — try a different sign-in method.",
					);
					return;
				}
				setError(response.reason);
			} catch {
				if (!cancelled) setError("Something went wrong — try again");
			}
		}

		void completeSignIn();
		return () => {
			cancelled = true;
		};
	}, [router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-console-bg px-6">
			<div className="w-full max-w-md space-y-4 text-center">
				{error ? (
					<>
						<p className="text-sm text-danger">{error}</p>
						<a href="/sign-in" className="text-sm text-accent hover:underline">
							Back to sign in
						</a>
					</>
				) : (
					<p className="text-sm text-console-fg-muted">Completing sign-in…</p>
				)}
			</div>
		</div>
	);
}
