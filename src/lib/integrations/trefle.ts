/**
 * Trefle API connector (placeholder)
 *
 * Future use:
 * - Scientific taxonomy (genus, family, kingdom)
 * - Distribution and native range data
 * - Cross-reference scientific names with our plant_species table
 *
 * Docs: https://docs.trefle.io/
 */

export interface TrefleSearchParams {
  q?: string;
  page?: number;
}

export async function searchTrefle(
  _params: TrefleSearchParams
): Promise<Record<string, unknown>[]> {
  // TODO: authenticate with TREFLE_TOKEN and search /plants
  return [];
}

export async function getTreflePlantById(
  _id: number
): Promise<Record<string, unknown> | null> {
  // TODO: map Trefle plant to PlantSpecies fields
  return null;
}
