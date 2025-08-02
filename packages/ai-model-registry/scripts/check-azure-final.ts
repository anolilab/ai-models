import fs from "fs";

// Read the API file
const apiData = JSON.parse(fs.readFileSync("public/api.json", "utf8"));

// Find Azure models
const azureModels = apiData.models.filter((model: any) => model.provider === "Azure OpenAI");

console.log(`Found ${azureModels.length} Azure models\n`);

// Check specific models for the fields we're interested in
const modelsToCheck = ["gpt-4o (2024-11-20)", "gpt-4o-mini (2024-07-18)", "gpt-35-turbo (0125)"];

modelsToCheck.forEach((modelName) => {
    const model = azureModels.find((m: any) => m.name === modelName);

    if (model) {
        console.log(`\n=== ${modelName} ===`);
        console.log(`Context Window: ${model.limit?.context || "null"}`);
        console.log(`Max Output: ${model.limit?.output || "null"}`);
        console.log(`Training Cutoff: ${model.trainingCutoff || "null"}`);
    } else {
        console.log(`\n=== ${modelName} === (not found)`);
    }
});

// Show summary of fields
console.log("\n=== Summary ===");
const modelsWithContext = azureModels.filter((m: any) => m.limit?.context !== null).length;
const modelsWithOutput = azureModels.filter((m: any) => m.limit?.output !== null).length;
const modelsWithTraining = azureModels.filter((m: any) => m.trainingCutoff !== null).length;

console.log(`Models with Context Window: ${modelsWithContext}/${azureModels.length}`);
console.log(`Models with Max Output: ${modelsWithOutput}/${azureModels.length}`);
console.log(`Models with Training Cutoff: ${modelsWithTraining}/${azureModels.length}`);

// Show all models with their data
console.log("\n=== All Azure Models ===");
azureModels.forEach((model: any) => {
    console.log(`${model.name}:`);
    console.log(`  Context: ${model.limit?.context || "null"}`);
    console.log(`  Output: ${model.limit?.output || "null"}`);
    console.log(`  Training: ${model.trainingCutoff || "null"}`);
});
