# PlantPal

**MyFitnessPal for plants and trees.** Track every plant you own and receive personalized care recommendations based on plant type, location, climate, and health status.

## Features

- **Authentication** — Sign up, log in, and log out via Supabase Auth
- **Dashboard** — Overview of total plants, plants needing attention, upcoming watering & fertilizing
- **My Garden** — Browse all your plants with beautiful cards
- **Add Plant** — Full plant profile with photo upload, location, and sun exposure
- **AI Care Schedules** — OpenAI generates personalized watering, fertilizing, and pruning plans
- **Plant Detail** — Overview, care schedule, and mark-as-watered tracking
- **AI Plant Coach** — Chat with an AI assistant about your specific plant
- **Health Scanner** — Upload a photo for AI vision analysis of plant health issues
- **Settings** — Manage your profile

## Tech Stack

- [Next.js 15+](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Auth, Database, Storage)
- [OpenAI API](https://openai.com/) (GPT-4o, GPT-4o-mini)
- [Vercel](https://vercel.com/) (Deployment)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- An [OpenAI API key](https://platform.openai.com/)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd plantpal
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Go to **Settings → API** and copy your project URL and anon key

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `OPENAI_API_KEY` | OpenAI API key |

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Folder Structure

```
plantpal/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Authenticated app routes
│   │   │   ├── dashboard/          # Dashboard / My Garden overview
│   │   │   ├── garden/             # Full plant collection
│   │   │   ├── plants/
│   │   │   │   ├── add/            # Add plant form
│   │   │   │   └── [id]/           # Plant detail + AI coach
│   │   │   ├── scanner/            # Health scanner
│   │   │   ├── settings/           # User settings
│   │   │   └── layout.tsx          # App shell with sidebar
│   │   ├── api/
│   │   │   ├── care-schedule/      # AI care schedule generation
│   │   │   ├── chat/               # AI plant coach
│   │   │   ├── health-scan/        # AI vision health analysis
│   │   │   └── plants/             # Plant list API
│   │   ├── login/                  # Login page
│   │   ├── signup/                 # Sign up page
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Button, Input, Select, Card
│   │   ├── sidebar.tsx
│   │   ├── plant-card.tsx
│   │   ├── stats-card.tsx
│   │   ├── chat-interface.tsx
│   │   └── health-scanner.tsx
│   ├── lib/
│   │   ├── supabase/               # Client, server, middleware
│   │   ├── openai.ts               # OpenAI integrations
│   │   ├── types.ts
│   │   └── utils.ts
│   └── middleware.ts               # Auth route protection
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local.example
├── next.config.ts
└── package.json
```

## Database Schema

### `profiles`
Extends Supabase auth users with profile data.

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | References auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| avatar_url | TEXT | Profile photo |
| created_at | TIMESTAMPTZ | Created timestamp |
| updated_at | TIMESTAMPTZ | Updated timestamp |

### `plants`
Core plant records owned by users.

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Plant ID |
| user_id | UUID (FK) | Owner |
| name | TEXT | Plant name |
| species | TEXT | Species name |
| location_type | TEXT | `indoor` or `outdoor` |
| planting_type | TEXT | `pot` or `ground` |
| zip_code | TEXT | Location zip code |
| sun_exposure | TEXT | `full_sun`, `partial_sun`, `shade` |
| photo_url | TEXT | Primary photo URL |
| needs_attention | BOOLEAN | Health flag |
| last_watered_at | TIMESTAMPTZ | Last watering date |
| last_fertilized_at | TIMESTAMPTZ | Last fertilizing date |

### `plant_photos`
Additional photos for each plant.

### `care_schedules`
AI-generated care plans (one per plant).

| Column | Type | Description |
|---|---|---|
| watering_frequency_days | INTEGER | Days between watering |
| watering_instructions | TEXT | Watering guidance |
| fertilizing_frequency_weeks | INTEGER | Weeks between fertilizing |
| fertilizing_instructions | TEXT | Fertilizing guidance |
| pruning_frequency | TEXT | When to prune |
| pruning_instructions | TEXT | Pruning guidance |
| ai_generated_data | JSONB | Raw AI response |

### `plant_health_reports`
Results from AI health scans.

| Column | Type | Description |
|---|---|---|
| issues | JSONB | Array of detected issues with likelihood and actions |
| overall_health | TEXT | Summary assessment |
| photo_url | TEXT | Scanned photo |

### `chat_history`
AI Plant Coach conversation history.

| Column | Type | Description |
|---|---|---|
| plant_id | UUID (FK) | Associated plant |
| role | TEXT | `user` or `assistant` |
| content | TEXT | Message content |

All tables have Row Level Security (RLS) enabled — users can only access their own data.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-...
```

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
4. Deploy

Vercel will auto-detect Next.js and configure the build. No additional config needed.

### Supabase Production Checklist

- [ ] Run migration SQL in production Supabase project
- [ ] Verify storage bucket `plant-photos` exists and is public
- [ ] Add your Vercel domain to Supabase Auth redirect URLs (Settings → Auth → URL Configuration)
- [ ] Set Site URL to your production domain

## License

MIT
