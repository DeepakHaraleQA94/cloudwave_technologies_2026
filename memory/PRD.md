# CloudWave Technologies — IT Training Institute Website

## Original Problem Statement
Full-stack, modern, responsive IT training institute website for "CloudWave Technologies Pvt Ltd" with secure backend, database, and admin dashboard. Services: Web/Android/iOS/Windows app development training. Requested Supabase; user skipped stack question so built on platform-standard React + FastAPI + MongoDB with equivalent functionality (real DB, JWT admin auth, file uploads, full CRUD, RLS-equivalent server-side auth gating).

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion + recharts. Contexts: AuthContext (JWT in localStorage `cw_token`), SiteContext (settings + active theme + time-based dark mode).
- **Backend**: FastAPI + Motor (MongoDB). JWT Bearer auth (bcrypt). Generic CRUD factory at `/api/admin/data/{resource}`. Images stored base64 in `media_files`, served at `/api/media/{id}`.
- **DB collections**: users, website_settings, courses, batches, trainers, testimonials, faqs, blog_posts, gallery, videos, events, placements, themes, enquiries, contact_messages, media_files.

## Admin Credentials
- admin@cloudwavetechnologies.com / Admin@1234
- haraledeepak6@gmail.com / Admin@1234 (owner)

## Implemented (Jun 2026)
- Public: Home (hero, stats, services, courses, why-us bento, batches, placements, testimonials, trainers, videos, FAQ, blog, CTA), About, Courses+search/filter, dynamic Course Detail (syllabus accordion, batches, reviews, course-attached enquiry), Trainers, Batches, Placements (filters), Reviews, FAQ, Blog+Detail+related, Contact (form+map), Enquiry (validation, enquiry ID), Gallery (lightbox), Videos (YouTube), Events, Privacy, Terms.
- Global: glassmorphic navbar + mobile hamburger, footer, floating WhatsApp, Call button, dismissible festival/admission theme banner, SEO meta per page, robots.txt.
- Admin: JWT login/forgot-password, protected routes, sidebar dashboard, stats + 4 charts, Enquiry management (search/filter/pagination/view/status/notes/follow-up/delete/CSV export), generic CRUD for courses/batches/trainers/testimonials/faqs/blog/gallery/videos/events/placements/themes with image upload + publish toggles, Contact messages, Website Settings (tabbed), Users/Admins.
- Dynamic theme system: time-based dark mode, festival/seasonal/admission themes with priority + date scheduling, accent color injection, banner (homepage + dashboard greeting).

## Student Portal — Phase 1 core (Jun 2026)
- Separate Student auth (JWT role='student', token key cw_stoken): POST /api/student/login (Student ID or email + password); students log in regardless of payment status. Admin sets/resets password (Learning Access or POST /api/admin/students/{sid}/set-password). Seeded test student CW-2026-0001 / Student@1234.
- Student Dashboard (/student/dashboard) tabs: Overview (fee total/paid/remaining + payment status, access counts, progress %, final-test & certificate locked/unlocked), Profile (editable; ID/email locked), Course & Batch, Fees, My Learning, Documents, Certificates, Activity. Responsive.
- Learning Resources collection + Admin "Learning Studio" (/admin/r/learning_resources via generic CRUD; 15 resource types; content_url/external_url — no large base64 video). Entitlements collection (GRANTED/REVOKED, start/expiry) with unique (student,resource) index.
- Admin "Learning Access" (/admin/learning-access): search student, per-resource Grant/Revoke, Grant All, start/expiry dates, set login password. Bulk endpoint accepts multiple students (single-student UI).
- SECURITY (backend-enforced, verified): locked resource content -> 403; no token -> 401; admin token on student endpoint -> 403; private documents -> /api/media 403 + owner-only access; identity always derived from token, never frontend. Locked resources stay VISIBLE but disabled with "Please complete payment for access".
- Activity logging (login, profile update, resource open/complete, document upload, access granted/revoked). Course progress from completed granted resources.
- Public header "Student Login" button (desktop + mobile) -> /student/login.
- Tested: iteration_4.json — backend 17/17 (security matrix), frontend 100% (all tabs + admin grant/revoke reflection).

### Student Portal — DEFERRED (P1, not yet built)
- Final Quiz engine (questions/options/scoring/passing %/attempts/time limit) — currently a "Quiz" is just a lockable resource type.
- Automatic Course Completion Certificate generation + PDF (A4 landscape) on quiz pass; Internship Certificate template + admin certificate-type selector with auto-populate + unique CWT-CERT / CWT-INT IDs.
- Admin dashboard stat cards (paid/partial/unpaid/active access/expired/resources/certs), resource filters, bulk multi-student grant UI.
- Note: existing /verify certificate page + certificates collection reused; My Certificates reads certificates by student_id.

