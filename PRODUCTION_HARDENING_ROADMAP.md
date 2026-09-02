
# 🛡️ HomeVerse Production Hardening & Post-Completion Roadmap

This document serves as the comprehensive **Post-Completion Production & Hardening Checklist** for HomeVerse. It captures the essential security, architectural, performance, reliability, business, and legal requirements needed to transition the completed product from an advanced functional demo into an enterprise-grade commercial SaaS platform.

---

## 🚦 Priority Overview Matrix

| Priority | Category | Key Focus | Target Stage |
| :--- | :--- | :--- | :--- |
| **P0 — Blockers** | Security & Auth | Password hashing, JWT httpOnly cookies, rate limiting, prompt sanitization | Pre-Launch |
| **P0 — Blockers** | Business & Legal | Privacy policy (home scans), ToS, AI quota/usage cost caps | Pre-Launch |
| **P1 — High** | Infrastructure | Postgres migration, Alembic migrations, S3/R2 Cloud storage | Early Production |
| **P1 — High** | Reliability | Celery/Redis queue for AI rendering, WebGL error boundaries | Early Production |
| **P2 — Medium** | Performance | 3D instancing, LOD, dynamic imports, Redis catalog cache | Scale & Optimize |
| **P2 — Medium** | UX & Mobile | Mobile read-only / touch viewer, onboarding tour, backend autosave | Scale & Optimize |
| **P3 — Growth** | CI/CD & SEO | Pytest suite, GitHub Actions, OpenGraph meta previews, Stripe billing | Commercial Scale |

---

## 🔒 1. Security & Authentication (P0 — Launch Blockers)

- [ ] **Bcrypt / Argon2 Password Hashing**:
  - Audit `app/api/auth.py` and enforce `passlib[bcrypt]` or `argon2-cffi` with salt rounds $\ge 12$.
  - Ensure zero plaintext or legacy MD5/SHA256 password persistence.
- [ ] **Hardened JWT & Session Architecture**:
  - Replace `localStorage` token storage with short-lived JWT Access Tokens ($\le 15\text{ min}$) + Refresh Tokens stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies.
  - Implement token rotation and invalidation blacklists on logout.
- [ ] **Strict Rate Limiting on AI Endpoints**:
  - Implement SlowAPI / Redis token-bucket rate limiter on `/api/ai/` routes (e.g. max 5 room analyses / hour per IP for unauthenticated users, 30 / hour for Pro tier).
  - Prevent cost inflation and denial-of-wallet attacks from automated scrapers.
- [ ] **Input Sanitization & Prompt Injection Protection**:
  - Enforce Pydantic v2 schemas on all incoming payloads.
  - Sanitize user strings fed into the Gemini Copilot prompt template to prevent instruction overriding / scene graph corruption.
- [ ] **CORS Lockdown**:
  - Configure `app/config.py` to accept only explicit production origins (e.g., `https://homeverse.ai`, `https://app.homeverse.ai`) in non-debug environments.
  - Disallow wildcard `allow_origins=["*"]` on production builds.
- [ ] **MIME-Type & Magic Byte Upload Validation**:
  - Validate file signatures server-side via `python-magic` / `filetype` rather than trusting client file extensions.
  - Enforce maximum upload thresholds ($15\text{MB}$ for images, $100\text{MB}$ for 4K video walkthroughs).
- [ ] **Production Secrets Management**:
  - Isolate API keys (`GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET`) in AWS Secrets Manager, Doppler, or encrypted environment variables.
  - Verify zero sensitive tokens exist in version control history.

---

## 🏗️ 2. Infrastructure, Database & Cloud Media (P1)

- [ ] **Managed PostgreSQL Migration**:
  - Migrate local `homeverse.db` (SQLite) to managed PostgreSQL (AWS RDS / Supabase / Neon).
  - Add connection pooling via PgBouncer or SQLAlchemy connection pool recycling.
- [ ] **Alembic Database Migration Pipeline**:
  - Initialize Alembic (`alembic init alembic`) to manage versioned database schema upgrades and rollbacks automatically.
- [ ] **Cloud Object Storage (S3 / Cloudflare R2)**:
  - Transition local file storage in `static/uploads/` to AWS S3 or Cloudflare R2 with CloudFront CDN distribution.
  - Generate pre-signed PUT URLs for direct client-to-bucket uploads.
- [ ] **Asynchronous Task Queue (Celery / RQ + Redis)**:
  - Offload heavy tasks (6-style diffusion rendering, room video decomposition) to Celery workers backed by Redis.
  - Enable retry mechanisms with exponential backoff on third-party AI rate limits.
  - Broadcast real-time task progress percentages via SSE or WebSocket channels.
- [ ] **Multi-Environment Configuration**:
  - Establish `.env.development`, `.env.staging`, and `.env.production` profiles.

---

## 🛡️ 3. Reliability, Resilience & Error Handling (P1)

