import { globalStyle, style, createTheme } from "@vanilla-extract/css";

export const [themeClass, theme] = createTheme({
	color: {
		bg: "#fafafa",
		surface: "#ffffff",
		border: "#e2e2e8",
		text: "#1a1a22",
		textMuted: "#6b6b78",
		accent: "#3b5bdb",
		accentBg: "#eef1fd",
		error: "#c92a2a",
		errorBg: "#fdf0f0",
	},
	font: {
		body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
		mono: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
	},
	space: {
		xs: "4px",
		sm: "8px",
		md: "12px",
		lg: "16px",
		xl: "24px",
	},
});

globalStyle("*", {
	boxSizing: "border-box",
});

globalStyle("html, body", {
	margin: 0,
	padding: 0,
});

globalStyle("body", {
	backgroundColor: theme.color.bg,
	color: theme.color.text,
	fontFamily: theme.font.body,
	fontSize: "14px",
	lineHeight: "1.5",
});

export const appShell = style({
	maxWidth: "1100px",
	margin: "0 auto",
	padding: theme.space.xl,
});

export const header = style({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	flexWrap: "wrap",
	gap: theme.space.md,
	paddingBottom: theme.space.lg,
	borderBottom: `1px solid ${theme.color.border}`,
	marginBottom: theme.space.xl,
});

export const title = style({
	margin: 0,
	fontSize: "20px",
	fontWeight: 600,
});

export const controls = style({
	display: "flex",
	alignItems: "center",
	gap: theme.space.sm,
	flexWrap: "wrap",
});

export const button = style({
	fontFamily: theme.font.body,
	fontSize: "13px",
	padding: `${theme.space.xs} ${theme.space.md}`,
	border: `1px solid ${theme.color.border}`,
	borderRadius: "6px",
	backgroundColor: theme.color.surface,
	color: theme.color.text,
	cursor: "pointer",
	selectors: {
		"&:hover": {
			borderColor: theme.color.accent,
		},
	},
});

export const primaryButton = style({
	backgroundColor: theme.color.accent,
	color: "#ffffff",
	borderColor: theme.color.accent,
});

export const dropZone = style({
	border: `2px dashed ${theme.color.border}`,
	borderRadius: "8px",
	padding: theme.space.xl,
	textAlign: "center" as const,
	color: theme.color.textMuted,
	selectors: {
		"&[data-active='true']": {
			borderColor: theme.color.accent,
			backgroundColor: theme.color.accentBg,
		},
	},
});

export const errorBox = style({
	backgroundColor: theme.color.errorBg,
	color: theme.color.error,
	border: `1px solid ${theme.color.error}`,
	borderRadius: "6px",
	padding: theme.space.md,
	margin: `${theme.space.md} 0`,
	fontFamily: theme.font.mono,
	fontSize: "12px",
	whiteSpace: "pre-wrap" as const,
});

export const table = style({
	width: "100%",
	borderCollapse: "collapse",
	fontSize: "13px",
});

globalStyle(`.${table} th`, {
	textAlign: "left",
	padding: theme.space.sm,
	borderBottom: `1px solid ${theme.color.border}`,
	fontWeight: 600,
	color: theme.color.textMuted,
	fontSize: "12px",
	textTransform: "uppercase",
	letterSpacing: "0.04em",
});

globalStyle(`.${table} td`, {
	padding: theme.space.sm,
	borderBottom: `1px solid ${theme.color.border}`,
	verticalAlign: "top",
});

export const monospace = style({
	fontFamily: theme.font.mono,
	fontSize: "12px",
});

export const badge = style({
	display: "inline-block",
	padding: `1px ${theme.space.xs}`,
	borderRadius: "4px",
	fontSize: "11px",
	fontFamily: theme.font.mono,
	backgroundColor: theme.color.accentBg,
	color: theme.color.accent,
});

export const filterRow = style({
	display: "flex",
	gap: theme.space.sm,
	alignItems: "center",
	marginBottom: theme.space.md,
	flexWrap: "wrap",
});

export const select = style({
	fontFamily: theme.font.body,
	fontSize: "13px",
	padding: `${theme.space.xs} ${theme.space.sm}`,
	border: `1px solid ${theme.color.border}`,
	borderRadius: "6px",
	backgroundColor: theme.color.surface,
});

export const input = style({
	fontFamily: theme.font.body,
	fontSize: "13px",
	padding: `${theme.space.xs} ${theme.space.sm}`,
	border: `1px solid ${theme.color.border}`,
	borderRadius: "6px",
	backgroundColor: theme.color.surface,
});

export const statGrid = style({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
	gap: theme.space.md,
});

export const statCard = style({
	backgroundColor: theme.color.surface,
	border: `1px solid ${theme.color.border}`,
	borderRadius: "8px",
	padding: theme.space.md,
});

export const statLabel = style({
	fontSize: "12px",
	color: theme.color.textMuted,
	textTransform: "uppercase",
	letterSpacing: "0.04em",
	marginBottom: theme.space.xs,
});

export const statValue = style({
	fontSize: "22px",
	fontWeight: 600,
});

export const statSub = style({
	fontSize: "12px",
	color: theme.color.textMuted,
	marginTop: theme.space.xs,
});

export const graphContainer = style({
	backgroundColor: theme.color.surface,
	border: `1px solid ${theme.color.border}`,
	borderRadius: "8px",
	padding: theme.space.lg,
	overflow: "auto",
	minHeight: "300px",
});

export const traceTree = style({
	fontFamily: theme.font.mono,
	fontSize: "13px",
	lineHeight: "1.7",
});

export const muted = style({
	color: theme.color.textMuted,
});

export const tabsRoot = style({
	display: "flex",
	flexDirection: "column",
	gap: theme.space.lg,
});

export const tabsList = style({
	display: "flex",
	gap: "0",
	borderBottom: `1px solid ${theme.color.border}`,
});

export const tabsTrigger = style({
	fontFamily: theme.font.body,
	fontSize: "13px",
	padding: `${theme.space.sm} ${theme.space.lg}`,
	border: "none",
	background: "none",
	cursor: "pointer",
	color: theme.color.textMuted,
	borderBottom: "2px solid transparent",
	marginBottom: "-1px",
	selectors: {
		'&[data-state="active"]': {
			color: theme.color.accent,
			borderBottomColor: theme.color.accent,
			fontWeight: 600,
		},
		"&:hover": {
			color: theme.color.text,
		},
	},
});

export const sectionTitle = style({
	fontSize: "15px",
	fontWeight: 600,
	margin: `${theme.space.lg} 0 ${theme.space.sm}`,
});
