# PlantPal — Supabase Setup Guide (Step by Step)

This guide assumes you have never used Supabase before. Follow each step in order.

---

## Step 1: Create Your Supabase Project

1. Open your browser and go to **[https://supabase.com](https://supabase.com)**
2. Click **Start your project** (or **Sign in** if you already have an account)
3. Sign in with GitHub, Google, or email
4. On your dashboard, click **New project**
5. Fill in:
   - **Name:** `PlantPal`
   - **Database Password:** Choose a strong password and **save it somewhere safe** (you rarely need it, but don't lose it)
   - **Region:** Pick the one closest to you (e.g. `West US` if you're in California)
6. Click **Create new project**
7. Wait 1–2 minutes while Supabase sets everything up (you'll see a loading spinner)

---

## Step 2: Get Your API Keys

1. In your PlantPal project, look at the **left sidebar**
2. Click the **gear icon** at the bottom → **Project Settings**
3. Click **API** in the settings menu
4. You need two values from this page:

| What you need | Where to find it | What it looks like |
|---|---|---|
| **Project URL** | Under "Project URL" | `https://abcdefgh.supabase.co` |
| **Anon public key** | Under "Project API keys" → `anon` `public` | A long string starting with `eyJ...` |

5. Click the **copy icon** next to each value

**Important:** Copy the **anon public** key — NOT the `service_role` key. The service role key is secret and must never go in your app.

---

## Step 3: Create Your Environment File

1. Open your PlantPal project folder in Cursor or File Explorer
2. In the **root folder** (same level as `package.json`), create a file named:

   ```
   .env.local
   ```

3. Paste this and replace the placeholders with your copied values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
   OPENAI_API_KEY=
   ```

4. **Save the file**

5. **Restart your dev server** (this is required — env vars only load on startup):
   - In your terminal, press `Ctrl + C` to stop the server
   - Run `npm run dev` again

6. Open the app — the **"Mock Mode"** badge at the bottom-right should **disappear** once Supabase is connected.

---

## Step 4: Run the SQL Schema

This creates your database tables and security rules.

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open this file on your computer:

   ```
   supabase/FIX_RUN_THIS.sql
   ```

   (This single file includes user tables + knowledge engine tables. Safe to run more than once.)

4. Select all the SQL text (`Ctrl + A`) and copy it (`Ctrl + C`)
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press `Ctrl + Enter`)
7. You should see **Success. No rows returned** — that's correct

### What this creates

| Table | Purpose |
|---|---|
| `profiles` | Your name and email |
| `plants` | All your plants (Add Plant wizard) |
| `plant_photos` | Extra photos per plant |
| `care_schedules` | AI care details |
| `health_reports` | Scanner results |
| `plant_species` | Plant database (183+ species when seeded) |
| `soil_types`, `fertilizers`, `pests`, `diseases` | Knowledge engine reference data |
| `plant_care_guides` | Care guides linked to species |

All user tables have **Row Level Security (RLS)** — each user can only see their own data.

---

## Step 5: Enable Email Auth (Recommended Settings)

1. Go to **Authentication** → **Providers** in the left sidebar
2. Make sure **Email** is **enabled** (it is by default)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to: `http://localhost:3000`
5. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - (Later, add your Vercel URL when you deploy)

### Optional: Disable email confirmation for testing

While testing locally, you may want instant sign-ups:

1. Go to **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

> Turn this back **ON** before going live in production.

---

## Step 6: Verify Storage Bucket

The SQL script creates a `plant-photos` storage bucket automatically. To confirm:

1. Click **Storage** in the left sidebar
2. You should see a bucket named **plant-photos**
3. It should be marked **Public**

If it's missing, re-run the SQL from Step 4.

---

## Step 7: Test Everything

Use this checklist after restarting `npm run dev`:

- [ ] **No "Mock Mode" badge** appears (bottom-right of screen)
- [ ] Go to `/login` → **Sign Up** with a real email and password (6+ characters)
- [ ] You land on the **Dashboard** after signing up
- [ ] Click **Add Plant** → fill in the form → submit
- [ ] Your new plant appears on the **Dashboard**
- [ ] **Refresh the page** — plant is still there (saved in Supabase, not localStorage)
- [ ] In Supabase → **Table Editor** → **plants** — you should see your row
- [ ] Click **Log Out** in the sidebar → you're sent to `/login`
- [ ] Sign in again → your plants are still there
- [ ] **Privacy test:** Create a second account in an incognito window — it should NOT see the first account's plants

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Still see "Mock Mode" badge | Check `.env.local` exists, values are correct, restart `npm run dev` |
| "Invalid API key" on login | Re-copy the **anon public** key from Supabase → Settings → API |
| Can't sign up | Disable "Confirm email" in Auth settings (see Step 5) |
| Plants don't save | Run the SQL schema again; check browser console for errors |
| Photo upload fails | Confirm `plant-photos` bucket exists in Storage |
| Redirect loop on login | Set Site URL to `http://localhost:3000` in Auth → URL Configuration |

---

## Where Code Lives (for reference)

| File | Purpose |
|---|---|
| `.env.local` | Your secret keys (never commit to Git) |
| `src/lib/supabase/client.ts` | Browser Supabase connection |
| `src/lib/supabase/server.ts` | Server Supabase connection |
| `src/lib/supabase/config.ts` | Detects mock vs live mode |
| `src/lib/supabase/mappers.ts` | Converts DB rows ↔ app format |
| `src/lib/store/auth-provider.tsx` | Login session handling |
| `src/lib/store/plants-provider.tsx` | Loads/saves plants from Supabase |
| `src/middleware.ts` | Protects pages when Supabase is connected |

---

## Deploying to Vercel (later)

1. Push your code to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add the same 3 environment variables in Vercel → Settings → Environment Variables
4. In Supabase → Auth → URL Configuration, add your Vercel URL to **Redirect URLs**
5. Set **Site URL** to your production domain

---

You're done when you can sign up, add a plant, refresh, and still see it. That's real cloud storage working.
