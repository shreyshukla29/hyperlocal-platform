# Provider Service – Features Overview

This document lists all features of the Provider service for the hyperlocal platform. Every API enforces validation (schema on all payloads) and authorization (provider can access only their own resources).

---

## 1. Provider signup (event-driven)

- **Source**: Auth service publishes `user.signed_up` to RabbitMQ with `accountType: 'PROVIDER'`.
- **Behavior**: Provider service consumes the event, filters by `accountType === 'PROVIDER'`, and creates a **Provider** record (authIdentityId, firstName, lastName, email, phone, default verificationStatus PENDING, availabilityStatus OFFLINE, isActive true).
- **Idempotency**: Create is idempotent on `authIdentityId` (unique); duplicate events do not create duplicate providers.
- **Security**: Consumer validates event payload schema; invalid messages go to DLQ.

---

## 2. Provider profile

- **GET profile**: Return provider’s own profile (resolved by `x-user-id` = auth identity). Only the owning provider can read their full profile for “my dashboard”.
- **PATCH profile**: Update firstName, lastName, email, phone, avatarUrl, businessName, businessAddress. Only the owning provider can update; payload validated with schema.
- **Ownership**: Every request must resolve provider by `authIdentityId` from JWT; 403 if no provider or wrong identity.

---

## 3. Verification (documents and status)

- **Document upload**: Provider uploads verification documents (e.g. ID, business license) to Cloudinary; service stores **secure URLs** only (idDocumentUrl, businessLicenseUrl). Upload endpoints validate file type/size and auth (owner only).
- **Verification status**: Stored on Provider as `verificationStatus`: `PENDING` | `VERIFIED` | `REJECTED`. After upload, status remains or is set to PENDING; VERIFIED/REJECTED set by admin or separate process (out of scope for MVP).
- **Security**: Only the owning provider can upload documents for their profile; all payloads and file metadata validated.

---

## 4. Provider services (offerings)

- **CRUD**: Create, read, update, delete “service offerings” (e.g. “Plumbing”, “AC repair”) scoped to the provider. Each offering has name, description, category, price/rate, durationMinutes, status.
- **Status**: `ACTIVE` | `INACTIVE` | `PAUSED`. Only the owning provider can change status (e.g. “pause” a service temporarily).
- **List**: Provider can list only their own services (for dashboard and for public/search – search service consumes or reads catalog).
- **Ownership**: All mutations require `providerId` to match the provider resolved from JWT; 403 otherwise.

---

## 5. Availability and status

- **Availability status**: Stored on Provider as `availabilityStatus`: `ONLINE` | `OFFLINE` | `DAY_OFF` | `BUSY`. Provider can set “online for service”, “day off”, “busy”, etc. Only the owning provider can update.
- **Platform active flag**: `isActive` (boolean) – soft on/off for the platform; only owner or admin can update.
- **Recurring schedule (optional)**: Provider can set weekly working hours (e.g. Mon–Fri 9–17) via **ProviderSchedule** (dayOfWeek, startTime, endTime). Used to show “available at these times” and to support “day off” vs “within hours”.
- **Specific days off**: Provider can mark specific dates as “day off” via **ProviderDayOff** (date, optional reason). Used for holidays or one-off unavailability.
- **Security**: Only the owning provider can read/update their availability, schedule, and days off; payloads validated.

---

## 6. Service personnel (field workers)

Providers send **field workers** (e.g. plumber, technician) to perform services. We register their details under the provider and use them for assignment and tracking.

### 6.1 Who is verified?

- **Provider-only verification (recommended for MVP)**: Only the **provider (business)** is verified (documents, business license). Field workers are **registered by the provider** with name, phone, optional ID; we do **not** verify each person individually. The provider is liable for who they send. This keeps onboarding simple and matches “provider sends his man” flow.
- **Optional later**: Per–service-person verification (ID, background check) can be added as a separate feature and stored on **ServicePerson** (e.g. `verificationStatus`, `idDocumentUrl`).

