/**
 * Global color palette — matches login page. Use these everywhere for consistency.
 * Primary/secondary are role-based (USER: blue, CA: amber).
 */
export const colors = {
  // Neutrals (shared)
  background: "#F3F4F6",
  backgroundSubtle: "#F9FAFB",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  borderLight: "#E5E7EB",
  text: "#111827",
  textMuted: "#6B7280",
  textMutedLight: "#9CA3AF",
  // Left panel / banner (login, OTP)
  panelStart: "#1F2937",
  panelMid: "#4B5563",
  panelEnd: "#111827",
  panelText: "#F8F8F8",
  panelTextMuted: "rgba(248,248,248,0.8)",
  panelBadge: "rgba(0,0,0,0.2)",
  // USER (primary)
  userPrimary: "#4285F4",
  userPrimaryHover: "#3367D6",
  // CA (primary)
  caPrimary: "#F59E0B",
  caPrimaryHover: "#d97706",
  // Semantic
  error: "#DC2626",
  errorBg: "#FEF2F2",
  success: "#059669",
  timer: "#DC2626",
  link: "#4285F4",
} as const;

/** Role-based theme (Tailwind class strings). Use for OTP, login, etc. */
export function getTheme(role: "USER" | "CA") {
  return role === "CA" ? CA_THEME : USER_THEME;
}

/** USER theme: matches login "I am Looking for Chartered Accountant" */
export const USER_THEME = {
  primary: "bg-[#4285F4] hover:bg-[#3367D6]",
  primaryText: "text-[#4285F4]",
  primaryBorder: "border-[#4285F4]",
  navLink: "text-[#111827] hover:text-[#4285F4] hover:underline",
  navBorder: "border-[#E5E7EB]",
  bg: "bg-[#F9FAFB]",
  bgWhite: "bg-white",
  card: "bg-white border border-[#E5E7EB]",
  text: "text-[#111827]",
  textMuted: "text-[#6B7280]",
  inputBorder: "border-[#E5E7EB] focus:border-[#4285F4] focus:ring-[#4285F4]",
  btnPrimary: "bg-[#4285F4] hover:bg-[#3367D6] text-white",
} as const;

/** CA theme: matches login "I am a Chartered Accountant" */
export const CA_THEME = {
  primary: "bg-[#F59E0B] hover:bg-[#d97706]",
  primaryText: "text-[#F59E0B]",
  primaryBorder: "border-[#F59E0B]",
  navLink: "text-[#111827] hover:text-[#F59E0B] hover:underline",
  navBorder: "border-[#E5E7EB]",
  bg: "bg-[#F9FAFB]",
  bgWhite: "bg-white",
  card: "bg-white border border-[#E5E7EB]",
  text: "text-[#111827]",
  textMuted: "text-[#6B7280]",
  inputBorder: "border-[#E5E7EB] focus:border-[#F59E0B] focus:ring-[#F59E0B]",
  btnPrimary: "bg-[#F59E0B] hover:bg-[#d97706] text-white",
} as const;
