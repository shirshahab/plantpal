/**
 * Scan user-facing PlantPal copy for brand violations.
 * Usage: npm run audit:copy
 */
import { auditPlantPalCopy } from "../src/lib/copy/audit-copy";

function main() {
  const result = auditPlantPalCopy();

  console.log("=== PlantPal copy audit ===\n");
  console.log("Violations:", result.violationCount);
  console.log("Blocking:", result.blockingCount, "| Warnings:", result.warningCount);
  console.log("Status:", result.ok ? "OK" : "ISSUES FOUND");

  if (result.topFiles.length) {
    console.log("\nTop files:");
    result.topFiles.forEach((f) => console.log(`  ${f.count}  ${f.file}`));
  }

  if (result.violations.length) {
    console.log("\nDetails (first 30):");
    result.violations.slice(0, 30).forEach((v) => {
      console.log(`  [${v.type}] ${v.file}:${v.line}`);
      console.log(`    ${v.snippet}`);
    });
  }

  if (!result.ok) process.exitCode = 1;
}

main();
