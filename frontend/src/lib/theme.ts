/**
 * Global design tokens — aligned with CSS variables in `globals.css`.
 * USER accent: brand primary (#607B7D). CA accent: brand tertiary (#E76C39).
 */
export const colors = {
  brandPrimary: "#607B7D",
  brandPrimaryHover: "#506A6C",
  brandSecondary: "#595F61",
  brandTertiary: "#E76C39",
  brandTertiaryHover: "#CF5F32",
  brandNeutral: "#9E8F80",

  background: "#F0EBE3",
  backgroundSubtle: "#FAF8F5",
  surface: "#FFFFFF",
  border: "#E5DDD4",
  borderLight: "#E5DDD4",
  text: "#2C2E30",
  textMuted: "#6B6560",
  textMutedLight: "#9E958C",

  panelStart: "#595F61",
  panelMid: "#4D5254",
  panelEnd: "#3F4446",
  panelText: "#FAF8F8",
  panelTextMuted: "rgba(250,248,248,0.8)",
  panelBadge: "rgba(0,0,0,0.2)",

  userPrimary: "#607B7D",
  userPrimaryHover: "#506A6C",
  caPrimary: "#E76C39",
  caPrimaryHover: "#CF5F32",

  error: "#B91C1C",
  errorBg: "#FEF2F2",
  success: "#4A7560",
  timer: "#B91C1C",
  link: "#607B7D",
} as const;

/** Role-based theme (Tailwind class strings). Uses CSS variables for one source of truth. */
export function getTheme(role: "USER" | "CA") {
  return role === "CA" ? CA_THEME : USER_THEME;
}

export const USER_THEME = {
  primary: "bg-[var(--color-primary-user)] hover:bg-[var(--color-primary-user-hover)]",
  primaryText: "text-[var(--color-primary-user)]",
  primaryBorder: "border-[var(--color-primary-user)]",
  navLink: "text-[var(--color-text)] hover:text-[var(--color-primary-user)] hover:underline",
  navBorder: "border-[var(--color-border)]",
  bg: "bg-[var(--color-bg-subtle)]",
  bgWhite: "bg-white",
  card: "bg-white border border-[var(--color-border)]",
  text: "text-[var(--color-text)]",
  textMuted: "text-[var(--color-text-muted)]",
  inputBorder:
    "border-[var(--color-border)] focus:border-[var(--color-primary-user)] focus:ring-[var(--color-primary-user)]",
  btnPrimary: "bg-[var(--color-primary-user)] hover:bg-[var(--color-primary-user-hover)] text-white",
} as const;

export const CA_THEME = {
  primary: "bg-[var(--color-primary-ca)] hover:bg-[var(--color-primary-ca-hover)]",
  primaryText: "text-[var(--color-primary-ca)]",
  primaryBorder: "border-[var(--color-primary-ca)]",
  navLink: "text-[var(--color-text)] hover:text-[var(--color-primary-ca)] hover:underline",
  navBorder: "border-[var(--color-border)]",
  bg: "bg-[var(--color-bg-subtle)]",
  bgWhite: "bg-white",
  card: "bg-white border border-[var(--color-border)]",
  text: "text-[var(--color-text)]",
  textMuted: "text-[var(--color-text-muted)]",
  inputBorder:
    "border-[var(--color-border)] focus:border-[var(--color-primary-ca)] focus:ring-[var(--color-primary-ca)]",
  btnPrimary: "bg-[var(--color-primary-ca)] hover:bg-[var(--color-primary-ca-hover)] text-white",
} as const;
