import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SuperTokensProvider } from "@/components/providers/supertokens-provider";
import "./globals.css";

const ranade = localFont({
	src: "./fonts/Ranade-Variable.ttf",
	variable: "--font-ranade",
	weight: "100 900",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Cheela Dashboard",
		template: "%s · Cheela",
	},
	description:
		"Cheela Cloud control plane — runtimes, executions, traces, and analytics.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${ranade.variable} ${jetbrainsMono.variable} bg-console-bg text-console-fg antialiased`}
			>
				<SuperTokensProvider>{children}</SuperTokensProvider>
			</body>
		</html>
	);
}
