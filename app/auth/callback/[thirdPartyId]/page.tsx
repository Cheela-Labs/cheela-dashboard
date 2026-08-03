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
			} catch (caught) {
				if (cancelled) return;

				// The thrown message, not a generic one.
				//
				// `signInAndUp` returns a status for anything it anticipates, so
				// reaching here means the backend failed outright. Replacing that
				// with "something went wrong" discards the only description of what
				// broke and leaves the browser console as the sole copy — which is
				// exactly what happened when account linking was enabled and this
				// page reported nothing useful about why.
				const detail =
					caught instanceof Error ? caught.message : String(caught);
				console.error("Third-party sign-in failed", caught);
				setError(
					detail
						? `Sign-in failed: ${detail}`
						: "Sign-in failed, and the server gave no reason. Check the dashboard's function logs.",
				);
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
