"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/auth";
import api from "@/lib/api";
import { USER_THEME } from "@/lib/theme";

interface TermsStatus {
  has_accepted: boolean;
  current_version: string;
  accepted_version: string | null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user || !tokens?.access_token) {
      router.replace("/login");
      return;
    }
    if (user.role !== "USER") {
      router.replace("/ca/dashboard");
      return;
    }
    if (!user.is_phone_verified && pathname !== "/client/verify-phone") {
      router.replace("/client/verify-phone");
      return;
    }
    if (pathname === "/client/verify-phone") {
      setTermsChecked(true);
      setTermsAccepted(true);
      return;
    }
    api
      .get<TermsStatus>("/terms/status")
      .then((r) => {
        if (!r.data.has_accepted) {
          setTermsAccepted(false);
          router.replace(`/terms?role=USER`);
        }
        setTermsChecked(true);
      })
      .catch(() => setTermsChecked(true));
  }, [user, tokens, router, pathname]);

  if (!user || user.role !== "USER") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-[#6B7280]">Redirecting…</p>
      </main>
    );
  }

  if (!termsChecked || !termsAccepted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-[#6B7280]">Checking access…</p>
      </main>
    );
  }

  const isVerifyPage = pathname === "/client/verify-phone";

  return (
    <div className={`min-h-screen ${USER_THEME.bg}`}>
      {!isVerifyPage && (
        <nav className={`border-b ${USER_THEME.navBorder} bg-white px-6 py-3 flex items-center justify-between`}>
          <div className="flex gap-6">
            <Link href="/client" className={`text-sm font-medium ${USER_THEME.navLink}`}>
              Home
            </Link>
            <Link href="/search" className={`text-sm font-medium ${USER_THEME.navLink}`}>
              Search CAs
            </Link>
            <Link href="/client/bookings" className={`text-sm font-medium ${USER_THEME.navLink}`}>
              My Bookings
            </Link>
          </div>
          <span className="text-sm text-[#6B7280]">{user.email}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-sm text-[#DC2626] hover:underline"
          >
            Log out
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}
