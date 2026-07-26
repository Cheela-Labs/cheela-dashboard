"use client";

import { useId, useMemo, useState } from "react";
import type { AnalyticsBucket, AnalyticsSeriesPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/**
 * Series colors.
 *
 * Both are existing design-system tokens — `--color-info` and `--color-danger`.
 * The pair was validated against the card surface (#18181b) in dark mode: worst
 * adjacent CVD ΔE 25.3 (protan), normal-vision ΔE 33.0, both above 3:1 contrast.
 * The brand accent is deliberately *not* used for a mark here: at OKLCH L 0.79
 * it sits outside the dark-mode lightness band, and its nearest in-band step
 * collides with the danger red.
 *
 * Errors wear the status token because the series genuinely means "bad";
 * requests is plain identity, so it takes a categorical hue.
 */
const REQUESTS_COLOR = "#2b6cd3";
const ERRORS_COLOR = "#d3402b";

const SURFACE = "#18181b";
const GRID = "#2a2a2e";

const VIEW_W = 720;
const VIEW_H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

interface Point {
	x: number;
	y: number;
}

function niceCeiling(value: number): number {
	if (value <= 5) return 5;
	const magnitude = 10 ** Math.floor(Math.log10(value));
	return Math.ceil(value / magnitude) * magnitude;
}

function formatTick(iso: string, bucket: AnalyticsBucket): string {
	const date = new Date(iso);
	return bucket === "hour"
		? date.toLocaleTimeString(undefined, { hour: "numeric", hour12: true })
		: date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function path(points: readonly Point[]): string {
	return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
}

export function RequestsTimeseries({
	series,
	bucket,
}: {
	series: readonly AnalyticsSeriesPoint[];
	bucket: AnalyticsBucket;
}) {
	const titleId = useId();
	const [hovered, setHovered] = useState<number | null>(null);
	const [showTable, setShowTable] = useState(false);

	const geometry = useMemo(() => {
		const plotW = VIEW_W - PAD.left - PAD.right;
		const plotH = VIEW_H - PAD.top - PAD.bottom;
		const max = niceCeiling(
			Math.max(
				1,
				...series.map((point) => Math.max(point.requests, point.errors)),
			),
		);

		const x = (index: number) =>
			series.length <= 1
				? PAD.left + plotW / 2
				: PAD.left + (index / (series.length - 1)) * plotW;
		const y = (value: number) => PAD.top + plotH - (value / max) * plotH;

		return {
			max,
			plotW,
			plotH,
			x,
			y,
			requests: series.map((point, i) => ({ x: x(i), y: y(point.requests) })),
			errors: series.map((point, i) => ({ x: x(i), y: y(point.errors) })),
		};
	}, [series]);

	if (series.length === 0) {
		return (
			<p className="text-sm text-console-fg-muted">
				No executions in this range.
			</p>
		);
	}

	const active = hovered === null ? null : series[hovered];
	const ticks = [0, 0.5, 1].map((fraction) => ({
		value: Math.round(geometry.max * fraction),
		y: PAD.top + geometry.plotH * (1 - fraction),
	}));

	// Label only the last point of each series — a number on every point is
	// chaos and goes unread.
	const lastIndex = series.length - 1;
	const last = series[lastIndex];

	return (
		<div className="space-y-4">
			{/* A legend is always present for two or more series. */}
			<div className="flex flex-wrap items-center gap-4 text-xs">
				<LegendKey color={REQUESTS_COLOR} label="Requests" />
				<LegendKey color={ERRORS_COLOR} label="Errors" />
				<button
					type="button"
					onClick={() => setShowTable((open) => !open)}
					className="ml-auto text-console-fg-muted underline-offset-4 hover:text-console-fg hover:underline"
					aria-expanded={showTable}
				>
					{showTable ? "Hide table" : "View as table"}
				</button>
			</div>

			<svg
				viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
				className="w-full"
				role="img"
				aria-labelledby={titleId}
				onPointerLeave={() => setHovered(null)}
			>
				<title id={titleId}>
					Requests and errors per {bucket === "hour" ? "hour" : "day"}
				</title>

				{/* Hairline, solid, one step off the surface. Never dashed. */}
				{ticks.map((tick) => (
					<g key={tick.value}>
						<line
							x1={PAD.left}
							x2={VIEW_W - PAD.right}
							y1={tick.y}
							y2={tick.y}
							stroke={GRID}
							strokeWidth={1}
						/>
						<text
							x={PAD.left - 8}
							y={tick.y + 4}
							textAnchor="end"
							className="fill-console-fg-muted"
							style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
						>
							{formatNumber(tick.value)}
						</text>
					</g>
				))}

				<text
					x={PAD.left}
					y={VIEW_H - 8}
					className="fill-console-fg-muted"
					style={{ fontSize: 10 }}
				>
					{formatTick(series[0]?.t ?? "", bucket)}
				</text>
				{series.length > 1 ? (
					<text
						x={VIEW_W - PAD.right}
						y={VIEW_H - 8}
						textAnchor="end"
						className="fill-console-fg-muted"
						style={{ fontSize: 10 }}
					>
						{formatTick(last?.t ?? "", bucket)}
					</text>
				) : null}

				{/* Area wash under requests: the series hue at ~10% opacity. */}
				<path
					d={`${path(geometry.requests)} L${geometry.x(lastIndex)} ${
						PAD.top + geometry.plotH
					} L${geometry.x(0)} ${PAD.top + geometry.plotH} Z`}
					fill={REQUESTS_COLOR}
					fillOpacity={0.1}
				/>

				<path
					d={path(geometry.requests)}
					fill="none"
					stroke={REQUESTS_COLOR}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d={path(geometry.errors)}
					fill="none"
					stroke={ERRORS_COLOR}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{/* End markers carry a 2px surface ring so they stay legible where they overlap. */}
				<EndMarker
					point={geometry.requests[lastIndex]}
					color={REQUESTS_COLOR}
				/>
				<EndMarker point={geometry.errors[lastIndex]} color={ERRORS_COLOR} />

				{hovered !== null ? (
					<line
						x1={geometry.x(hovered)}
						x2={geometry.x(hovered)}
						y1={PAD.top}
						y2={PAD.top + geometry.plotH}
						stroke={GRID}
						strokeWidth={1}
					/>
				) : null}

				{/*
					Readers aim at a date, not a 2px line: each band is a full-height
					hit target, at least 24px wide.

					These are a pointer affordance only — no role, no focus. The
					accessible path is the SVG's own title plus the table view below,
					where every value the tooltip shows is reachable without hovering
					at all. Focusable shapes here would add 90 tab stops in front of it.
				*/}
				{series.map((point, index) => (
					<rect
						key={point.t}
						aria-hidden
						x={
							geometry.x(index) -
							geometry.plotW / Math.max(series.length, 1) / 2
						}
						y={PAD.top}
						width={Math.max(24, geometry.plotW / Math.max(series.length, 1))}
						height={geometry.plotH}
						fill="transparent"
						onPointerEnter={() => setHovered(index)}
					/>
				))}
			</svg>

			{/* One tooltip, every series — values lead, labels follow. */}
			<div className="min-h-[2.5rem]">
				{active ? (
					<div className="inline-flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-console-border bg-black/40 px-4 py-2 text-sm">
						<span className="text-console-fg-muted">
							{formatTick(active.t, bucket)}
						</span>
						<TooltipRow
							color={REQUESTS_COLOR}
							value={formatNumber(active.requests)}
							label="requests"
						/>
						<TooltipRow
							color={ERRORS_COLOR}
							value={formatNumber(active.errors)}
							label="errors"
						/>
						<TooltipRow value={`${active.p50.toFixed(0)}ms`} label="p50" />
					</div>
				) : (
					<p className="text-sm text-console-fg-muted">
						{formatNumber(last?.requests ?? 0)} requests in the last bucket
						{last && last.errors > 0
							? `, ${formatNumber(last.errors)} failed`
							: ""}
						.
					</p>
				)}
			</div>

			{/* The table view: every value reachable without hovering. */}
			{showTable ? (
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead className="text-console-fg-muted">
							<tr>
								<th className="py-2 pr-4 font-normal">Bucket</th>
								<th className="py-2 pr-4 font-normal">Requests</th>
								<th className="py-2 pr-4 font-normal">Errors</th>
								<th className="py-2 pr-4 font-normal">p50</th>
								<th className="py-2 font-normal">Tokens</th>
							</tr>
						</thead>
						<tbody
							className="text-console-fg"
							style={{ fontVariantNumeric: "tabular-nums" }}
						>
							{series.map((point) => (
								<tr key={point.t} className="border-t border-console-border">
									<td className="py-2 pr-4">{formatTick(point.t, bucket)}</td>
									<td className="py-2 pr-4">{formatNumber(point.requests)}</td>
									<td className="py-2 pr-4">{formatNumber(point.errors)}</td>
									<td className="py-2 pr-4">{point.p50.toFixed(0)}ms</td>
									<td className="py-2">{formatNumber(point.totalTokens)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : null}
		</div>
	);
}

function EndMarker({ point, color }: { point?: Point; color: string }) {
	if (!point) return null;
	return (
		<circle
			cx={point.x}
			cy={point.y}
			r={4}
			fill={color}
			stroke={SURFACE}
			strokeWidth={2}
		/>
	);
}

/** Legends mirror the mark: a short stroke for a line series. */
function LegendKey({ color, label }: { color: string; label: string }) {
	return (
		<span className="inline-flex items-center gap-2 text-console-fg-muted">
			<span
				aria-hidden
				className="inline-block h-0.5 w-4 rounded-full"
				style={{ backgroundColor: color }}
			/>
			{label}
		</span>
	);
}

function TooltipRow({
	color,
	value,
	label,
}: {
	color?: string;
	value: string;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			{color ? (
				<span
					aria-hidden
					className="inline-block h-0.5 w-3 rounded-full"
					style={{ backgroundColor: color }}
				/>
			) : null}
			<span className="font-medium text-console-fg">{value}</span>
			<span className="text-console-fg-muted">{label}</span>
		</span>
	);
}
