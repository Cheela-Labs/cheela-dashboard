"use client";

import { Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";

type Mode = "sign-in" | "sign-up";
type ThirdPartyId = "google" | "github";

async function startThirdPartySignIn(thirdPartyId: ThirdPartyId) {
	const authUrl =
		await ThirdParty.getAuthorisationURLWithQueryParamsAndSetState({
			thirdPartyId,
			frontendRedirectURI: `${window.location.origin}/auth/callback/${thirdPartyId}`,
		});
	window.location.assign(authUrl);
}

export function AuthForm({ mode }: { mode: Mode }) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [oauthLoading, setOauthLoading] = useState<ThirdPartyId | null>(null);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const formFields = [
				{ id: "email", value: email },
				{ id: "password", value: password },
			];
			const response =
				mode === "sign-up"
					? await EmailPassword.signUp({ formFields })
					: await EmailPassword.signIn({ formFields });

			if (response.status === "OK") {
				router.push("/");
				router.refresh();
				return;
			}
			if (response.status === "FIELD_ERROR") {
				setError(
					response.formFields[0]?.error ?? "Check the form and try again",
				);
			} else if (response.status === "WRONG_CREDENTIALS_ERROR") {
				setError("Incorrect email or password");
			} else {
				setError(response.reason);
			}
		} catch {
			setError("Something went wrong — try again");
		} finally {
			setLoading(false);
		}
	}

	async function onOAuthClick(thirdPartyId: ThirdPartyId) {
		setError(null);
		setOauthLoading(thirdPartyId);
		try {
			await startThirdPartySignIn(thirdPartyId);
		} catch {
			setError("Something went wrong — try again");
			setOauthLoading(null);
		}
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-3 sm:grid-cols-2">
				<Button
					type="button"
					variant="secondary"
					disabled={oauthLoading !== null}
					onClick={() => onOAuthClick("google")}
				>
					<GoogleIcon />
					{oauthLoading === "google" ? "Redirecting…" : "Google"}
				</Button>
				<Button
					type="button"
					variant="secondary"
					disabled={oauthLoading !== null}
					onClick={() => onOAuthClick("github")}
				>
					<Github className="size-4" />
					{oauthLoading === "github" ? "Redirecting…" : "GitHub"}
				</Button>
			</div>

			{/*
			  Each method is its own account.

			  Automatic account linking is a paid SuperTokens feature, so signing
			  up with a password and later choosing Google produces two users with
			  different ids — two profiles, two sets of runtimes, and a dashboard
			  that reads as wiped. One sentence here is the whole mitigation until
			  linking is licensed, and it costs nothing.

			  Shown on sign-in rather than sign-up, because that is where the
			  mistake is actually made: nobody signs up twice on purpose.
			*/}
			{mode === "sign-in" ? (
				<p className="text-2xs leading-relaxed text-console-fg-muted">
					Use the same method you signed up with — Google, GitHub and email are
					separate accounts.
				</p>
			) : null}

			<div className="flex items-center gap-3 text-2xs uppercase tracking-wide text-console-fg-muted">
				<div className="h-px flex-1 bg-console-border" />
				or continue with email
				<div className="h-px flex-1 bg-console-border" />
			</div>

			<form className="space-y-4" onSubmit={onSubmit}>
				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">Email</span>
					<input
						type="email"
						required
						autoComplete="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60"
					/>
				</label>
				<label className="block space-y-2 text-sm">
					<span className="text-console-fg-muted">Password</span>
					<input
						type="password"
						required
						autoComplete={
							mode === "sign-up" ? "new-password" : "current-password"
						}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="w-full rounded-lg border border-console-border bg-black/40 px-4 py-3 text-console-fg outline-none transition focus:border-accent/60"
					/>
				</label>

				{error ? <p className="text-sm text-danger">{error}</p> : null}

				<Button
					type="submit"
					disabled={loading}
					className="w-full justify-center"
				>
					{loading
						? "Please wait…"
						: mode === "sign-up"
							? "Create account"
							: "Sign in"}
				</Button>
			</form>

			<p className="text-center text-sm text-console-fg-muted">
				{mode === "sign-up" ? (
					<>
						Already have an account?{" "}
						<a href="/sign-in" className="text-accent hover:underline">
							Sign in
						</a>
					</>
				) : (
					<>
						Don&apos;t have an account?{" "}
						<a href="/sign-up" className="text-accent hover:underline">
							Create one
						</a>
					</>
				)}
			</p>
		</div>
	);
}