- [ ] **Graceful AI Degradation & Partial-Success States**:
  - If 1 out of 6 style generations times out, render the successful 5 and show a non-blocking `"Retry style"` button.
  - Display user-friendly error fallbacks with helpful diagnostic advice.
- [ ] **Skeleton & Shimmer Loading States**:
  - Implement pulse skeleton screens across the Studio 3D viewport, 2D Blueprint, and Marketplace item cards during asset loading.
- [ ] **React Error Boundaries for WebGL Canvas**:
  - Wrap React Three Fiber (`<Canvas>`) in an Error Boundary component so context-loss or shader compilation errors gracefully fallback to a 2D floorplan view rather than crashing the page.
- [ ] **APM, Logging & Crash Monitoring**:
  - Integrate Sentry on both frontend Next.js and backend FastAPI for automated exception tracing.
  - Configure uptime and latency alerts for Gemini and Pollinations endpoints via Better Stack / UptimeRobot.

---

## ⚡ 4. Performance & 3D Optimization (P2)

- [ ] **Instanced Meshes & Geometry Batching**:
  - Batch repeated furniture objects (e.g. dining chairs, spotlights, wall studs) using Three.js `InstancedMesh` to minimize draw calls ($\le 50\text{ draw calls}$ per room).
- [ ] **Level of Detail (LOD) & Texture Compression**:
  - Generate LOD models for first-person Walkthrough mode.
  - Convert `.glb` models to Draco/Meshopt compression and convert textures to KTX2 / WebP.
- [ ] **Dynamic Code Splitting**:
  - Dynamically import heavy modules (`CanvasContainer`, `BlueprintEditor2D`, `VRPanoramaModal`) using Next.js `dynamic()` with SSR disabled.
- [ ] **Redis Caching Layer**:
  - Cache furniture catalog search queries and frequent LLM scene layout embeddings in Redis.

---

## 🎯 5. UX Polish, Mobile & Accessibility (P2)

- [ ] **Mobile & Tablet Responsive Strategy**:
  - Provide a touch-optimized **3D Orbit Viewer / Walkthrough mode** on mobile devices while showing a clear desktop recommendation for full CAD coordinate editing.
- [ ] **Interactive Onboarding Tour**:
  - Add an optional 4-step spotlight tour (e.g., via Driver.js) guiding first-time users on selecting objects, opening the AI Copilot, and switching 2D/3D views.
- [ ] **Accessibility & Keyboard Navigation**:
  - Add ARIA landmarks, visible focus rings, and screen-reader labels for all studio controls and modal dialogs.
- [ ] **Periodic Backend Autosave**:
  - Sync unsaved workspace state to the database `/api/designs/{id}` every 30 seconds to prevent loss on browser tab closures.

---

## 💼 6. Business, Billing & Legal Compliance (P0 / P1)

- [ ] **Terms of Service & Privacy Policy**:
  - Publish clear privacy clauses detailing how uploaded interior room photos and floorplans are processed and retained.
  - Specify third-party AI sub-processor data disclosures (Google Gemini, Pollinations).
- [ ] **Vendor & Affiliate Program Integration**:
  - Register official affiliate tracking IDs for IKEA, Urban Ladder, and Pepperfry product referral links.
- [ ] **AI Usage Quotas & Tier Enforcement**:
  - Restrict free users to 5 room redesigns / month; require Pro Designer plan for unlimited HD renders and Blender exports.
- [ ] **Stripe / LemonSqueezy Billing Engine**:
  - Integrate subscription checkout sessions and webhook listeners (`checkout.session.completed`, `customer.subscription.deleted`).

---

## 🧪 7. Testing, CI/CD & DevOps (P3)

- [ ] **Automated Backend Test Suite**:
  - Write `pytest` test suites covering:
    * Auth registration, login, and token expiry.
    * Project CRUD and design variations.
    * Scene graph coordinate validation.
    * AI service fallbacks and prompt parsers.
- [ ] **Frontend Component & Integration Tests**:
  - Implement Vitest / Playwright smoke tests for the 3D Studio canvas mounting, Copilot action triggers, and Export modal downloads.
- [ ] **GitHub Actions CI/CD Pipeline**:
  - Automated workflow running `npm run lint`, `tsc --noEmit`, and `pytest` on every pull request.
- [ ] **Staging Deployment Environment**:
  - Configure preview deployments (Vercel for frontend, Railway / Render / AWS ECS for backend).

---

## 🌐 8. SEO, Social Graph & Discoverability (P3)

- [ ] **Dynamic OpenGraph Previews**:
  - Generate dynamic social share cards (`og:image`) featuring user room renders when sharing project links.
- [ ] **Sitemap & Structured Schema**:
  - Add `sitemap.xml`, `robots.txt`, and `SoftwareApplication` JSON-LD schema markup on the marketing landing page.

---

*This document is persisted in the HomeVerse repository root as `PRODUCTION_HARDENING_ROADMAP.md`.*
