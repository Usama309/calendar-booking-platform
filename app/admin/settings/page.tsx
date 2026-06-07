import { auth } from "@/auth";
import { Card } from "@/components/ui";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--forest)]">
        Settings
      </h1>
      <p className="mt-1 text-slate-500">Account and platform information.</p>

      <Card className="mt-6 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">
              {session?.user.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">
              {session?.user.email}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--forest)]">
          How scheduling works
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Availability = working windows − blocks − Google busy − bookings, spaced by buffer.</li>
          <li>Slots in the past are never shown.</li>
          <li>Every booking is re-validated immediately before insertion.</li>
          <li>A unique DB constraint prevents identical double-bookings.</li>
        </ul>
      </Card>
    </div>
  );
}
