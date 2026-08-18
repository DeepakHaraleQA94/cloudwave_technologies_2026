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

## Testing
- Backend: 39/39 pytest passed. Frontend: all critical flows passed (iteration_1.json).

## Backlog / Future (P2)
- Full theme "Preview" tool & seasonal auto-decorations (snow/diyas) — banner + accent shifting done.
- Multi-image album uploads for events; Instagram embed cards.
- Atomic enquiry-id counter; per-resource server validation; explicit CORS origins for production.
