"use client";

import { useRouter } from "next/navigation";
import VerifyOtpPage from "@/components/VerifyOtpPage";

export default function CAVerifyPhonePage() {
  const router = useRouter();

  return (
    <VerifyOtpPage
      role="CA"
      successRedirect="/ca/onboarding"
      backHref="/ca/onboarding"
      brandLabel="The Archivist"
      onSuccess={() => router.replace("/ca/onboarding")}
    />
  );
}
