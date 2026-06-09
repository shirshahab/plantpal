import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const { identifyPlantFromPhoto } = await import("../src/lib/ai/plant-identify.ts");
const { isOpenAIConfigured } = await import("../src/lib/ai/openai.ts");

console.log("isOpenAIConfigured:", isOpenAIConfigured());

try {
  const result = await identifyPlantFromPhoto(PNG);
  console.log("source:", result.source);
  console.log("provider:", result.identification_provider);
  console.log("name:", result.common_name);
} catch (e) {
  console.error("THREW:", e);
}
