/**
 * USDA Plants Database connector (placeholder)
 *
 * Future use:
 * - Hardiness zone validation
 * - Native/invasive status by region
 * - Official common and scientific names for US plants
 *
 * Source: https://plants.usda.gov/
 */

export interface UsdaSearchParams {
  symbol?: string;
  commonName?: string;
  scientificName?: string;
}

export async function searchUsdaPlants(
  _params: UsdaSearchParams
): Promise<Record<string, unknown>[]> {
  // TODO: query USDA Plants API or cached dataset
  return [];
}

export async function getUsdaPlantProfile(
  _symbol: string
): Promise<Record<string, unknown> | null> {
  // TODO: return growth habit, duration, native status
  return null;
}