### 6.2 Service person details (registration)

- **ServicePerson** (or field worker) belongs to one provider (`providerId`). Only the owning provider can create/update/delete.
- **Stored fields**: name, phone, email (optional), role/title (optional), optional `authIdentityId` if they have their own app login (see status below). `isActive` for soft disable.
- **Validation**: All payloads validated; phone/email format and length enforced. No one can register a service person for another provider (ownership by `authIdentityId` from JWT).

### 6.3 How provider assigns a person to a booking

- **Assignment is owned by Booking service**: When a booking is created (user books provider + provider service), the **provider** (or dispatcher) assigns one of **their** service people to that booking. The **Booking service** stores `assignedServicePersonId` (and `providerId`) and is the source of truth for “booking X is assigned to person Y”.
- **Provider service role**: (1) Expose **list my service people** (and get one by id) so the provider app can show a list and pick someone to assign. (2) Expose **check availability**: “is this service person available for this slot?” (optional: Provider service can track `currentBookingId` or rely on Booking service to tell it when someone is assigned/unassigned). (3) When Booking service assigns, it can call Provider service: “assign service person S to booking B” → Provider service marks person as BUSY and optionally stores `currentBookingId` (or Booking service publishes `booking.assigned` and Provider service consumes and updates status). So we have two options:
  - **A) Booking service is source of truth**: Booking service stores assignment; when assignment is created/updated, Booking service calls Provider service API “set service person S status to BUSY” and on unassign/complete “set to AVAILABLE”. Provider service does not store which booking.
  - **B) Provider service stores current assignment**: Provider service has `ServicePerson.currentBookingId` (optional). When provider assigns in their app, they call Provider service “assign person S to booking B”; Provider service validates S belongs to provider and is AVAILABLE, then sets S to BUSY and stores currentBookingId. Booking service then gets “who is assigned” from Provider service or Booking service also stores assignedServicePersonId (eventual consistency). For simplicity, **A** is clearer: Booking service owns assignment and notifies Provider service to update person status (BUSY/AVAILABLE).
- **API for provider**: “List my service people”, “Get service person by id”, “Update service person status” (AVAILABLE / BUSY / OFF_DUTY). Optionally “Assign to booking” can be an API that accepts bookingId and servicePersonId – Provider service marks person BUSY; the actual assignment record is created in Booking service (provider app calls Booking service “assign person X to booking Y” and Booking service calls Provider service “set person X to BUSY” or we use events). So: **Provider service** exposes CRUD for ServicePerson and “update status”; **Booking service** exposes “assign service person to booking” and “unassign / complete” and keeps assignment record; when assigning, Booking service validates with Provider service that servicePersonId belongs to providerId (HTTP call or event).

### 6.4 Service person status and login

- **Status**: Each **ServicePerson** has a **status**: `AVAILABLE` | `BUSY` | `OFF_DUTY`. Only the owning provider (or the worker if they have login) can update.
  - **AVAILABLE**: Can be assigned to a booking.
  - **BUSY**: Currently assigned to a booking (or explicitly set by provider).
  - **OFF_DUTY**: Not available (day off, leave, etc.); cannot be assigned.
- **Login (optional)**: If the field worker has their own app login, store `authIdentityId` on ServicePerson. Then:
  - **Worker app** can update their own status (e.g. “I’m on duty” → AVAILABLE, “I’m off” → OFF_DUTY) and optionally “I’m at the job” / “Job started” / “Job completed” (those updates can go to Booking service for booking status).
  - We can track “last logged in at” or “is logged in” by checking JWT/session in the worker app and optionally storing `lastActiveAt` on ServicePerson when they hit the API.
- **Who updates status**: Provider (dashboard) can set status for any of their people. If `authIdentityId` is set, the worker (via worker app) can also set their own status; ownership check: either provider identity or service person’s authIdentityId matches JWT.

