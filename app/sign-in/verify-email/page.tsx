"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EmailVerification from "supertokens-web-js/recipe/emailverification";
import { ensureSuperTokensFrontendInit } from "@/lib/supertokens-frontend";

/**
 * Where a verification link lands, and where an unverified session is sent.
 *
 * The path is not a choice. SuperTokens builds the link as
 * `{origin}{websiteBasePath}/verify-email`, and `websiteBasePath` is
 * `/sign-in`, so this file has to sit exactly here. A static segment takes
 * precedence over the `[[...sign-in]]` catch-all beside it, and `/sign-in` is
 * already public in the middleware — which is what keeps an unverified visitor
 * from being redirected here and then bounced away again.
 */

type State =
	| { kind: "working" }
	| { kind: "verified" }
	| { kind: "expired" }
	| { kind: "sent" }
	/** Sending needs a session, so "not signed in" is a real arrival here. */
	| { kind: "signedOut" }
	| { kind: "failed"; message: string };

export default function VerifyEmailPage() {
	const [state, setState] = useState<State>({ kind: "working" });
	const started = useRef(false);

	// Declared before the effect that calls it. Hoisting is not the point —
	// the effect runs after render either way — but reading it in the order it
	// executes is.
	const resend = useCallback(async () => {
		setState({ kind: "working" });
		try {
			const response = await EmailVerification.sendVerificationEmail();
			setState(
				response.status === "EMAIL_ALREADY_VERIFIED_ERROR"
					? { kind: "verified" }
					: { kind: "sent" },
			);
		} catch (error) {
			// Sending requires a session. Somebody who opened this URL directly,
			// or whose session expired while the tab sat open, gets told to sign
			// in rather than shown a raw 401 they can do nothing with.
			const message =
				error instanceof Error ? error.message : "Could not send the email.";
			setState(
				/unauthor|session/i.test(message)
					? { kind: "signedOut" }
					: { kind: "failed", message },
			);
		}
	}, []);

	useEffect(() => {
		ensureSuperTokensFrontendInit();

		// StrictMode runs effects twice in development. Without this the page
		// requests two verification emails on every mount, and the first token is
		// invalidated by the second — so the link in the earlier email is dead on
		// arrival, which looks exactly like a broken sender.
		if (started.current) return;
		started.current = true;

		// No token means the visitor came from the middleware, not the email.
		//
		// Send now, rather than waiting for a click. Nothing else in this app
		// ever sends: SuperTokens only mails on an explicit call to
		// `/user/email/verify/token`, and sign-up does not make one. The
		// pre-built auth-react UI would have; supertokens-web-js is headless, so
		// this page is the only thing that can, and if it waits for a button then
		// verification silently never happens.
		if (EmailVerification.getEmailVerificationTokenFromURL() === "") {
			void resend();
			return;
		}

		void (async () => {
			try {
				const response = await EmailVerification.verifyEmail();
				setState(
					response.status === "OK"
						? { kind: "verified" }
						: // The token is single-use and time-limited, so this is the
							// ordinary case for a link opened twice or opened late — not
							// an error worth alarming anyone about.
							{ kind: "expired" },
				);
			} catch (error) {
				setState({
					kind: "failed",
					message:
						error instanceof Error ? error.message : "Verification failed.",
				});
			}
		})();
		// `resend` is a useCallback with no dependencies, so it is stable for the
		// life of the component and listing it cannot cause a re-run. The
		// `started` guard above is what actually keeps this to one execution.
	}, [resend]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-console-bg px-6">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="text-xs uppercase tracking-wide text-accent">
					Cheela Cloud
				</div>
				<Body onResend={resend} state={state} />
			</div>
		</div>
	);
}

function Body({ state, onResend }: { state: State; onResend: () => void }) {
	switch (state.kind) {
		case "working":
			return <Message title="One moment" />;

		case "verified":
			return (
				<Message title="Email verified">
					<Action href="/">Go to the dashboard</Action>
				</Message>
			);

		case "sent":
			return (
				<Message
					title="Check your inbox"
					detail="We've sent you a link. Open it to finish setting up your account — a runtime cannot be created until the address is confirmed."
				>
					<Action onClick={onResend}>Send another</Action>
				</Message>
			);

		case "signedOut":
			return (
				<Message
					title="Sign in first"
					detail="We can only send a verification link to a signed-in account."
				>
					<Action href="/sign-in">Go to sign in</Action>
				</Message>
			);

		case "expired":
			return (
				<Message
					title="That link has expired"
					detail="Verification links are single-use and time-limited. Request a fresh one."
				>
					<Action onClick={onResend}>Send a new link</Action>
				</Message>
			);

		case "failed":
			return (
				<Message title="Verification failed" detail={state.message}>
					<Action onClick={onResend}>Try again</Action>
				</Message>
			);
	}
}

function Message({
	title,
	detail,
	children,
}: {
	title: string;
	detail?: string;
	children?: React.ReactNode;
}) {
	return (
		<>
			<h1 className="mt-3 text-3xl font-medium tracking-tight text-console-fg">
				{title}
			</h1>
			{detail ? (
				<p className="text-sm leading-relaxed text-console-fg-muted">
					{detail}
				</p>
			) : null}
			{children}
		</>
	);
}

function Action({
	href,
	onClick,
	children,
}: {
	href?: string;
	onClick?: () => void;
	children: React.ReactNode;
}) {
	const className =
		"inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-ink-0 transition-transform duration-fast ease-out active:scale-[0.97]";

	return href ? (
		<a className={className} href={href}>
			{children}
		</a>
	) : (
		<button className={className} onClick={onClick} type="button">
			{children}
		</button>
	);
}
