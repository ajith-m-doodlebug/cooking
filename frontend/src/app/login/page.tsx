"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { loginWithGoogle } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/errors";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    async (credentialResponse: CredentialResponse, role: UserRole) => {
      const idToken = credentialResponse.credential;
      if (!idToken) return;
      setError(null);
      try {
        const data = await loginWithGoogle(idToken, role);
        if (!data.user.terms_accepted) {
          router.push(`/terms?role=${data.user.role}`);
          return;
        }
        if (data.user.role === "CA") {
          router.push("/ca/dashboard");
        } else {
          router.push("/client");
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    },
    [router]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-2">Log in</h1>
      <p className="text-gray-600 mb-6">Sign in with Google and choose your role.</p>
      {error && <p className="text-red-600 text-sm mb-4 max-w-xs">{error}</p>}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-500">I am a Client (book CAs)</span>
          <GoogleLogin
            onSuccess={(res) => handleSuccess(res, "USER")}
            onError={() => {}}
            useOneTap={false}
            theme="filled_blue"
            size="large"
            text="signin_with"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-500">I am a Chartered Accountant</span>
          <GoogleLogin
            onSuccess={(res) => handleSuccess(res, "CA")}
            onError={() => {}}
            useOneTap={false}
            theme="filled_blue"
            size="large"
            text="signin_with"
          />
        </div>
      </div>
      <Link href="/" className="mt-6 text-sm text-blue-600 hover:underline">
        Back to home
      </Link>
    </main>
  );
}
