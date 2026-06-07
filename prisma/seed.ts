import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin1234";
  const name = process.env.SEED_ADMIN_NAME || "Administrator";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  console.log(`✓ Admin user ready: ${email} / ${password}`);

  // Tuesday (2) and Friday (5), 09:00–17:00 working window.
  const consultDays = [2, 5];
  const consultWindow = { startTime: "09:00", endTime: "17:00" };

  // Primary booking option: Virtual Meeting (Zoom).
  const virtual = await prisma.calendar.upsert({
    where: { slug: "virtual" },
    update: {
      name: "Virtual Meeting",
      description:
        "Meet with your attorney by Zoom from the comfort of your home, no travel required.",
      timezone: "America/Los_Angeles",
      durationMinutes: 60,
      bufferMinutes: 0,
      isActive: true,
    },
    create: {
      userId: admin.id,
      name: "Virtual Meeting",
      slug: "virtual",
      description:
        "Meet with your attorney by Zoom from the comfort of your home, no travel required.",
      timezone: "America/Los_Angeles",
      durationMinutes: 60,
      bufferMinutes: 0,
      isActive: true,
    },
  });
  await prisma.availabilityRule.deleteMany({ where: { calendarId: virtual.id } });
  await prisma.availabilityRule.createMany({
    data: consultDays.map((weekday) => ({
      calendarId: virtual.id,
      weekday,
      ...consultWindow,
    })),
  });

  // Second booking option: In-Person Visit (Milwaukie office).
  const inPerson = await prisma.calendar.upsert({
    where: { slug: "in-person" },
    update: {
      name: "In-Person Visit",
      description:
        "Visit us at our Milwaukie office for a private, face-to-face consultation with your attorney.",
      timezone: "America/Los_Angeles",
      durationMinutes: 60,
      bufferMinutes: 0,
      isActive: true,
    },
    create: {
      userId: admin.id,
      name: "In-Person Visit",
      slug: "in-person",
      description:
        "Visit us at our Milwaukie office for a private, face-to-face consultation with your attorney.",
      timezone: "America/Los_Angeles",
      durationMinutes: 60,
      bufferMinutes: 0,
      isActive: true,
    },
  });
  await prisma.availabilityRule.deleteMany({ where: { calendarId: inPerson.id } });
  await prisma.availabilityRule.createMany({
    data: consultDays.map((weekday) => ({
      calendarId: inPerson.id,
      weekday,
      ...consultWindow,
    })),
  });

  // Retire the original sample calendars (kept for history, hidden from public).
  await prisma.calendar.updateMany({
    where: { slug: { in: ["free-consultation", "discovery-call"] } },
    data: { isActive: false },
  });

  console.log("✓ Booking calendars seeded: /book/virtual, /book/in-person");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
