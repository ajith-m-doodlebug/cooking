"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/auth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
      return;
    }
    if (user.role !== "USER") {
      router.replace("/ca/dashboard");
    }
  }, [user, tokens, router]);

  if (!user || user.role !== "USER") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex gap-4">
          <Link href="/client" className="text-blue-600 hover:underline">
            Home
          </Link>
          <Link href="/search" className="text-gray-600 hover:underline">
            Search CAs
          </Link>
          <Link href="/client/bookings" className="text-gray-600 hover:underline">
            My Bookings
          </Link>
        </div>
        <span className="text-sm text-gray-500">{user.email}</span>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Log out
        </button>
      </nav>
      {children}
    </div>
  );
}
