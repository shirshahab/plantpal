/**
 * ZIP / climate lookup — mock table today with optional Zippopotam.us enrichment.
 *
 * Future providers: Census Geocoder, USDA zone dataset.
 */

import { getLocationProfile } from "@/lib/location/location-service";
import { lookupZipRecord } from "@/lib/location/usda-zones";
import type { ZipProfile } from "@/lib/types/integrations";

interface ZippopotamPlace {
  "place name": string;
  "state abbreviation": string;
  latitude: string;
  longitude: string;
}

interface ZippopotamResponse {
  places?: ZippopotamPlace[];
}

async function fetchZippopotam(zipCode: string): Promise<ZipProfile | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ZippopotamResponse;
    const place = data.places?.[0];
    if (!place) return null;

    const record = lookupZipRecord(zipCode);
    return {
      zipCode,
      city: place["place name"],
      state: place["state abbreviation"],
      latitude: Number.parseFloat(place.latitude),
      longitude: Number.parseFloat(place.longitude),
      usda_zone: record.usdaZone,
      climate_type: record.climateType,
      source: "zippopotam",
    };
  } catch (e) {
    console.error("[zip] Zippopotam lookup failed:", e);
    return null;
  }
}

function buildMockZipProfile(zipCode: string): ZipProfile {
  const profile = getLocationProfile(zipCode);
  const record = lookupZipRecord(zipCode);
  return {
    zipCode: profile.zipCode,
    city: profile.city,
    state: profile.state,
    latitude: null,
    longitude: null,
    usda_zone: profile.usdaZone,
    climate_type: profile.climateType,
    source: "mock",
  };
}

/** Resolve city, state, coordinates, and climate zone for a US ZIP. */
export async function getZipProfile(zipCode: string): Promise<ZipProfile> {
  const normalized = zipCode.trim().slice(0, 5);
  if (!/^\d{5}$/.test(normalized)) {
    return buildMockZipProfile("91107");
  }

  const live = await fetchZippopotam(normalized);
  if (live) return live;
  return buildMockZipProfile(normalized);
}

/** Sync profile from mock table only (client-safe). */
export function getMockZipProfile(zipCode: string): ZipProfile {
  return buildMockZipProfile(zipCode.trim().slice(0, 5));
}
