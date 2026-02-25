"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { useRequireAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface TermsContent {
  id: string;
  role: UserRole;
  version: string;
  content: string;
}

interface TermsStatus {
  has_accepted: boolean;
  current_version: string;
  accepted_version: string | null;
}

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as UserRole) || "USER";
  const { user, isAuthenticated } = useRequireAuth();
  const [terms, setTerms] = useState<TermsContent | null>(null);
  const [status, setStatus] = useState<TermsStatus | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      api.get<TermsContent>(`/terms/${role}`).then((r) => r.data),
      api.get<TermsStatus>("/terms/status").then((r) => r.data),
    ])
      .then(([content, st]) => {
        setTerms(content);
        setStatus(st);
        if (st.has_accepted) {
          if (user?.role === "CA") router.replace("/ca/dashboard");
          else router.replace("/client");
        }
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
      });
  }, [isAuthenticated, role, user?.role, router]);

  const handleAccept = useCallback(() => {
    if (!terms) return;
    setAccepting(true);
    setError(null);
    api
      .post("/terms/accept", { version: terms.version })
      .then(() => {
        if (user?.role === "CA") router.push("/ca/dashboard");
        else router.push("/client");
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
        setAccepting(false);
      });
  }, [terms, user?.role, router]);

  if (!isAuthenticated || !terms) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-gray-500">Loading terms…</p>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Terms &amp; Conditions</h1>
      <div
        className="prose prose-sm mb-6 border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: terms.content }}
      />
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {accepting ? "Accepting…" : "I Accept"}
      </button>
    </main>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center p-8"><p className="text-gray-500">Loading…</p></main>}>
      <TermsContent />
    </Suspense>
  );
}
