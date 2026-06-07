# **Software Requirements Specification (SRS)**

## **Multi-Calendar Booking Platform with Google Calendar Synchronization**

### **MVP Version 1.0**

---

# **1. Project Overview**

## **Project Name**

Multi-Calendar Booking Platform

## **Purpose**

Build a self-hosted appointment scheduling platform similar to Calendly’s core functionality, focused on:

- Multiple booking calendars
- Public booking pages
- Google Calendar synchronization
- Custom availability rules
- Appointment management
- Administrative calendar management

The system must allow administrators to create unlimited booking calendars, each with independent scheduling rules and Google Calendar integration.

---

# **2. Business Goal**

The platform should enable an administrator to:

- Create multiple appointment calendars
- Define meeting durations
- Define availability schedules
- Define buffer times
- Connect Google Calendar
- Automatically block occupied times
- Accept public bookings
- Sync bookings back to Google Calendar
- Prevent scheduling conflicts

The MVP should focus on reliability and scheduling accuracy.

---

# **3. User Roles**

## **3.1 Administrator**

Responsible for:

- Creating calendars
- Managing calendars
- Connecting Google Calendar
- Viewing bookings
- Blocking dates
- Managing availability
- Configuring scheduling settings

---

## **3.2 Public User**

Can:

- Access public booking page
- View available dates
- Select time slot
- Complete booking form
- Submit appointment request

Cannot:

- View admin data
- Modify calendars
- View other bookings

---

# **4. System Architecture**

The system consists of:

## **Public Booking Application**

Frontend for customers.

Functions:

- Calendar display
- Availability display
- Booking form
- Confirmation screen

---

## **Admin Dashboard**

Backend management portal.

Functions:

- Calendar management
- Availability management
- Booking management
- Google Calendar integration
- Settings management

---

## **Backend API**

Responsibilities:

- Availability calculations
- Booking creation
- Conflict checking
- Google synchronization
- Authentication
- Data management

---

## **Database Layer**

Stores:

- Users
- Calendars
- Availability rules
- Bookings
- Blocked dates
- Google tokens

---

## **Google Calendar Service**

Responsibilities:

- OAuth
- Fetch busy times
- Create calendar events
- Refresh tokens
- Sync appointments

---

# **5. Functional Requirements**

# **FR-1 Authentication**

## **Administrator Login**

Admin must be able to:

- Login
- Logout
- Reset password

MVP:

- Email/password login

---

# **FR-2 Calendar Management**

Admin must be able to create unlimited calendars.

Each calendar contains:


| **Field**       | **Type**        |
| --------------- | --------------- |
| Name            | Text            |
| Slug            | URL-safe string |
| Description     | Text            |
| Timezone        | Timezone        |
| Duration        | Integer         |
| Buffer          | Integer         |
| Active          | Boolean         |
| Google Calendar | Optional        |


Example:

```text
Free Consultation

Duration:
30 minutes

Buffer:
15 minutes
```

---

# **FR-3 Calendar Availability Configuration**

Each calendar must support:

## **Working Days**

Example:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
```

---

## **Working Hours**

Example:

```text
9:00 AM
to
5:00 PM
```

---

## **Multiple Time Windows**

Example:

```text
9:00 AM - 12:00 PM

2:00 PM - 5:00 PM
```

Supported.

---

# **FR-4 Manual Blocking**

Admin can block:

## **Entire Date**

Example:

```text
December 25
```

Unavailable.

---

## **Time Range**

Example:

```text
July 10

10:00 AM - 2:00 PM
```

Unavailable.

---

# **FR-5 Google Calendar Integration**

Only Google Calendar required.

---

## **OAuth Connection**

Admin clicks:

```text
Connect Google Calendar
```

System:

- Redirects to Google OAuth
- Requests calendar access
- Stores tokens

---

## **Token Storage**

Store:

```text
Access Token
Refresh Token
Expiry
Calendar ID
```

Encrypted.

---

## **Busy Time Synchronization**

System fetches:

```text
Busy events
```

from Google Calendar.

Only busy periods matter.

Event details are not required.

---

## **Conflict Prevention**

If Google Calendar contains:

```text
2:00 PM - 3:00 PM
```

then:

```text
2:00 PM slot unavailable
```

---

## **Booking Synchronization**

When booking created:

System creates Google event.

Store:

```text
google_event_id
```

---

# **FR-6 Public Booking Flow**

---

## **Step 1**

User visits:

```text
/book/free-consultation
```

---

## **Step 2**

User sees calendar.

Display:

```text
Available dates
```

---

## **Step 3**

User clicks date.

Example:

```text
July 20
```

---

## **Step 4**

System loads available slots.

Example:

```text
10:00 AM
10:45 AM
11:30 AM
```

---

## **Step 5**

User selects slot.

---

## **Step 6**

Booking form appears.

Fields:

```text
Full Name
Email
Phone
Message
```

---

## **Step 7**

Submit booking.

---

## **Step 8**

System validates availability again.

---

## **Step 9**

Booking created.

---

## **Step 10**

Google event created.

---

## **Step 11**

Confirmation shown.

---

# **FR-7 Booking Management**

Admin can:

View bookings.

Filters:

```text
Calendar
Date
Status
Email
Name
```

---

Statuses:

```text
Pending
Confirmed
Cancelled
```

---

# **FR-8 Availability Engine**

This is the most critical system.

---

Input:

```text
Calendar Settings
Google Busy Times
Manual Blocks
Existing Bookings
```

---

Output:

```text
Available Slots
```

---

Calculation:

```text
Working Hours

