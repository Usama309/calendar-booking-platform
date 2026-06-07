"use client";

import { useRouter } from "next/navigation";
import {
  Video,
  Building2,
  MapPin,
  ArrowRight,
  Check,
  UserRound,
  BadgeDollarSign,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { BookingHeader } from "@/components/BookingHeader";

interface Option {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  badgeIcon: LucideIcon;
}

const OPTIONS: Option[] = [
  {
    slug: "virtual",
    title: "Virtual Meeting",
    description:
      "Meet with your attorney by Zoom from the comfort of your home, no travel required.",
    icon: Video,
    badge: "Zoom Video Call",
    badgeIcon: Video,
  },
  {
    slug: "in-person",
    title: "In-Person Visit",
    description:
      "Visit us at our Milwaukie office for a private, face-to-face consultation with your attorney.",
    icon: Building2,
    badge: "Milwaukie, OR Office",
    badgeIcon: MapPin,
  },
];

const TRUST = [
  "Direct attorney access",
  "Oregon licensed attorneys",
  "Confidential & secure",
];

const EXPECT: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: UserRound,
    title: "Direct Attorney Access",
    body: "You will meet one-on-one with an experienced estate planning attorney, not a paralegal or case manager. Your time is spent getting real answers.",
  },
  {
    icon: BadgeDollarSign,
    title: "$250 Consultation",
    body: "An unhurried hour designed around your situation. You'll leave with real answers, a clear sense of the path forward, and a flat-fee quote for any plan you choose.",
  },
  {
    icon: Sparkles,
    title: "Personalized Guidance",
    body: "Every family is different. We develop a tailored strategy that reflects your assets, your wishes, and the specific needs of your loved ones.",
  },
];

export default function BookSelectionPage() {
  const router = useRouter();

  return (
    <main className="flex-1">
      <BookingHeader />

      {/* Hero */}
      <section className="bg-[var(--forest)] text-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex items-center gap-3 text-[var(--gold)]">
            <span className="h-px w-10 bg-[var(--gold)]/60" />
            <span className="font-eyebrow text-[11px]">By Appointment</span>
          </div>
          <h1 className="font-display mt-5 text-4xl leading-[1.05] sm:text-6xl">
            Request a Consultation
          </h1>
          <p className="font-display mt-5 max-w-xl text-lg italic text-[var(--background)]/80 sm:text-2xl">
            A consultation with an experienced attorney to discuss your
            situation, your goals, and your concerns, and to receive thoughtful,
            tailored legal guidance.
          </p>
          <div className="mt-7 h-px w-16 bg-[var(--gold)]/40" />
          <p className="font-eyebrow mt-4 text-[11px] text-[var(--gold)]">
            Consultation fee: $250, paid in advance
          </p>
        </div>
      </section>

      {/* Selection */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl text-[var(--forest)] sm:text-4xl">
            How Would You Like to <span className="italic">Meet?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
            Choose your preferred format to see available times with our
            attorneys.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const BadgeIcon = opt.badgeIcon;
            return (
              <button
                key={opt.slug}
                type="button"
                onClick={() => router.push(`/book/${opt.slug}`)}
                className="group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--gold)] hover:shadow-lg sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-dark)] transition-colors group-hover:bg-[var(--gold)] group-hover:text-[var(--primary-foreground)]">
                    <Icon className="h-6 w-6" strokeWidth={1.6} />
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold-dark)] transition-all group-hover:translate-x-0.5 group-hover:bg-[var(--gold-soft)]">
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>

                <h3 className="font-display mt-5 text-xl font-semibold text-[var(--forest)]">
                  {opt.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {opt.description}
                </p>

                <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--forest)]">
                  <BadgeIcon className="h-3.5 w-3.5 text-[var(--gold-dark)]" strokeWidth={1.75} />
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Live availability · Pacific Time
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[var(--gold-dark)]" strokeWidth={2} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* What to Expect */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="font-display text-3xl text-[var(--forest)] sm:text-4xl">
              What to <span className="italic">Expect</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[var(--muted)]">
              Your consultation is designed to be useful, informative, and
              completely personalized to your situation.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EXPECT.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="gold-frame rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-dark)]">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-[var(--forest)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
