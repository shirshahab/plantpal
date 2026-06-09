import { getMockWeatherForZip } from "@/lib/integrations/weather";

/** @deprecated Use fetchWeatherForZip from @/lib/integrations/weather */
export function getMockWeather(zipCode = "91107") {
  return getMockWeatherForZip(zipCode);
}
