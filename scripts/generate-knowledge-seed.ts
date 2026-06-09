/**
 * Generates supabase/seeds/004_knowledge_seed.sql from TypeScript seed data.
 * Run: npx tsx scripts/generate-knowledge-seed.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  PLANT_SPECIES,
  SOIL_TYPES,
  FERTILIZERS,
  PESTS,
  DISEASES,
  PLANT_CARE_GUIDES,
  PLANT_SOIL_MATCHES,
  PLANT_FERTILIZER_MATCHES,
  PLANT_PEST_RISKS,
  PLANT_DISEASE_RISKS,
} from "../src/lib/knowledge/seed";

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

const idMap = new Map<string, string>();

function stableUuid(seed: string): string {
  if (idMap.has(seed)) return idMap.get(seed)!;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).padStart(8, "0");
  const uuid = `${hex.slice(0, 8)}-0000-4000-8000-${seed.padEnd(12, "0").slice(0, 12).replace(/[^a-f0-9]/gi, "0")}`;
  idMap.set(seed, uuid);
  return uuid;
}

function mapId(seedId: string): string {
  return stableUuid(seedId);
}

let sql = `-- PlantPal Knowledge Engine Seed (auto-generated)
-- Run after 003_knowledge_engine.sql
-- Source: src/lib/knowledge/seed/

BEGIN;

`;

for (const p of PLANT_SPECIES) {
  const id = mapId(p.id);
  sql += `INSERT INTO plant_species (id, common_name, scientific_name, family, type, description, sunlight, watering, soil_preference, hardiness_zone_min, hardiness_zone_max, mature_height, mature_width, growth_rate, toxicity, maintenance_level, image_url, source) VALUES (${esc(id)}, ${esc(p.common_name)}, ${esc(p.scientific_name)}, ${esc(p.family)}, ${esc(p.type)}, ${esc(p.description)}, ${esc(p.sunlight)}, ${esc(p.watering)}, ${esc(p.soil_preference)}, ${p.hardiness_zone_min}, ${p.hardiness_zone_max}, ${esc(p.mature_height)}, ${esc(p.mature_width)}, ${esc(p.growth_rate)}, ${esc(p.toxicity)}, ${esc(p.maintenance_level)}, ${esc(p.image_url)}, ${esc(p.source)}) ON CONFLICT DO NOTHING;\n`;
}

for (const s of SOIL_TYPES) {
  sql += `INSERT INTO soil_types (id, name, texture, drainage, ph_min, ph_max, best_for, description, amendments) VALUES (${esc(mapId(s.id))}, ${esc(s.name)}, ${esc(s.texture)}, ${esc(s.drainage)}, ${s.ph_min}, ${s.ph_max}, ${esc(s.best_for)}, ${esc(s.description)}, ${esc(s.amendments)}) ON CONFLICT (name) DO NOTHING;\n`;
}

for (const f of FERTILIZERS) {
  sql += `INSERT INTO fertilizers (id, name, type, npk_ratio, best_for, application_frequency, season, warning_notes, description) VALUES (${esc(mapId(f.id))}, ${esc(f.name)}, ${esc(f.type)}, ${esc(f.npk_ratio)}, ${esc(f.best_for)}, ${esc(f.application_frequency)}, ${esc(f.season)}, ${esc(f.warning_notes)}, ${esc(f.description)}) ON CONFLICT (name) DO NOTHING;\n`;
}

for (const p of PESTS) {
  sql += `INSERT INTO pests (id, name, description, signs, affected_plants, treatment, prevention, image_url) VALUES (${esc(mapId(p.id))}, ${esc(p.name)}, ${esc(p.description)}, ${esc(p.signs)}, ${esc(p.affected_plants)}, ${esc(p.treatment)}, ${esc(p.prevention)}, ${esc(p.image_url)}) ON CONFLICT (name) DO NOTHING;\n`;
}

for (const d of DISEASES) {
  sql += `INSERT INTO diseases (id, name, description, symptoms, causes, affected_plants, treatment, prevention, image_url) VALUES (${esc(mapId(d.id))}, ${esc(d.name)}, ${esc(d.description)}, ${esc(d.symptoms)}, ${esc(d.causes)}, ${esc(d.affected_plants)}, ${esc(d.treatment)}, ${esc(d.prevention)}, ${esc(d.image_url)}) ON CONFLICT (name) DO NOTHING;\n`;
}

for (const g of PLANT_CARE_GUIDES) {
  sql += `INSERT INTO plant_care_guides (id, plant_species_id, watering_guide, sunlight_guide, soil_guide, fertilizer_guide, pruning_guide, repotting_guide, seasonal_care, common_problems, beginner_tips) VALUES (${esc(mapId(g.id))}, ${esc(mapId(g.plant_species_id))}, ${esc(g.watering_guide)}, ${esc(g.sunlight_guide)}, ${esc(g.soil_guide)}, ${esc(g.fertilizer_guide)}, ${esc(g.pruning_guide)}, ${esc(g.repotting_guide)}, ${esc(g.seasonal_care)}, ${esc(g.common_problems)}, ${esc(g.beginner_tips)}) ON CONFLICT (plant_species_id) DO NOTHING;\n`;
}

for (const m of PLANT_SOIL_MATCHES) {
  sql += `INSERT INTO plant_soil_matches (plant_species_id, soil_type_id, suitability) VALUES (${esc(mapId(m.plant_species_id))}, ${esc(mapId(m.soil_type_id))}, ${esc(m.suitability)}) ON CONFLICT DO NOTHING;\n`;
}

for (const m of PLANT_FERTILIZER_MATCHES) {
  sql += `INSERT INTO plant_fertilizer_matches (plant_species_id, fertilizer_id, suitability) VALUES (${esc(mapId(m.plant_species_id))}, ${esc(mapId(m.fertilizer_id))}, ${esc(m.suitability)}) ON CONFLICT DO NOTHING;\n`;
}

for (const r of PLANT_PEST_RISKS) {
  sql += `INSERT INTO plant_pest_risks (plant_species_id, pest_id, risk_level) VALUES (${esc(mapId(r.plant_species_id))}, ${esc(mapId(r.pest_id))}, ${esc(r.risk_level)}) ON CONFLICT DO NOTHING;\n`;
}

for (const r of PLANT_DISEASE_RISKS) {
  sql += `INSERT INTO plant_disease_risks (plant_species_id, disease_id, risk_level) VALUES (${esc(mapId(r.plant_species_id))}, ${esc(mapId(r.disease_id))}, ${esc(r.risk_level)}) ON CONFLICT DO NOTHING;\n`;
}

sql += `\nCOMMIT;\n`;

const outDir = join(process.cwd(), "supabase", "seeds");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "004_knowledge_seed.sql");
writeFileSync(outPath, sql);
console.log(`Wrote ${outPath} (${PLANT_SPECIES.length} plants)`);