### 6.5 “Provider sent his man to another place” / managing location and assignments

- **One active assignment at a time**: A service person should only be assigned to **one** booking at a time for a given time window. When the provider assigns them to a **new** booking (e.g. “send him to another place”), the **Booking service** should: (1) Unassign or complete the previous booking (if any), or (2) Reject the new assignment if the person is already assigned to another overlapping booking. So assignment logic lives in Booking service: “assign person X to booking Y” checks that X is not already assigned to another booking with overlapping slot.
- **Same person, different address**: If “another place” means a **different address for the same booking**, that’s an address/address-change on the booking (Booking service), not a new assignment.
- **Location tracking (optional)**: If we want “where is the service person now?” (e.g. for “on the way” or safety), we can store **last known location** on Provider service: **ServicePersonLocation** (servicePersonId, latitude, longitude, updatedAt). Worker app (or provider app) sends periodic updates; only the owning provider or that worker (by authIdentityId) can update. Booking service can then show “assigned worker is en route” or use location for ETA. For MVP we can skip location and add later.
- **Summary**: Provider service stores **ServicePerson** (details + status); Booking service stores **assignment** (bookingId, assignedServicePersonId, slot) and enforces one-active-assignment-per-person; Provider service exposes list/CRUD/status for service people so provider can assign (via Booking service) and see who is busy/available.

---

## 7. Dashboard

- **Single aggregate endpoint** (unchanged): e.g. `GET /api/v1/provider/dashboard` returning:
  - Provider profile (minimal: name, avatar, businessName, verificationStatus, availabilityStatus, isActive).
  - List of provider’s services with status and optional per-service stats (e.g. from Rating service later).
  - List of service people (field workers) with status (AVAILABLE / BUSY / OFF_DUTY) so provider can see who is free to assign.
  - Recent feedback: either from Rating service (HTTP) or local cache; plan assumes Rating service owns reviews – dashboard can call Rating service or expose a “recent feedback” that Rating service populates.
  - Simple stats: total services, active services count, total service people, available count.
- **Ownership**: Dashboard returns only data for the provider identified by JWT; no cross-access.

---

## 8. Security and validation (mandatory)

- **Validation**: All request payloads (body, query, params) validated with a schema (e.g. Zod) before use; no raw `req.body`. Invalid requests return 400 with clear errors.
- **Authorization**: Every endpoint that returns or mutates a resource first resolves the provider by `authIdentityId` from `x-user-id`; then enforces that the resource belongs to that provider. 403 if not owner.
- **Gateway**: All provider routes behind JWT; gateway forwards `x-user-id` (auth identity). Backend verifies gateway API key and uses `x-user-id` for ownership only.

---

## 9. Data model summary (for schema)

| Area            | Entities / fields |
|-----------------|-------------------|
| Profile         | Provider: authIdentityId, firstName, lastName, email, phone, avatarUrl, businessName, businessAddress, isActive, isDeleted |
| Verification    | Provider: verificationStatus (enum), idDocumentUrl, businessLicenseUrl |
| Availability    | Provider: availabilityStatus (enum); ProviderSchedule (dayOfWeek, startTime, endTime); ProviderDayOff (date, reason?) |
| Offerings       | ProviderService: providerId, name, description, category, price, durationMinutes, status (enum) |
| Service personnel | ServicePerson: providerId, name, phone, email?, role?, authIdentityId?, status (AVAILABLE/BUSY/OFF_DUTY), isActive; optional ServicePersonLocation (servicePersonId, latitude, longitude, updatedAt) |
| Assignment      | Owned by Booking service: bookingId, assignedServicePersonId, slot; Provider service exposes list/status for service people only |
| Events          | Consumer: user.signed_up → create Provider when accountType PROVIDER |

Schema and tables are defined in `prisma/schema.prisma` to cover all of the above with indexes and relations as needed.
