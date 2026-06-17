# Cold Rock — Website

The official website for **Cold Rock**, a strategic advisory firm.
Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com),
deployed to [Vercel](https://vercel.com) via GitHub. Production domain: **coldrock.co**.

---

## Tech stack

- **Astro 5** — static site, fast by default, easy to extend
- **Tailwind CSS 4** — utility styling, wired in via the `@tailwindcss/vite` plugin
- **System font stack** — no web fonts yet (see brand notes below)
- Zero client-side JS framework — pages are plain `.astro`

## Requirements

- **Node.js 18.20.8+ / 20.3.0+ / 22+** (Astro 5 requirement)
- npm (or pnpm/yarn — examples below use npm)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:4321)
npm run dev

# 3. Build for production (outputs to ./dist)
npm run build

# 4. Preview the production build locally
npm run preview
```

## Project structure

```
coldrock-site/
├── public/
│   └── favicon.svg            # [PLACEHOLDER] temporary "CR" mark
├── src/
│   ├── components/
│   │   ├── CTAButton.astro     # primary/secondary call-to-action link
│   │   ├── Footer.astro        # site footer
│   │   ├── Header.astro        # sticky nav (desktop + mobile)
│   │   ├── Hero.astro          # page-topping headline block
│   │   ├── Section.astro       # max-width + spacing wrapper
│   │   └── ServiceCard.astro   # single advisory offering tile
│   ├── layouts/
│   │   └── BaseLayout.astro     # <head> + Header + Footer shell
│   ├── pages/
│   │   ├── index.astro          # Home
│   │   ├── about.astro          # About
│   │   ├── services.astro       # Services
│   │   ├── work.astro           # Work / case studies
│   │   └── contact.astro        # Contact + form placeholder
│   └── styles/
│       └── global.css           # Tailwind import + ALL design tokens
├── astro.config.mjs
├── tailwind (config lives in global.css via Tailwind v4 @theme)
├── tsconfig.json
├── vercel.json
├── .gitignore
└── package.json
```

## ⚠️ Pending brand decisions

This scaffold is intentionally neutral. Branding is **not finalized**, so:

- **Colors** — a neutral slate palette is used as a placeholder. All color
  tokens live in **`src/styles/global.css`** under the `@theme` block (the
  `--color-ink-*` and `--color-accent*` variables). Change them there and the
  whole site updates — no need to touch component files.
- **Typography** — using a system font stack via `--font-sans` in the same
  `@theme` block. Swap in the brand typeface there.
- **Logo** — a text wordmark ("Cold Rock") stands in for the logo in
  `Header.astro` and `Footer.astro`. The favicon is a placeholder "CR" mark
  in `public/favicon.svg`.
- **Copy** — placeholder text is tagged with `[PLACEHOLDER]` throughout.
- **Code TODOs** — search the project for `TODO[BRAND]` and `TODO[INTEGRATION]`
  to find every spot a brand or wiring decision is needed:

  ```bash
  grep -rn "TODO\[" src public
  grep -rn "\[PLACEHOLDER\]" src
  ```

### Not yet included (by design)
- Final logo / brand assets
- Final copy
- CMS integration
- Analytics
- A working contact form backend (the form in `contact.astro` is an inert
  placeholder — see `TODO[INTEGRATION]` there)

---

## Deployment — connect to Vercel via GitHub

1. **Push this project to GitHub** (see the next section for the exact commands).
2. Go to [vercel.com/new](https://vercel.com/new) and **import** the GitHub repo.
3. Vercel auto-detects Astro. Confirm the settings (already encoded in
   `vercel.json`):
   - **Framework Preset:** Astro
   - **Build Command:** `astro build`
   - **Output Directory:** `dist`
4. Click **Deploy**. You'll get a `*.vercel.app` URL to verify the build.

Every push to your default branch will redeploy automatically; pull requests
get preview deployments.

## Point the coldrock.co domain (GoDaddy → Vercel)

1. In Vercel: open the project → **Settings → Domains** → add `coldrock.co`
   (add `www.coldrock.co` too if you want it). Vercel will show you the exact
   DNS records to set.
2. In GoDaddy: **My Products → DNS** for coldrock.co, then add the records
   Vercel gave you. Typically:
   - **Apex / root (`coldrock.co`)** → an **A record** `@` pointing to
     `76.76.21.21`, **or** Vercel may ask you to use a `CNAME`/ALIAS — always
     use the exact values shown in the Vercel dashboard.
   - **`www`** → a **CNAME** record pointing to `cname.vercel-dns.com`.
3. Remove any conflicting old `A`/`CNAME` records for `@` or `www` (e.g.
   GoDaddy parking/forwarding) so they don't override the new ones.
4. Back in Vercel, the domain status flips to **Valid** once DNS propagates
   (minutes to a few hours). Vercel provisions the SSL certificate
   automatically.
5. Optionally set your preferred redirect (e.g. `www` → apex or vice versa)
   in Vercel's Domains settings.

> Tip: keep `site: "https://coldrock.co"` in `astro.config.mjs` in sync with
> the canonical domain you choose.

---

## Contact form → email + Notion

The contact form (`/contact`) posts to a serverless endpoint
(`src/pages/api/contact.ts`) that does two things on every submission:

1. **Emails the inquiry** to your inbox (`van@coldrock.co`) via
   [Resend](https://resend.com), with the sender's address as reply-to.
2. **Records it in a Notion database** for tracking.

The rest of the site stays fully static — only this one route runs on
demand (it's marked `prerender = false`), enabled by the `@astrojs/vercel`
adapter.

> The form is resilient: if Notion is misconfigured it still emails you;
> only an email failure is surfaced to the visitor (asking them to email
> directly). There's also a hidden honeypot field for basic spam defense.

### 1. Environment variables

Copy `.env.example` → `.env` and fill it in for local dev. Add the **same
keys** in Vercel → Project → Settings → Environment Variables for
production.

| Variable | What it is |
| --- | --- |
| `RESEND_API_KEY` | API key from resend.com |
| `CONTACT_TO_EMAIL` | Inbox that receives submissions — `van@coldrock.co` |
| `CONTACT_FROM_EMAIL` | Verified sender, e.g. `Cold Rock Website <forms@coldrock.co>` |
| `NOTION_TOKEN` | Internal integration secret from notion.so/my-integrations |
| `NOTION_DATABASE_ID` | The 32-char ID of your requests database |

### 2. Resend (email) setup

1. Sign up at [resend.com](https://resend.com).
2. **Domains → Add Domain → `coldrock.co`**, then add the DNS records it
   shows you in **GoDaddy**. (You can reuse the same GoDaddy DNS panel
   you'll use for the Vercel domain.) Wait for it to verify.
3. **API Keys → Create**, and put the key in `RESEND_API_KEY`.
4. Set `CONTACT_FROM_EMAIL` to an address on the verified domain (e.g.
   `forms@coldrock.co`). It does **not** need its own mailbox — it's only
   a send-from identity. Replies go to the visitor (reply-to is set) and
   submissions land in `CONTACT_TO_EMAIL`.

### 3. Notion (tracking) setup

1. Create an internal integration at
   [notion.so/my-integrations](https://www.notion.so/my-integrations) and
   copy the secret into `NOTION_TOKEN`.
2. Create a database (a full-page table) named e.g. **"Website Requests"**
   with these **exact** properties:

   | Property | Type |
   | --- | --- |
   | `Name` | Title |
   | `Email` | Email |
   | `Message` | Text |
   | `Status` | Select (add a `New` option) |
   | `Source` | Text |
   | `Submitted` | Date |

3. Open the database → **•••  → Connections → Connect to** your
   integration (this grants it write access — easy to forget!).
4. Copy the database ID from its URL — the 32-character string between the
   workspace slug and the `?v=` — into `NOTION_DATABASE_ID`.

> **Already provisioned:** the **Website Requests** database has been created
> under your **🪨 Cold Rock Hub** page, with the schema above plus an **Area**
> relation. Its ID is `8630a0c2-1270-4a0f-88e6-cd1e92281e30` (pre-filled in
> `.env.example`). You still need steps 1 and 3 — create the integration and
> connect it to the database.
>
> **Area link:** each submission is linked to your "Cold Rock" Area record so
> it appears in your hub's Area-filtered views. For that link to write, also
> **connect the integration to your Areas database** (same •••  → Connections
> step). If you skip it, requests are still saved — just without the Area
> link (the endpoint falls back automatically).

> Property **names and types must match** the table above, or Notion will
> reject the write. If you rename a property, update it in
> `src/pages/api/contact.ts` too.

### 4. Test it

Locally (`npm run dev`) with `.env` filled in, submit the form at
`http://localhost:4321/contact`. You should get an email and a new row in
Notion. Server-side errors are logged to the terminal (and to Vercel's
function logs in production).
