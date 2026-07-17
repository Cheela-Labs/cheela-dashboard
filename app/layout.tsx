import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
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
		<ClerkProvider
			appearance={{
				variables: {
					colorPrimary: "#d4a017",
					colorBackground: "#111111",
					colorText: "#f5f5f5",
					colorInputBackground: "#090909",
					colorInputText: "#f5f5f5",
					borderRadius: "1rem",
				},
			}}
		>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}
				>
					{children}
				</body>
			</html>
		</ClerkProvider>
	);
}
