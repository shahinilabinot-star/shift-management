Environment variables and secrets (README_ENV.md)

1) Overview
- This project uses Vite. Client-side environment variables must start with `VITE_` to be exposed to the browser.
- Do NOT commit sensitive keys (service role keys, DB passwords). Use `.env.local` or configure secrets in your hosting provider / CI.

2) Local setup
- Copy `.env.example` to `.env.local` (or `.env`) at the repository root.
- Fill in your Supabase values:
  - `VITE_SUPABASE_URL` - your Supabase project URL (starts with https://)
  - `VITE_SUPABASE_ANON_KEY` - your project's anon/public key (safe for client use)
  - `SUPABASE_SERVICE_ROLE_KEY` - server-side service role key (secret)

3) Running locally with Vite
- Start dev server (from project root):

  # PowerShell
  pnpm install; pnpm dev

- Vite will load `.env` and `.env.local` variables automatically.

4) Security notes
- Never put `SUPABASE_SERVICE_ROLE_KEY` or DB admin credentials in files committed to Git.
- Use platform secret stores for production (Supabase dashboard, Vercel/Netlify/GitHub Actions secrets, etc.).

5) Troubleshooting
- If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing the app will warn in console and fallback code paths may fail.
- If you need to provision a fresh database, run `sql/provision_all.sql` in Supabase SQL editor as the project owner.

6) Extras
- If you're migrating to Supabase Auth, prefer using email sign-up/sign-in and create a `profiles` row for each user. The current app includes a legacy `users` fallback; you can remove it after migration.
