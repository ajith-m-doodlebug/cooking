import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/editorial/MaterialIcon";

const IMG_HERO =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&auto=format&fit=crop";
const IMG_DESK =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&auto=format&fit=crop";
const IMG_TEAM =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&auto=format&fit=crop";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-body selection:bg-[var(--color-warning-bg)]">
      <nav className="fixed top-0 z-50 w-full glass-editorial border-b border-[var(--color-border)]/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
          <Link
            href="/"
            className="font-headline text-2xl font-bold tracking-tight text-[var(--color-brand-primary)]"
          >
            The Archivist
          </Link>
          <div className="hidden items-center gap-10 md:flex">
            <Link
              href="/"
              className="font-headline text-lg font-medium tracking-tight text-[var(--color-brand-tertiary)] border-b-2 border-[var(--color-brand-tertiary)] pb-1"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="font-headline text-lg font-medium tracking-tight text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-tertiary)]"
            >
              Services
            </Link>
            <Link
              href="/terms"
              className="font-headline text-lg font-medium tracking-tight text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-tertiary)]"
            >
              Legal
            </Link>
            <Link
              href="/login"
              className="font-headline text-lg font-medium tracking-tight text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-brand-tertiary)]"
            >
              Portal
            </Link>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-[var(--color-brand-tertiary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-tertiary-hover)] active:scale-[0.98]"
          >
            Secure portal
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:px-8 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7">
              <span className="mb-6 block text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-brand-tertiary)]">
                Verified CA network
              </span>
              <h1 className="font-headline text-5xl font-extrabold leading-[0.95] tracking-tight text-[var(--color-brand-primary)] md:text-7xl md:leading-[0.95]">
                Chartered heritage, <br />
                <span className="font-semibold text-[var(--color-brand-secondary)]">modern access</span>
              </h1>
              <p className="mb-10 mt-8 max-w-2xl text-xl leading-relaxed text-[var(--color-text-muted)] md:text-2xl">
                Find and book verified Chartered Accountants for compliance, audit, and advisory — with clear
                fees, availability, and secure sign-in.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link
                  href="/search"
                  className="rounded-lg bg-[var(--color-brand-tertiary)] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[var(--color-brand-tertiary-hover)]"
                >
                  Find a CA
                </Link>
                <Link
                  href="/login"
                  className="group flex items-center gap-2 text-lg font-bold text-[var(--color-brand-primary)] editorial-underline"
                >
                  Practitioner or client login
                  <MaterialIcon name="arrow_forward" className="!text-xl transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="relative lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--color-bg-subtle)] shadow-editorial-lg">
                <Image src={IMG_HERO} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" priority />
              </div>
              <div className="absolute -bottom-6 -left-4 max-w-[240px] rounded-lg bg-white p-6 shadow-editorial md:-left-6">
                <p className="font-headline text-3xl font-bold text-[var(--color-brand-primary)]">100%</p>
                <p className="text-xs font-bold uppercase tracking-tight text-[var(--color-text-muted)]">
                  ICAI-verified professional profiles
                </p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-1/3 bg-gradient-to-l from-[var(--color-card-bg)]/80 to-transparent" />
        </section>

        <section className="bg-[var(--color-card-bg)] py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-brand-tertiary)]">
                  Our expertise
                </span>
                <h2 className="font-headline text-4xl font-bold tracking-tight text-[var(--color-brand-primary)] md:text-5xl">
                  Precision in practice
                </h2>
              </div>
              <p className="mb-2 max-w-sm text-lg text-[var(--color-text-muted)]">
                Search by service, mode, and fee — then book a slot that fits your calendar.
              </p>
            </div>
            <div className="grid grid-cols-1 overflow-hidden rounded-xl bg-white shadow-editorial md:grid-cols-3">
              {[
                {
                  icon: "account_balance",
                  title: "Audit & assurance",
                  body: "Statutory and internal audits with transparent scope and documented deliverables.",
                },
                {
                  icon: "payments",
                  title: "Tax & compliance",
                  body: "GST, income tax, and regulatory filings aligned to your entity structure.",
                },
                {
                  icon: "insights",
                  title: "Advisory",
                  body: "Growth, restructuring, and CFO-level guidance from experienced practitioners.",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={`p-10 transition-colors hover:bg-[var(--color-bg-subtle)] md:p-12 ${i < 2 ? "md:border-r md:border-[var(--color-border)]/40" : ""}`}
                >
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-card-bg)] text-[var(--color-brand-primary)]">
                    <MaterialIcon name={item.icon} className="!text-3xl" />
                  </div>
                  <h3 className="font-headline mb-4 text-2xl font-bold text-[var(--color-brand-primary)]">{item.title}</h3>
                  <p className="mb-8 leading-relaxed text-[var(--color-text-muted)]">{item.body}</p>
                  <Link
                    href="/search"
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-brand-tertiary)]"
                  >
                    Explore
                    <MaterialIcon name="chevron_right" className="!text-lg" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
                <div className="relative mt-10 aspect-square overflow-hidden rounded-xl bg-[var(--color-bg-subtle)]">
                  <Image src={IMG_DESK} alt="" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-card-bg)]">
                  <Image src={IMG_TEAM} alt="" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <span className="mb-4 block text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-brand-tertiary)]">
                  Why teams use the platform
                </span>
                <h2 className="font-headline mb-8 text-4xl font-bold tracking-tight text-[var(--color-brand-primary)] md:text-5xl">
                  Why trusted partners choose us
                </h2>
                <div className="space-y-10">
                  {[
                    {
                      n: "01",
                      t: "Verified professionals",
                      d: "Profiles tied to ICAI membership and platform verification workflows.",
                    },
                    {
                      n: "02",
                      t: "Clear booking journey",
                      d: "Pick a CA, see fees and modes, complete payment when your flow requires it.",
                    },
                    {
                      n: "03",
                      t: "Role-aware access",
                      d: "Separate secure portals for practitioners and clients with phone verification.",
                    },
                  ].map((row) => (
                    <div key={row.n} className="flex gap-6">
                      <span className="font-headline text-3xl font-bold text-[var(--color-brand-tertiary)]/35">{row.n}</span>
                      <div>
                        <h4 className="font-headline mb-2 text-xl font-bold text-[var(--color-brand-primary)]">{row.t}</h4>
                        <p className="leading-relaxed text-[var(--color-text-muted)]">{row.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-primary)] py-20 text-white md:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center md:px-8">
            <h2 className="font-headline mb-6 text-4xl font-bold leading-tight md:text-5xl">
              Start with a verified CA today
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/85">
              Sign in as a client to search and book, or as a practitioner to complete onboarding and go live in
              search.
            </p>
            <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
              <Link
                href="/login"
                className="w-full rounded-lg bg-[var(--color-brand-tertiary)] px-10 py-4 text-lg font-bold text-white transition hover:bg-[var(--color-brand-tertiary-hover)] md:w-auto"
              >
                Open secure portal
              </Link>
              <Link href="/search" className="border-b border-white/40 pb-1 text-lg font-bold text-white editorial-underline">
                Browse directory
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-12 bg-[var(--color-brand-secondary)] px-6 py-14 text-sm text-[var(--color-bg-subtle)] md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <div className="font-headline mb-5 text-xl text-white">The Archivist</div>
            <p className="max-w-xs leading-relaxed opacity-85">
              CA Marketplace — connecting businesses and individuals with verified Chartered Accountants.
            </p>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/search" className="opacity-80 transition hover:opacity-100 hover:text-[var(--color-brand-tertiary)]">
                  Find a CA
                </Link>
              </li>
              <li>
                <Link href="/login" className="opacity-80 transition hover:opacity-100 hover:text-[var(--color-brand-tertiary)]">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="opacity-80 transition hover:opacity-100 hover:text-[var(--color-brand-tertiary)]">
                  Terms &amp; privacy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white">Contact</h4>
            <p className="opacity-80">Support via your signed-in dashboard.</p>
          </div>
        </div>
        <div className="mx-auto mt-14 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/15 pt-8 opacity-70 md:flex-row">
          <p>© {new Date().getFullYear()} CA Marketplace. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/terms" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