## Technologies We Teach (Jun 2026)
- New dynamic homepage section (added after the "End-to-End Software Development Training" services section; existing sections untouched). Component: components/site/TechShowcase.jsx (public) + admin/Technologies.jsx (manager).
- Admin (/admin/technologies): Add/Edit/Deactivate/Reorder technologies; SVG icon support (inline `svg_icon` or `icon_url`, with colored-monogram fallback); assign each tech to a Daily Theme (everyday or a weekday); accent color; description.
- Card Presentation (global, stored in website_settings tech_* keys): Animation Style (Static, Fade, Slow Blink, Slide, Zoom, Rotate, 3D Flip, Tilt, Float, Bounce, Pulse, Glow, Shimmer, Carousel), Speed, Direction, Delay, Loop, Hover Effect; Live Preview + Save. CSS in App.css; respects prefers-reduced-motion.
- Public GET /api/technologies returns active techs filtered by current server weekday (everyday + today; falls back to all active) + presentation. Weekday names are NEVER shown to visitors. Backend: RESOURCES["technologies"], seed of 11 techs.
- Tested: iteration_3.json — 100% backend (15/15) + 100% frontend (CRUD/reorder/toggle/delete/preview/save, public render, responsive). AWS/Windows use monogram (no simpleicons logo exists).

## Payments (CloudPay — provider-agnostic)
- Credentials fully configurable from Admin Panel (/admin/payments): Base URL, API Key, API Secret, Mode (sandbox/live), Active toggle, Priority. Secrets stored server-side in `payment_providers` collection and NEVER returned to browser (masked as `••••1234`; `update_provider` ignores masked/blank values on round-trip).
- Built-in Sandbox/mock flow: when mode != live OR credentials incomplete, `create-order` returns a hosted mock checkout at `/payment/checkout?ref=<order_ref>` (PaymentCheckout.jsx). `verify` simulates success/fail. Live mode calls the real CloudPay REST API. No permanent "contact institute" dead-end.
- Flow: Course → Buy Now (BuyCourse.jsx) → create-order → CloudPay checkout → verify → auto-enroll student + batch. Endpoints: POST /api/payment/create-order, GET /api/payment/order/{ref}, POST /api/payment/verify, POST /api/payment/webhook/{provider}, GET/PUT /api/admin/payment-providers.
- Twilio/WhatsApp alerts: user explicitly declined — NOT implemented.

## Batch financials
- Inline expense CRUD inside Batch dialog (ResourceManager.jsx) via /api/admin/data/expenses; feeds /api/admin/batches/{id}/financials.
- Student exact offline paid amount (`paid_amount`) captured in Students.jsx; offline collection = sum of exact paid_amount for Paid offline students; net_profit = total_collection - expenses_total.

## Testing
- Backend: 39/39 (core) + 10/10 (payments/expenses/financials) pytest passed. Frontend: all critical CloudPay + expenses + paid_amount flows passed (iteration_2.json, Jun 2026).

## Branding & Slider (Jun 2026, frontend-only)
- Homepage hero slider (HomeSlider.jsx) now shows TWO slides side-by-side on desktop (md+) and ONE on mobile; same slide data/admin upload, autoplay, arrows and indicators preserved; translateX carousel inside overflow-hidden (no page scroll, verified 390px).
- Admin-controlled logo DISPLAY size (`logo_scale`), optional logo effect (`logo_effect`: normal/3d/rotation) with `logo_effect_enabled` toggle — applied to Navbar + Footer logos via CSS (.logo-effect-3d / .logo-effect-rotate in App.css, respects prefers-reduced-motion). Uploaded logo file untouched.
- Website/Application name (`institute_name`) already configurable and reflects in header, footer and browser tab (white-label ready).
- New admin Settings → "Branding" tab (Settings.jsx) with name input, size slider, effect select, enable switch and a Live Preview. All persist via existing PUT /api/admin/settings (no new endpoints; backend unchanged).

## Backlog / Future (P2)
- CloudPay Go-Live: admin enters real credentials + switches Mode=Live (architecture ready & tested).
- Encrypt payment secrets at rest (currently plaintext in Mongo); atomic order_ref/enquiry-id counters.
- Split server.py (~1520 lines) into routers (payments/batches/auth/seed).
- Full theme "Preview" tool & seasonal auto-decorations; multi-image event albums; explicit CORS origins for production.
