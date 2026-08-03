/**
 * Transactional email, via Resend.
 *
 * Plain `fetch` rather than the `resend` SDK. This app builds standalone from
 * the `cheela-dashboard` mirror with npm and no workspace, so every dependency
 * added here is one more thing that has to resolve in that build — and the
 * whole client is the twenty lines below.
 */

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text: string;
}

/**
 * Reads configuration at call time, not at module scope.
 *
 * Next evaluates modules during `next build`, where no secrets are present. A
 * module-scoped read would either crash the build or — worse — latch
 * `undefined` into a warm lambda and fail every later send with a confusing
 * error about the wrong thing.
 */
function config(): { apiKey: string; from: string } {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM;

	if (!apiKey) {
		throw new Error(
			"RESEND_API_KEY is not set. Email verification cannot send, and SuperTokens' " +
				"default sender must not be used in production — it is a shared development " +
				"service with no delivery guarantees.",
		);
	}
	if (!from) {
		throw new Error(
			'EMAIL_FROM is not set, e.g. "Cheela <noreply@cheelalabs.com>". The domain ' +
				"must be verified in Resend or every send is rejected.",
		);
	}

	return { apiKey, from };
}

/** True when email can actually be sent. Used to fail loudly at boot rather than at 3am. */
export function isEmailConfigured(): boolean {
	return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
	const { apiKey, from } = config();

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to: [input.to],
			subject: input.subject,
			html: input.html,
			text: input.text,
		}),
	});

	if (!response.ok) {
		// The body carries Resend's reason — an unverified sending domain, a
		// malformed address, a revoked key. Swallowing it leaves "email did not
		// arrive" as the only symptom, which is unactionable.
		const detail = await response.text().catch(() => "");
		throw new Error(
			`Resend rejected the message (${response.status}). ${detail}`.trim(),
		);
	}
}

/**
 * The verification email.
 *
 * A link, not a code: SuperTokens' EmailVerification recipe issues
 * `emailVerifyLink` and has no concept of a one-time code. OTP lives in the
 * Passwordless recipe, which is an authentication method rather than a way to
 * prove an address.
 */
export function verificationEmail(link: string): {
	subject: string;
	html: string;
	text: string;
} {
	return {
		subject: "Verify your email for Cheela",
		text: [
			"Confirm your email address to finish setting up your Cheela account.",
			"",
			link,
			"",
			"If you did not create a Cheela account, ignore this message — the address",
			"will not be used, and nothing was created in your name.",
		].join("\n"),
		html: `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#fafaf8;font-family:ui-sans-serif,system-ui,sans-serif;color:#050505">
    <div style="max-width:480px;margin:0 auto">
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
        Confirm your email address to finish setting up your Cheela account.
      </p>
      <p style="margin:0 0 24px">
        <a href="${link}" style="display:inline-block;background:#ffa600;color:#050505;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">
          Verify email
        </a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b6b72;margin:0 0 8px">
        Or paste this into your browser:
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b6b72;word-break:break-all;margin:0 0 24px">
        ${link}
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b6b72;margin:0">
        If you did not create a Cheela account, ignore this message — the address
        will not be used, and nothing was created in your name.
      </p>
    </div>
  </body>
</html>`,
	};
}
