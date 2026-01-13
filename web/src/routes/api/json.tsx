import { getAllModels, getProviders } from "@anolilab/ai-model-registry";
import { createFileRoute } from "@tanstack/react-router";
import pkg from "@anolilab/ai-model-registry/package.json";

export const Route = createFileRoute("/api/json")({
    server: {
        handlers: {
            GET: async () => {
                const [allModels, providers] = await Promise.all([getAllModels(), getProviders()]);

                const apiData = {
                    metadata: {
                        description: "AI Models API - Comprehensive database of AI model specifications, pricing, and features",
                        lastUpdated: new Date().toISOString(),
                        totalModels: allModels.length,
                        totalProviders: providers.length,
                        version: pkg.version,
                    },
                    models: allModels,
                };

                // Return Response object for API endpoint
                return new Response(JSON.stringify(apiData), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale-while-revalidate for 24 hours
                    },
                });
            },
        },
    },
});
