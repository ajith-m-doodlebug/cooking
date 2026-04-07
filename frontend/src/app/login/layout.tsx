import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure portal | The Archivist",
  description: "Sign in as a Chartered Accountant or as a client to search and book verified CAs.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