minus

Manual Blocks

minus

Google Busy Times

minus

Existing Bookings

minus

Buffer Times
```

---

Example:

```text
Working Hours:

9 AM - 5 PM

Duration:
30 min

Buffer:
15 min
```

Produces:

```text
9:00

9:45

10:30

11:15

etc.
```

---

# **FR-9 Multi-Calendar Support**

Unlimited calendars.

Each calendar has:

```text
Own duration
Own buffer
Own availability
Own bookings
Own URL
Own settings
```

---

# **FR-10 Public Links**

Example:

```text
/book/discovery-call

/book/free-consultation

/book/legal-review
```

Generated automatically.

---

# **6. Database Design**

# **Users**

```sql
id
name
email
password_hash
created_at
updated_at
```

---

# **Calendars**

```sql
id
user_id
name
slug
description
timezone
duration_minutes
buffer_minutes
is_active
google_calendar_id
created_at
updated_at
```

---

# **Availability Rules**

```sql
id
calendar_id
weekday
start_time
end_time
created_at
updated_at
```

---

# **Blocked Times**

```sql
id
calendar_id
date
start_time
end_time
reason
created_at
updated_at
```

---

# **Bookings**

```sql
id
calendar_id
customer_name
customer_email
customer_phone
message
appointment_date
start_time
end_time
timezone
status
google_event_id
created_at
updated_at
```

---

# **Google Connections**

```sql
id
user_id
google_email
access_token
refresh_token
expires_at
calendar_id
created_at
updated_at
```

---

# **7. API Requirements**

# **Calendar APIs**

```http
GET /api/calendars

POST /api/calendars

PUT /api/calendars/:id

DELETE /api/calendars/:id
```

---

# **Availability APIs**

```http
GET /api/calendars/:slug/availability

GET /api/calendars/:slug/slots
```

---

# **Booking APIs**

```http
POST /api/bookings

GET /api/bookings

GET /api/bookings/:id

PATCH /api/bookings/:id
```

---

# **Google APIs**

```http
GET /api/google/connect

GET /api/google/callback

POST /api/google/disconnect

POST /api/google/sync
```

---

# **8. User Interface Requirements**

# **Public Booking Page**

Layout:

```text
------------------------------------
| Calendar | Available Time Slots |
------------------------------------

| Month    | 10:00 AM             |
| View     | 10:45 AM             |
|           | 11:30 AM             |
------------------------------------
```

---

After slot selection:

```text
--------------------------------
Appointment Summary
--------------------------------

Date
Time

Name
Email
Phone

Message

[Confirm Booking]
--------------------------------
```

---

# **Admin Dashboard**

Sidebar:

```text
Dashboard

Calendars

Bookings

Google Calendar

Settings
```

---

# **Calendar Detail Screen**

Sections:

```text
General

Availability

Blocked Dates

Google Sync

Bookings
```

---

# **9. Non-Functional Requirements**

## **Performance**

Availability query:

```text
< 500ms
```

Target.

---

Booking creation:

```text
< 2 seconds
```

---

## **Security**

Must:

- Use HTTPS
- Encrypt Google tokens
- Validate all inputs
- Protect admin routes
- Prevent CSRF
- Prevent XSS
- Prevent SQL Injection

---

## **Reliability**

Must:

- Prevent double booking
- Use database transactions
- Revalidate slot before insert

---

## **Scalability**

Architecture should support:

```text
1000+ calendars
100,000+ bookings
```

without redesign.

---

## **Maintainability**

Use:

```text
Service Layer
Repository Layer
Controller Layer
```

Architecture.

---

# **10. Recommended Tech Stack**

## **Frontend**

```text
Next.js 15
TypeScript
Tailwind CSS
shadcn/ui
React Query
```

---

## **Backend**

```text
Next.js API Routes
or

NestJS
```

Preferred:

```text
Next.js Full Stack
```

---

## **Database**

```text
PostgreSQL
Prisma ORM
```

---

## **Authentication**

```text
NextAuth
```

---

## **Calendar Integration**

```text
Google Calendar API
Google OAuth 2.0
```

---

# **11. MVP Acceptance Criteria**

System is complete when:

✓ Admin can login

✓ Admin can create calendars

✓ Admin can edit calendars

✓ Admin can define meeting duration

✓ Admin can define buffer time

✓ Admin can define availability

✓ Admin can block dates

✓ Admin can block time ranges

✓ Admin can connect Google Calendar

✓ Google busy times block availability

✓ Public users can book appointments

✓ Bookings sync to Google Calendar

✓ Double booking prevented

✓ Admin can view bookings

✓ Public booking links work

✓ Multiple calendars work independently

✓ Mobile responsive

✓ Production deployable

---

# **Cursor Build Instructions**

Build this as a production-quality MVP using:

- Next.js 15 App Router
- TypeScript
- PostgreSQL
- Prisma
- NextAuth
- Google Calendar API
- Tailwind
- shadcn/ui

Implement the complete backend, frontend, database schema, API routes, authentication, Google OAuth integration, availability engine, booking workflow, admin dashboard, and public booking pages.

Prioritize correctness of scheduling logic and conflict prevention over visual polish.

Generate the project in phases:

1. Database schema
2. Authentication
3. Admin dashboard
4. Calendar CRUD
5. Availability engine
6. Google Calendar integration
7. Public booking flow
8. Booking synchronization
9. Testing
10. Production deployment readiness

Use clean architecture, TypeScript types throughout, Prisma migrations, server actions where appropriate, and production-grade error handling.