# Provider service – routes, validation, and logic

## Route-level validation (same as user service)

- **Body:** `validateBody(schema)` on POST/PATCH; invalid payload → 400 before controller.
- **Query:** `validateQuery(schema)` on GET list/search; invalid query → 400 before controller.
- **Params:** No Zod on params; controller/service validate presence and format where needed.
- **Auth:** Gateway sets `x-user-id` (and `x-user-roles` for admin). Controllers read via `getAuthIdentityIdFromRequest` / `getRolesFromRequest`; business rules (ownership, active, admin) live in **service** layer.

---

## Provider routes

| Route | Method | Validation | Purpose | Logic (brief) |
|-------|--------|------------|---------|----------------|
| `/provider/profile` | GET | — | Get current provider | Provider by `x-user-id`; 404 if not found; 403 if inactive/deleted. |
| `/provider/top-by-location` | GET | validateQuery(topProvidersByLocationQuerySchema) | Discovery | Paginated list of active providers; filter by city/geo (optional); no auth. |
| `/provider/profile/:id` | PATCH | validateBody(updateProviderProfileSchema) | Update own profile | Must be owner (`provider.authIdentityId === x-user-id`), active; apply only provided fields. |
| `/provider/:providerId/verification` | PATCH | validateBody(updateVerificationStatusSchema) | **Admin-only** set verification | Require caller `accountType === 'ADMIN'` (from `x-account-type`); when status = VERIFIED, `verifiedBy` required; set `verifiedAt`/`verifiedBy` in DB. |
| `/provider/:providerId/availability/open-intervals` | GET | — | Slots for booking | Load provider; if day-off → []; else schedule for that weekday; no auth. |

---

## Provider offerings (services)

| Route | Method | Validation | Purpose | Logic (brief) |
|-------|--------|------------|---------|----------------|
| `/provider/services` | POST | validateBody(createProviderOfferingSchema) | Create offering | Resolve provider from `x-user-id`; must be active; create with provider.id. |
| `/provider/services` | GET | validateQuery(listProviderOfferingsQuerySchema) | List own offerings | Resolve provider from `x-user-id`; list by provider.id with optional page/limit/status. |
| `/provider/services/:id` | GET | — | Get one offering | Resolve provider; get offering by id + provider.id; 404 if not owned. |
| `/provider/services/:id` | PATCH | validateBody(updateProviderOfferingSchema) | Update offering | Same ownership; partial update. |
| `/provider/services/:id` | DELETE | — | Delete offering | Same ownership; hard delete. |
| `/provider/:providerId/services/:providerServiceId/booking-quote` | GET | — | **No auth** – price for booking | Validate provider + offering exist and active; return pricePaise, durationMinutes, providerAuthId. |

---

## Service person routes (field workers)

**Purpose:** Providers (businesses) manage their field workers. Only **VERIFIED** providers can create service people. `providerId` is never taken from the body; it is always the provider resolved from `x-user-id`.

| Route | Method | Validation | Purpose | Logic (brief) |
|-------|--------|------------|---------|----------------|
| `/provider/service-people` | POST | validateBody(createServicePersonSchema) | Create worker | Provider from `x-user-id` must be VERIFIED; `providerServiceIds` must belong to that provider; create with provider.id. |
| `/provider/service-people` | GET | validateQuery(listServicePeopleQuerySchema) | List workers | Provider from `x-user-id`; list by provider.id; optional status, isActive, providerServiceId. |
| `/provider/service-people/:id` | GET | — | Get one worker | Load worker + provider; allow if caller is **provider owner** or **worker** (same authIdentityId as service person). |
| `/provider/service-people/:id` | PATCH | validateBody(updateServicePersonSchema) | Update worker | Only provider owner; validate `providerServiceIds` belong to provider if present. |
| `/provider/service-people/:id/status` | PATCH | validateBody(updateServicePersonStatusSchema) | Update status | Allowed for **provider or worker** (AVAILABLE/BUSY/OFF_DUTY). |
| `/provider/service-people/:id` | DELETE | — | Deactivate worker | Only provider owner; soft deactivate (isActive = false). |

---

## Search routes (public)

| Route | Method | Validation | Purpose | Logic (brief) |
|-------|--------|------------|---------|----------------|
| `/search/` | GET | validateQuery(searchQuerySchema) | Search services | q, category, city, verifiedOnly, page, limit; filter ACTIVE services + active providers; paginate. |
| `/search/top-services` | GET | validateQuery(topServicesQuerySchema) | Top services | Same filters; order by verified first, then createdAt; no auth. |

---

## Security and separation of concerns

- **Validation (shape/format):** Route layer only (`validateBody` / `validateQuery`). Service does **not** re-parse body/query schemas.
- **Auth and authorization:** Service layer (e.g. “provider from x-user-id”, “must be VERIFIED”, “must be ADMIN”, “owner or worker”).
- **Verification endpoint:** Enforced **admin-only** in controller (`getAccountTypeFromRequest` === `'ADMIN'`); `verifiedBy` required when setting VERIFIED; `verifiedAt`/`verifiedBy` stored in DB. Identity has a single **accountType** (USER | PROVIDER | ADMIN) in auth DB.
