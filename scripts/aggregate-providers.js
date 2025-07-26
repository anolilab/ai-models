// scripts/aggregate-providers.js
// Merged script to aggregate provider data and generate TypeScript data file

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const TOOLS_DIR = path.resolve(__dirname, '../tools/download');
const PROVIDERS_DIR = path.join(TOOLS_DIR, 'providers');
const SCHEMA_PATH = path.join(TOOLS_DIR, 'schema.js');
const OUTPUT_JSON = path.join(TOOLS_DIR, 'all-models.json');
const OUTPUT_TS = path.resolve(__dirname, '../packages/provider-registry/src/models-data.ts');

// Dynamically import the ModelSchema from tools/download/schema.js
async function getModelSchema() {
  const mod = await import(SCHEMA_PATH);
  return mod.ModelSchema;
}

function getAllJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  });
  return results;
}

async function aggregateModels() {
  const ModelSchema = await getModelSchema();
  const allFiles = getAllJsonFiles(PROVIDERS_DIR);
  const models = [];
  for (const file of allFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const data = JSON.parse(raw);
      const parsed = ModelSchema.safeParse(data);
      if (parsed.success) {
        models.push(parsed.data);
      } else {
        console.warn(`[WARN] Validation failed for ${file}:`, parsed.error.errors);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to process ${file}:`, err.message);
    }
  }
  return models;
}

async function main() {
  try {
    // Aggregate and validate models
    const models = await aggregateModels();
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(models, null, 2));
    console.log(`[DONE] Aggregated ${models.length} models to ${OUTPUT_JSON}`);

    // Generate TypeScript data file for the package
    const tsContent = `// Auto-generated file - do not edit manually\n// Generated from aggregated provider data\n\nimport type { Model } from './schema';\n\nexport const allModels: Model[] = ${JSON.stringify(models, null, 2)} as Model[];\n`;
    fs.writeFileSync(OUTPUT_TS, tsContent);
    console.log(`[DONE] Generated ${OUTPUT_TS} with ${models.length} models`);
  } catch (error) {
    console.error('Error during aggregation:', error);
    process.exit(1);
  }
}

main(); 