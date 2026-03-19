# Sri Vinayaga Ayurvibe — Website

Public marketing site for **Sri Vinayaga Ayurvibe**, an Ayurveda hospital in Perumbakkam, Chennai (Nookampalayam). Built as a single-page application with Vite and React.

## Stack

- **Vite** — build tooling  
- **React 18** + **TypeScript**  
- **React Router** — client-side routing  
- **Tailwind CSS** + **shadcn/ui** (Radix)  
- **TanStack Query** — data fetching  
- **Firebase Hosting** — deployment (optional)

## Prerequisites

- Node.js 18+ and npm

## Setup

```sh
cd ayurvibe_website
npm install
```

## Environment

Create a `.env` or `.env.local` as needed for local development:

| Variable        | Purpose                          |
|----------------|-----------------------------------|
| `VITE_API_URL` | Backend API base URL (admin/auth) |

## Scripts

| Command        | Description                                      |
|----------------|--------------------------------------------------|
| `npm run dev`  | Dev server (default port in `vite.config.ts`)   |
| `npm run build`| Generate sitemaps, then production build       |
| `npm run sitemap` | Regenerate `public/sitemap*.xml` only        |
| `npm run preview` | Serve production build locally              |
| `npm run lint` | ESLint                                           |
| `npm run deploy` | Build + Firebase deploy (if configured)     |

Sitemaps are generated in `prebuild` from `scripts/generate-sitemap.mjs` using `SITE_URL` (default `https://svayurvibe.com`).

## Project layout

- `src/pages/` — route-level pages (home, blog, sections, admin)  
- `src/components/` — shared UI including `SEO` helpers  
- `public/` — static assets, `robots.txt`, generated sitemaps  
- `scripts/generate-sitemap.mjs` — sitemap generation  

## Admin

Staff sign-in lives under `/admin`. Those routes are excluded from search indexing via `robots.txt`; no public SEO metadata is added for the admin UI.

## License

Private — not for public redistribution unless the owner specifies otherwise.
