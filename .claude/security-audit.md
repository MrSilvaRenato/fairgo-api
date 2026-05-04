# Security Audit — ausfairgo.com.au
Performed: 2026-05-04

## Status Legend
- [ ] Pending
- [x] Fixed

---

## CRITICAL

- [x] **[CRIT-1]** `database/seeders/AdminSeeder.php` — Hardcoded admin email + plaintext password committed to repo. Move to env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), rotate password immediately.
- [x] **[CRIT-2]** `app/Http/Controllers/EmailVerificationController.php:9–25` — Email verification only checks `sha1(email)` (computable by anyone). Signed URL `signature` and `expires` are never validated. Fix: use `URL::hasValidSignature($request)`.
- [x] **[CRIT-3]** `app/Http/Controllers/CompanyController.php:158` — SVG accepted for logo uploads, stored on public disk. SVGs can contain `<script>` tags → stored XSS. Fix: remove `svg` from allowed MIME list or sanitise with `enshrined/svg-sanitize`.
- [x] **[CRIT-4]** `app/Http/Controllers/CompanyClaimController.php:97` + `CompanyController.php:90` — Claim proof documents (ASIC extracts, employment contracts, director certs) stored on `public` disk. Fix: store on `private` disk, serve via authenticated admin-only route.

---

## HIGH

- [x] **[HIGH-1]** `app/Http/Controllers/TrustBadgeController.php:37` — Raw URL `$slug` param interpolated directly into JS string in `embedScript()` → JS injection on third-party sites. Fixed: DB lookup performed first, sanitised `$company->slug` used instead.
- [x] **[HIGH-2]** `app/Models/Complaint.php` — `phone` field returned publicly in `toArray()`. Added to `$hidden`.
- [x] **[HIGH-3]** `app/Models/Subscription.php` — `stripe_customer_id` + `stripe_subscription_id` serialised in public `GET /api/companies/{slug}` response. Added to `$hidden`.
- [x] **[HIGH-4]** `routes/api.php:45` — `POST /api/auth/phone/send` (OTP) had no throttle → SMS flooding. Fixed: `throttle:3,60`.
- [x] **[HIGH-5]** `routes/api.php:125` — `POST /api/ai/draft-response` had no throttle → unlimited Anthropic API cost. Fixed: `throttle:20,1`.
- [x] **[HIGH-6]** `.env.example:4` — `APP_DEBUG=true` as default. Fixed: changed to `false`.

---

## MEDIUM

- [x] **[MED-1]** `routes/api.php:52–53` — No throttle on `GET /api/abn/search` and `GET /api/abn/check/{abn}` → ABR quota exhaustion / scraping. Fix: `throttle:30,1`.
- [x] **[MED-2]** `routes/api.php:88,99,72,116` — No throttle on complaint replies, logo upload, company claim submission, ID verification upload. Fix: add appropriate throttle limits.
- [x] **[MED-3]** `routes/api.php` — `PATCH /api/company/settings`, `POST /api/company/logo`, `POST /api/company/abn/verify` only gate on `auth:sanctum`, no role check. Fix: add explicit `role=company_admin` check.
- [x] **[MED-4]** `app/Http/Controllers/ComplaintController.php:227` — `reference_number` and `amount_involved` (financial PII) in public `toArray()`. Fix: add to `$hidden` on Complaint model.
- [x] **[MED-5]** `app/Jobs/ModerateComplaint.php:94–103` — `failed()` handler auto-approves content on moderation job crash. Fix: set `moderation_status = 'pending'` on failure, not `approved`.
- [x] **[MED-6]** `app/Http/Controllers/CompanyController.php:168–170` — Logo filename uses `getClientOriginalExtension()` (client-controlled). Fix: derive extension from validated MIME type map.
- [x] **[MED-7]** Company dashboard endpoint returns 404 to consumers instead of 403 — no role enforcement. Fix: add `role:company_admin` middleware.
- [x] **[MED-8]** `config/cors.php` — `allowed_headers: ['*']` with `supports_credentials: true`. Fix: enumerate required headers explicitly.
- [x] **[MED-9]** `nginx.conf` — No `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `CSP`, `Referrer-Policy`. Fix: add standard security headers.
- [x] **[MED-10]** `app/Http/Controllers/ComplaintController.php:276–278` — `status`, `category`, `moderation_status`, `role` filter params passed to queries without allowlist validation.

---

## LOW

- [x] **[LOW-1]** `app/Http/Controllers/CompanyController.php:81` — Clearbit logo URL built from unvalidated `website` field. Fix: validate `website` with `url` rule in `store()`.
- [x] **[LOW-2]** `app/Http/Controllers/AuthController.php:15–21` — Registration accepts `"role":"company_admin"` in body. Users self-promote without going through claim flow → can abuse AI draft endpoint. Fix: remove `role` from registration, always create as `consumer`.
- [x] **[LOW-3]** `routes/api.php:26` — Register throttle `throttle:10,1` too permissive. Fix: reduce to `throttle:3,1`.
- [x] **[LOW-4]** `app/Http/Controllers/EmailVerificationController.php` — Verification link expiry not enforced (related to CRIT-2). Fix together with CRIT-2.
- [x] **[LOW-5]** `reference_number` in public responses enables consumer impersonation with the company. Fix together with MED-4.
- [x] **[LOW-6]** `routes/api.php:128` — Stripe webhook has no rate limit → HMAC computation flood. Fix: `throttle:60,1`.
- [x] **[LOW-7]** `database/seeders/AdminSeeder.php` — Personal email committed to repo. Fix together with CRIT-1.
- [x] **[LOW-8]** `app/Http/Controllers/ComplaintController.php:227` — Internal `moderation_flags`, `moderation_note`, `moderation_edited` in public response. Fix: add to `$hidden` on Complaint model.
- [x] **[LOW-9]** `nginx.conf` — No `X-Content-Type-Options: nosniff`. Fix together with MED-9.
