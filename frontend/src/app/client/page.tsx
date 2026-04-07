import Link from "next/link";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

export default function ClientHomePage() {
  return (
    <main className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-editorial">
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-primary-hover)]" />
          <div className="p-8 md:p-12">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--color-brand-tertiary)]">
              Welcome
            </span>
            <h1 className="font-headline mt-3 text-3xl font-bold text-[var(--color-text)] md:text-4xl">
              Your financial partners, one search away
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--color-text-muted)]">
              Browse verified Chartered Accountants, compare services and fees, and manage your bookings from this
              portal.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[var(--color-brand-primary-hover)]"
              >
                <MaterialIcon name="search" className="!text-xl text-white" />
                Search CAs
              </Link>
              <Link
                href="/client/bookings"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-border)] bg-transparent px-8 py-3.5 text-sm font-bold text-[var(--color-brand-primary)] transition hover:bg-[var(--color-bg-subtle)]"
              >
                <MaterialIcon name="event_available" className="!text-xl" />
                My bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
