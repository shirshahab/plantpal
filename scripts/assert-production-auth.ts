/**
 * Production build guard — mock auth must never ship enabled.
 * Runs as prebuild via package.json.
 */
import { assertProductionAuthConfig } from "../src/lib/supabase/config";

assertProductionAuthConfig();
console.log("✓ Production auth config OK (mock auth disabled)");
