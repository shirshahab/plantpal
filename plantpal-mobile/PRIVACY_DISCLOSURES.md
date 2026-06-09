# PlantPal — Privacy Disclosures

Use for App Store Privacy Nutrition Labels, Google Play Data safety, and your public privacy policy at https://getplantpal.com/privacy.

## Data collected

| Data | Purpose |
|------|---------|
| **Email address** | Account creation and sign-in (Supabase Auth) |
| **Plant photos** | Garden tracking; sent to AI services for identification and diagnosis |
| **Plant names & species** | Core app functionality and care plans |
| **ZIP code** | Local climate and care recommendations |
| **Care logs & tasks** | Watering history and daily reminders |
| **App usage & feedback** | Beta improvement (`beta_feedback` table) |
| **AI scan requests** | Plant identification and health analysis |

## How data is used

- **Account management** — authentication, sync across devices
- **Plant identification** — camera images analyzed via server API
- **Care recommendations** — AI-generated plans based on plant + location
- **Reminders** — push notifications (when enabled)
- **App improvement** — anonymous or identified feedback during beta

## Data NOT stored in the mobile app

Secret API keys for OpenAI, Pl@ntNet, OpenWeather, Perenual, and SerpAPI are stored **only on the PlantPal server** (Vercel). The mobile app calls `https://getplantpal.com/api/*` — it never holds these keys.

## Third-party processors

| Service | Role |
|---------|------|
| **Supabase** | Auth, database, file storage |
| **OpenAI** | Plant ID, care plans, doctor chat (via server) |
| **Pl@ntNet** | Second opinion on plant identification (via server) |
| **OpenWeather** | Weather for local care (via server) |
| **Perenual** | Plant species data (via server) |
| **SerpAPI** | Price checking (via server) |
| **Vercel** | Hosts PlantPal web API used by mobile |
| **Expo / EAS** | Build and optional push delivery |

## Security

- Auth tokens stored in **Expo SecureStore** (iOS Keychain / Android Keystore)
- All network traffic over **HTTPS**
- Supabase Row Level Security on user data

## AI disclaimer

Identification and care content is **AI-assisted guidance**, not professional horticultural, agricultural, or medical advice.

## Children

PlantPal is not directed at children under 13.

## Contact

support@getplantpal.com (update before launch)

Last updated: June 2026

See also: [DATA_DELETION.md](./DATA_DELETION.md)
