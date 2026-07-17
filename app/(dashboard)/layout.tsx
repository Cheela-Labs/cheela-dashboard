import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(212,160,23,0.12),transparent_28%),radial-gradient(circle_at_top_right,_rgba(212,160,23,0.08),transparent_24%)]" />
			<Sidebar />
			<div className="min-w-0">
				<Topbar />
				<main className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
			</div>
		</div>
	);
}
