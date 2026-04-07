"use client";

import { useRouter } from "next/navigation";
import VerifyOtpPage from "@/components/VerifyOtpPage";

export default function ClientVerifyPhonePage() {
  const router = useRouter();

  return (
    <VerifyOtpPage
      role="USER"
      successRedirect="/client"
      backHref="/client"
      brandLabel="The Archivist"
      onSuccess={() => router.replace("/client")}
    />
  );
}
