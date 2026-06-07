import { google } from "googleapis";
import type { GoogleConnection } from "@prisma/client";
import { prisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";
import type { BusyInterval } from "./availability";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForConnection(
  code: string,
  userId: string
): Promise<void> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: profile } = await oauth2.userinfo.get();

  const accessToken = tokens.access_token ?? "";
  // Refresh token may be absent on re-consent; keep the existing one if so.
  const existing = await prisma.googleConnection.findUnique({
    where: { userId },
  });
  const refreshToken = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : existing?.refreshToken ?? "";
  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  await prisma.googleConnection.upsert({
    where: { userId },
    create: {
      userId,
      googleEmail: profile.email ?? "unknown",
      accessToken: encrypt(accessToken),
      refreshToken,
      expiresAt,
      calendarId: "primary",
    },
    update: {
      googleEmail: profile.email ?? "unknown",
      accessToken: encrypt(accessToken),
      refreshToken,
      expiresAt,
    },
  });
}

/**
 * Returns an authenticated OAuth client, refreshing the access token if it has
 * expired and persisting the refreshed token.
 */
async function authedClient(connection: GoogleConnection) {
  const client = oauthClient();
  const refreshToken = connection.refreshToken
    ? decrypt(connection.refreshToken)
    : undefined;
  const accessToken = connection.accessToken
    ? decrypt(connection.accessToken)
    : undefined;

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: connection.expiresAt.getTime(),
  });

  const isExpired = connection.expiresAt.getTime() < Date.now() + 60_000;
  if (isExpired && refreshToken) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await prisma.googleConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: encrypt(credentials.access_token ?? accessToken ?? ""),
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000),
      },
    });
  }

  return client;
}

export async function getBusyIntervals(
  connection: GoogleConnection,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  try {
    const client = await authedClient(connection);
    const calendar = google.calendar({ version: "v3", auth: client });
    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId || "primary" }],
      },
    });
    const cal = data.calendars?.[calendarId || "primary"];
    const busy = cal?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch (err) {
    console.error("Google freebusy query failed:", err);
    return [];
  }
}

export async function createCalendarEvent(
  connection: GoogleConnection,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    startUtc: Date;
    endUtc: Date;
    timezone: string;
    attendeeEmail?: string;
  }
): Promise<string | null> {
  try {
    const client = await authedClient(connection);
    const calendar = google.calendar({ version: "v3", auth: client });
    const { data } = await calendar.events.insert({
      calendarId: calendarId || "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startUtc.toISOString(), timeZone: event.timezone },
        end: { dateTime: event.endUtc.toISOString(), timeZone: event.timezone },
        attendees: event.attendeeEmail
          ? [{ email: event.attendeeEmail }]
          : undefined,
      },
    });
    return data.id ?? null;
  } catch (err) {
    console.error("Google event creation failed:", err);
    return null;
  }
}

export async function deleteCalendarEvent(
  connection: GoogleConnection,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const client = await authedClient(connection);
    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.delete({
      calendarId: calendarId || "primary",
      eventId,
    });
  } catch (err) {
    console.error("Google event deletion failed:", err);
  }
}
