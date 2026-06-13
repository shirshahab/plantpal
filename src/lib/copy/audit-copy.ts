import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

export type CopyViolationType =
  | "em_dash"
  | "ai_language"
  | "corporate_phrase"
  | "fake_growth_stat";

export interface CopyViolation {
  file: string;
  line: number;
  type: CopyViolationType;
  snippet: string;
}

export interface CopyAuditResult {
  ok: boolean;
  violationCount: number;
  blockingCount: number;
  warningCount: number;
  topFiles: { file: string; count: number }[];
  violations: CopyViolation[];
}

const SCAN_DIRS = [
  "src/app",
  "src/components",
  "src/lib/copy",
  "src/lib/local",
  "src/lib/tasks",
  "src/lib/dashboard",
  "src/content",
];

const EXCLUDE_PATH_PARTS = [
  "/admin/",
  "/debug/",
  "/api/debug/",
  "/setup/",
  "node_modules",
  ".next",
  "/migrations/",
  ".test.",
  ".spec.",
];

const EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js", ".md", ".mdx"]);

const CORPORATE_PATTERNS: { type: CopyViolationType; pattern: RegExp; label: string }[] = [
  { type: "corporate_phrase", pattern: /\bleverage\b/i, label: "leverage" },
  { type: "corporate_phrase", pattern: /\boptimize\b/i, label: "optimize" },
  { type: "corporate_phrase", pattern: /\benhance\b/i, label: "enhance" },
  { type: "corporate_phrase", pattern: /\bempower\b/i, label: "empower" },
  { type: "corporate_phrase", pattern: /\brevolutionary\b/i, label: "revolutionary" },
  { type: "corporate_phrase", pattern: /\becosystem\b/i, label: "ecosystem" },
  { type: "corporate_phrase", pattern: /\bwellness\b/i, label: "wellness" },
];

const AI_PATTERNS = [
  /\bAI[- ]powered\b/i,
  /\bpowered by AI\b/i,
  /\bour AI\b/i,
  /\bartificial intelligence\b/i,
  /\bmachine learning\b/i,
  /\bLLM\b/,
  /\bGPT\b/,
];

const FAKE_STAT_PATTERN = /\bup\s+\d{2,3}%|\b\d{2,3}%\s+(?:growth|increase|more)\b/i;

const EXCLUDE_FILES = new Set([
  "src/lib/copy/audit-copy.ts",
  "src/lib/copy/brand-voice-internal.ts",
]);

function shouldScanFile(absPath: string, root: string): boolean {
  const rel = relative(root, absPath).replace(/\\/g, "/");
  if (EXCLUDE_FILES.has(rel)) return false;
  if (!EXTENSIONS.has(rel.slice(rel.lastIndexOf(".")))) return false;
  if (EXCLUDE_PATH_PARTS.some((part) => rel.includes(part.replace(/^\//, "")))) return false;
  if (rel.includes("/api/admin/")) return false;
  return true;
}

function walk(dir: string, root: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(abs, root, out);
    } else if (shouldScanFile(abs, root)) {
      out.push(abs);
    }
  }
}

function isLikelyUserFacingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return false;
  if (trimmed.startsWith("{/*") || trimmed.includes("{/*") || trimmed.endsWith("*/}")) return false;
  if (trimmed.startsWith("import ") || trimmed.startsWith("export type")) return false;
  if (/console\.(log|info|warn|error)/.test(trimmed)) return false;
  if (/pattern:\s*\//.test(trimmed) || /label:\s*"/.test(trimmed)) return false;
  return /["'`][^"'`]{8,}["'`]/.test(trimmed) || />[^<{][^<]{6,}</.test(trimmed);
}

function auditLine(line: string, file: string, lineNo: number, violations: CopyViolation[]): void {
  if (!isLikelyUserFacingLine(line)) return;

  if (line.includes("—") || line.includes("–")) {
    violations.push({
      file,
      line: lineNo,
      type: "em_dash",
      snippet: line.trim().slice(0, 120),
    });
  }

  for (const pattern of AI_PATTERNS) {
    if (pattern.test(line)) {
      violations.push({
        file,
        line: lineNo,
        type: "ai_language",
        snippet: line.trim().slice(0, 120),
      });
      break;
    }
  }

  for (const { type, pattern } of CORPORATE_PATTERNS) {
    if (pattern.test(line)) {
      violations.push({
        file,
        line: lineNo,
        type,
        snippet: line.trim().slice(0, 120),
      });
    }
  }

  if (FAKE_STAT_PATTERN.test(line) && !/sourceLabel|source_flag|backed_by/i.test(line)) {
    violations.push({
      file,
      line: lineNo,
      type: "fake_growth_stat",
      snippet: line.trim().slice(0, 120),
    });
  }
}

export function auditPlantPalCopy(root = process.cwd()): CopyAuditResult {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    walk(join(root, dir), root, files);
  }

  const violations: CopyViolation[] = [];

  for (const abs of files) {
    const rel = relative(root, abs).replace(/\\/g, "/");
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    lines.forEach((line, idx) => auditLine(line, rel, idx + 1, violations));
  }

  const fileCounts = new Map<string, number>();
  for (const v of violations) {
    fileCounts.set(v.file, (fileCounts.get(v.file) ?? 0) + 1);
  }

  const topFiles = [...fileCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([file, count]) => ({ file, count }));

  const blockingCount = violations.filter((v) => v.type === "em_dash" || v.type === "ai_language").length;
  const warningCount = violations.length - blockingCount;

  return {
    ok: violations.length === 0,
    violationCount: violations.length,
    blockingCount,
    warningCount,
    topFiles,
    violations,
  };
}
