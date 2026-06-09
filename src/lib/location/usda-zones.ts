/** Mock ZIP → location lookup. Replace with geocoding API later. */

export interface ZipRecord {
  city: string;
  state: string;
  usdaZone: string;
  zoneNumber: number;
  climateType: "Mediterranean" | "Marine" | "Humid subtropical" | "Continental" | "Desert" | "Tropical";
  frostRisk: "low" | "moderate" | "high";
  heatRisk: "low" | "moderate" | "high";
  droughtRisk: "low" | "moderate" | "high";
}

const ZIP_TABLE: Record<string, ZipRecord> = {
  "91101": {
    city: "Pasadena",
    state: "CA",
    usdaZone: "10a",
    zoneNumber: 10,
    climateType: "Mediterranean",
    frostRisk: "low",
    heatRisk: "high",
    droughtRisk: "high",
  },
  "91107": {
    city: "Pasadena",
    state: "CA",
    usdaZone: "10a",
    zoneNumber: 10,
    climateType: "Mediterranean",
    frostRisk: "low",
    heatRisk: "high",
    droughtRisk: "high",
  },
  "90210": {
    city: "Beverly Hills",
    state: "CA",
    usdaZone: "10b",
    zoneNumber: 10,
    climateType: "Mediterranean",
    frostRisk: "low",
    heatRisk: "high",
    droughtRisk: "high",
  },
  "98101": {
    city: "Seattle",
    state: "WA",
    usdaZone: "8b",
    zoneNumber: 8,
    climateType: "Marine",
    frostRisk: "moderate",
    heatRisk: "low",
    droughtRisk: "low",
  },
  "10001": {
    city: "New York",
    state: "NY",
    usdaZone: "7b",
    zoneNumber: 7,
    climateType: "Humid subtropical",
    frostRisk: "moderate",
    heatRisk: "moderate",
    droughtRisk: "low",
  },
  "85001": {
    city: "Phoenix",
    state: "AZ",
    usdaZone: "9b",
    zoneNumber: 9,
    climateType: "Desert",
    frostRisk: "moderate",
    heatRisk: "high",
    droughtRisk: "high",
  },
  "33101": {
    city: "Miami",
    state: "FL",
    usdaZone: "10b",
    zoneNumber: 10,
    climateType: "Tropical",
    frostRisk: "low",
    heatRisk: "high",
    droughtRisk: "moderate",
  },
  "60601": {
    city: "Chicago",
    state: "IL",
    usdaZone: "6a",
    zoneNumber: 6,
    climateType: "Continental",
    frostRisk: "high",
    heatRisk: "moderate",
    droughtRisk: "low",
  },
};

/** Infer zone from ZIP prefix when exact match missing. */
function inferFromPrefix(zip: string): ZipRecord {
  const prefix = zip.slice(0, 3);
  const n = parseInt(prefix, 10);

  if (n >= 900 && n <= 961) {
    return {
      city: "Southern California",
      state: "CA",
      usdaZone: "10a",
      zoneNumber: 10,
      climateType: "Mediterranean",
      frostRisk: "low",
      heatRisk: "high",
      droughtRisk: "high",
    };
  }
  if (n >= 980 && n <= 994) {
    return {
      city: "Pacific Northwest",
      state: "WA",
      usdaZone: "8b",
      zoneNumber: 8,
      climateType: "Marine",
      frostRisk: "moderate",
      heatRisk: "low",
      droughtRisk: "low",
    };
  }
  if (n >= 850 && n <= 865) {
    return {
      city: "Desert Southwest",
      state: "AZ",
      usdaZone: "9b",
      zoneNumber: 9,
      climateType: "Desert",
      frostRisk: "moderate",
      heatRisk: "high",
      droughtRisk: "high",
    };
  }
  if (n >= 330 && n <= 349) {
    return {
      city: "South Florida",
      state: "FL",
      usdaZone: "10b",
      zoneNumber: 10,
      climateType: "Tropical",
      frostRisk: "low",
      heatRisk: "high",
      droughtRisk: "moderate",
    };
  }
  if (n >= 100 && n <= 149) {
    return {
      city: "Northeast",
      state: "NY",
      usdaZone: "7a",
      zoneNumber: 7,
      climateType: "Humid subtropical",
      frostRisk: "moderate",
      heatRisk: "moderate",
      droughtRisk: "low",
    };
  }

  return {
    city: "Your area",
    state: "US",
    usdaZone: "8a",
    zoneNumber: 8,
    climateType: "Continental",
    frostRisk: "moderate",
    heatRisk: "moderate",
    droughtRisk: "moderate",
  };
}

export function lookupZipRecord(zipCode: string): ZipRecord {
  const zip = zipCode.trim().slice(0, 5);
  return ZIP_TABLE[zip] ?? inferFromPrefix(zip);
}

export function parseZoneNumber(zone: string): number {
  const n = parseInt(zone.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 8;
}
