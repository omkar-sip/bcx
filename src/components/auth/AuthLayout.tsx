import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="relative min-h-screen overflow-hidden bg-brand-mist">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(241,90,34,0.08),transparent_32%),radial-gradient(circle_at_90%_70%,rgba(22,163,74,0.1),transparent_38%)]" />
    <main className="relative mx-auto flex min-h-screen max-w-6xl items-stretch px-4 py-6 sm:px-6 sm:py-10">
      <section className="w-full overflow-hidden rounded-3xl bg-white shadow-float lg:grid lg:grid-cols-[minmax(0,450px)_minmax(0,1fr)]">
        <div className="p-6 sm:p-10">{children}</div>
        <aside className="hidden bg-brand-orange bg-hero-radial p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-[0.15em]">
              BHARAT CARBON EXCHANGE
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">
              Climate impact becomes measurable when every role participates.
            </h1>
            <p className="mt-4 max-w-md text-sm text-orange-50">
              BCX unifies employee action scoring, company credit procurement, and farmer
              monetization into one marketplace-ready workflow.
            </p>
          </div>

          <div className="space-y-3">
            <article className="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.15em] text-orange-100">Active users</p>
              <p className="mt-1 text-2xl font-extrabold">12,480+</p>
            </article>
            <article className="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.15em] text-orange-100">
                Carbon traded monthly
              </p>
              <p className="mt-1 text-2xl font-extrabold">5,100 tCO2e</p>
            </article>
          </div>
        </aside>
      </section>
    </main>
  </div>
);
