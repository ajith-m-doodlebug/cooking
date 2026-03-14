import Link from "next/link";
import { USER_THEME } from "@/lib/theme";

export default function ClientHomePage() {
  return (
    <main className={`p-8 ${USER_THEME.bg} min-h-[60vh]`}>
      <div className={`max-w-2xl ${USER_THEME.card} rounded-2xl p-8 shadow-sm`}>
        <h1 className={`text-2xl font-bold mb-4 ${USER_THEME.text}`}>Welcome</h1>
        <p className={`${USER_THEME.textMuted} mb-6`}>
          Search for verified CAs and book consultations.
        </p>
        <Link
          href="/search"
          className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold ${USER_THEME.btnPrimary}`}
        >
          Search CAs
        </Link>
      </div>
    </main>
  );
}
