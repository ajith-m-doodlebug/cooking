import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Archivist | Secure Portal",
  description:
    "Professional ledger access for practitioners and strategic financial oversight for organizations.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
