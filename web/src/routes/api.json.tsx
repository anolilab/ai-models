import { getAllModels, getProviders } from "@anolilab/ai-model-registry";
import { createFileRoute } from "@tanstack/react-router";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Get the path to the api.json file in the package
const getApiJsonPath = (): string => {
    try {
        // Try to resolve from node_modules (works in most cases)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const packagePath = require.resolve("@anolilab/ai-model-registry/package.json");
        const packageDir = join(packagePath, "..");

        return join(packageDir, "public", "api.json");
    } catch {
        // Fallback: try to find it relative to the workspace root
        // Get the directory of the current file
        const currentFile = fileURLToPath(import.meta.url);
        const currentDir = dirname(currentFile);
        // Navigate from web/src/routes to packages/ai-model-registry/public
        return join(currentDir, "..", "..", "..", "packages", "ai-model-registry", "public", "api.json");
    }
};

export const Route = createFileRoute("/api.json" as "/")({
    // No component needed for API routes - return null
    component: () => null,
    loader: async () => {
        try {
            // Try to read the file directly first (faster and more efficient)
            const apiJsonPath = getApiJsonPath();
            const fileContent = readFileSync(apiJsonPath, "utf-8");
            const apiData = JSON.parse(fileContent);

            // Return Response object for API endpoint
            throw new Response(JSON.stringify(apiData), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale-while-revalidate for 24 hours
                },
            });
        } catch (error) {
            // If it's already a Response (from the throw above), re-throw it
            if (error instanceof Response) {
                throw error;
            }

            // Fallback: reconstruct from API functions if file read fails
            console.warn("Could not read api.json file, reconstructing from API:", error);

            const [allModels, providers] = await Promise.all([getAllModels(), getProviders()]);

            const apiData = {
                metadata: {
                    description: "AI Models API - Comprehensive database of AI model specifications, pricing, and features",
                    lastUpdated: new Date().toISOString(),
                    totalModels: allModels.length,
                    totalProviders: providers.length,
                    version: "0.0.0-development",
                },
                models: allModels,
            };

            // Return Response object for API endpoint
            throw new Response(JSON.stringify(apiData), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale-while-revalidate for 24 hours
                },
            });
        }
    },
});
