import { snakeCase } from "@visulima/string/case";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { PROVIDER_ICON_MAP } from "./config";

const LOBEHUB_ICONS_DIR = join(process.cwd(), "node_modules", "@lobehub", "icons-static-svg", "icons");
const CUSTOM_ICONS_DIR = join(process.cwd(), "assets", "icons", "providers");
const OUTPUT_FILE = join(process.cwd(), "src", "icons-sprite.ts");
const MODELS_DATA_FILE = join(process.cwd(), "data", "all-models.json");

interface IconData {
    [key: string]: string;
}

interface Model {
    icon?: string;
    provider?: string;
}

/**
 * Extracts unique providers from the aggregated model data
 */
const getUniqueProvidersFromModels = (): Set<string> => {
    try {
        const modelsData = readFileSync(MODELS_DATA_FILE, "utf-8");
        const models: Model[] = JSON.parse(modelsData);

        const providers = new Set<string>();

        for (const model of models) {
            if (model.provider) {
                providers.add(model.provider.toLowerCase());
            }
        }

        console.log(`[ICONS] Found ${providers.size} unique providers in model data`);

        return providers;
    } catch (error) {
        console.warn(`[ICONS] Could not read models data: ${error}`);

        return new Set();
    }
};

/**
 * Creates a fallback icon for providers without any icons
 */
const createFallbackIcon = (providerName: string): { content: string; viewBox: string } => {
    const firstLetter = providerName.charAt(0).toUpperCase();
    const words = providerName.split(" ");
    const initials = words.map((word) => word.charAt(0).toUpperCase()).join("");

    // Create a simple circular icon with initials
    const content = `
    <circle cx="12" cy="12" r="10" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
    <text x="12" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#374151">${initials.length > 1 ? initials : firstLetter}</text>
  `;

    return { content: content.trim(), viewBox: "0 0 24 24" };
};

/**
 * Extracts SVG content from LobeHub icon file
 */
const extractSvgFromLobeHubIcon = (iconName: string): string | null => {
    try {
        // Try different possible file extensions and naming patterns
        const possibleNames = [`${iconName}.svg`, `${iconName}-color.svg`];

        for (const fileName of possibleNames) {
            const filePath = join(LOBEHUB_ICONS_DIR, fileName);

            try {
                const content = readFileSync(filePath, "utf-8");

                if (content.includes("<svg")) {
                    return content;
                }
            } catch (error) {
                // File doesn't exist, try next name
                continue;
            }
        }

        return null;
    } catch (error) {
        console.warn(`Warning: Could not extract SVG for icon ${iconName}:`, error);

        return null;
    }
};

/**
 * Extracts SVG content from our custom icon file
 */
const extractSvgFromCustomIcon = (providerName: string): string | null => {
    try {
        // Try different possible file extensions and naming patterns
        const possibleNames = [
            `${providerName}.svg`,
            `${providerName}.png`,
            `${providerName.replace(" ", "-")}.svg`,
            `${providerName.replace(" ", "-")}.png`,
            `${providerName.replace(" ", "_")}.svg`,
            `${providerName.replace(" ", "_")}.png`,
            // Special case for xai -> x-ai
            ...(providerName === "xai" ? ["x-ai.svg", "x-ai.png"] : []),
            // Special case for amazon bedrock -> amazon-bedrock
            ...(providerName === "amazon bedrock" ? ["amazon-bedrock.svg", "amazon-bedrock.png"] : []),
            // Special case for weights & biases -> wandb
            ...(providerName === "weights & biases" ? ["wandb.svg", "wandb.png"] : []),
        ];

        for (const fileName of possibleNames) {
            const filePath = join(CUSTOM_ICONS_DIR, fileName);

            try {
                if (fileName.endsWith(".svg")) {
                    const content = readFileSync(filePath, "utf-8");

                    if (content.includes("<svg")) {
                        return content;
                    }
                } else if (fileName.endsWith(".png")) {
                    // Convert PNG to base64 and create SVG wrapper
                    const pngBuffer = readFileSync(filePath);
                    const base64 = pngBuffer.toString("base64");
                    const mimeType = "image/png";

                    // Create SVG wrapper for PNG
                    const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <image href="data:${mimeType};base64,${base64}" width="24" height="24"/>
</svg>`;

                    return svgWrapper;
                }
            } catch (error) {
                // File doesn't exist, try next name
                continue;
            }
        }

        return null;
    } catch (error) {
        console.warn(`Warning: Could not extract custom icon for ${providerName}:`, error);

        return null;
    }
};

/**
 * Optimizes SVG content by removing unnecessary attributes and whitespace
 */
const optimizeSvgContent = (svgContent: string): string => {
    let optimized = svgContent;

    // Remove comments
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, "");

    // Remove unnecessary whitespace and newlines
    optimized = optimized.replace(/\s+/g, " ");
    optimized = optimized.replace(/>\s+</g, "><");
    optimized = optimized.trim();

    // Remove common unnecessary attributes that don't affect rendering
    optimized = optimized.replace(/\s+(xmlns:xlink|xlink:href|xml:space|xml:lang|enable-background|fill-rule|clip-rule)="[^"]*"/g, "");

    // Remove empty style attributes
    optimized = optimized.replace(/\s+style="\s*"/g, "");

    // Remove empty class attributes
    optimized = optimized.replace(/\s+class="\s*"/g, "");

    // Remove empty id attributes (except for defs and symbols)
    optimized = optimized.replace(/\s+id="\s*"/g, "");

    // Preserve title elements for accessibility (but remove empty ones)
    optimized = optimized.replace(/<title>\s*<\/title>/g, "");

    // Remove data-* attributes that are often added by design tools
    optimized = optimized.replace(/\s+data-[^=]*="[^"]*"/g, "");

    // Remove Adobe Illustrator specific attributes
    optimized = optimized.replace(/\s+(sodipodi|inkscape):[^=]*="[^"]*"/g, "");

    // Remove Sketch/Figma specific attributes
    optimized = optimized.replace(/\s+(sketch|figma):[^=]*="[^"]*"/g, "");

    // Remove empty groups and elements that don't contribute to rendering
    optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, "");

    // Clean up multiple spaces
    optimized = optimized.replace(/\s{2,}/g, " ");

    return optimized;
};

/**
 * Extracts SVG content and viewBox from icon
 */
const extractSvgContent = (iconName: string, isCustom = false): { content: string; viewBox: string } | null => {
    const svgString = isCustom ? extractSvgFromCustomIcon(iconName) : extractSvgFromLobeHubIcon(iconName);

    if (!svgString) {
        return null;
    }

    // Extract the SVG content and attributes
    const svgMatch = svgString.match(/<svg([^>]*)>(.*?)<\/svg>/s);

    if (!svgMatch) {
        console.warn(`Warning: Invalid SVG structure for icon ${iconName}`);

        return null;
    }

    const svgAttributes = svgMatch[1];
    let svgContent = svgMatch[2].trim();

    // Extract viewBox from original SVG
    let viewBox = "0 0 24 24"; // default
    const viewBoxMatch = svgAttributes.match(/viewBox="([^"]*)"/);

    if (viewBoxMatch) {
        viewBox = viewBoxMatch[1];
    }

    // Remove any <style> tags and their content to prevent CSS conflicts
    svgContent = svgContent.replace(/<style[^>]*>.*?<\/style>/gs, "");

    // Remove any CSS media queries that might affect icon colors
    svgContent = svgContent.replace(/@media[^{]*\{[^}]*\}/g, "");

    // Extract defs section (gradient definitions) to keep them outside the transform group
    const defsMatch = svgContent.match(/(<defs[^>]*>.*?<\/defs>)/s);
    const defsContent = defsMatch ? defsMatch[1] : "";

    // Remove defs from the main content
    svgContent = svgContent.replace(/<defs[^>]*>.*?<\/defs>/s, "");

    // Optimize the SVG content
    svgContent = optimizeSvgContent(svgContent);

    // Add defs back at the beginning
    if (defsContent) {
        svgContent = `${defsContent}\n${svgContent}`;
    }

    return { content: svgContent, viewBox };
};

const generateSpriteSheet = (): void => {
    const iconSymbols: IconData = {};
    let spriteContent = '<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n';

    // Get unique providers from model data
    const uniqueProviders = getUniqueProvidersFromModels();

    // Statistics
    let totalIcons = 0;
    let successfulIcons = 0;
    let customIcons = 0;
    let fallbackIcons = 0;
    let failedIcons = 0;

    // Process each provider from the model data
    for (const provider of uniqueProviders) {
        totalIcons++;

        // Try to find icon for the provider
        const iconName = PROVIDER_ICON_MAP[provider];

        if (!iconName) {
            console.log(`⚠️  No icon mapped for provider: ${provider}`);
            failedIcons++;
            continue;
        }

        try {
            // First try LobeHub icon
            let svgData = extractSvgContent(iconName, false);

            if (svgData) {
                const symbolId = `icon_${snakeCase(provider)}`;

                // Add to sprite sheet
                spriteContent += `  <symbol id="${symbolId}" viewBox="${svgData.viewBox}">\n`;
                spriteContent += `    ${svgData.content}\n`;
                spriteContent += `  </symbol>\n`;

                // Store reference using the icon name as key
                iconSymbols[iconName] = symbolId;
                successfulIcons++;

                console.log(`✅ Generated icon for ${provider} using LobeHub ${iconName}`);
            } else {
                // Try custom icon for missing providers
                // First try with the mapped icon name, then with the provider name
                svgData = extractSvgContent(iconName, true);

                if (!svgData) {
                    svgData = extractSvgContent(provider, true);
                }

                if (svgData) {
                    const symbolId = `icon_${snakeCase(provider)}`;

                    // Add custom icon to sprite sheet
                    spriteContent += `  <symbol id="${symbolId}" viewBox="${svgData.viewBox}">\n`;
                    spriteContent += `    ${svgData.content}\n`;
                    spriteContent += `  </symbol>\n`;

                    // Store reference
                    iconSymbols[provider] = symbolId;
                    customIcons++;

                    console.log(`🎨 Used custom icon for ${provider} (no LobeHub icon: ${iconName})`);
                } else {
                    // Create fallback icon for providers without any icons
                    const fallbackData = createFallbackIcon(provider);
                    const symbolId = `icon_${snakeCase(provider)}`;

                    // Add fallback icon to sprite sheet
                    spriteContent += `  <symbol id="${symbolId}" viewBox="${fallbackData.viewBox}">\n`;
                    spriteContent += `    ${fallbackData.content}\n`;
                    spriteContent += `  </symbol>\n`;

                    // Store reference
                    iconSymbols[provider] = symbolId;
                    fallbackIcons++;

                    console.log(`🔄 Created fallback icon for ${provider} (no icons available)`);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Error processing icon for ${provider} (${iconName}):`, error);
            failedIcons++;
        }
    }

    spriteContent += "</svg>";

    // Generate TypeScript file
    const tsContent = `/* Auto-generated file - do not edit manually
 * Generated using @lobehub/icons-static-svg and custom icons
 * 
 * To regenerate this file, run: pnpm run generate-icons
 */

// SVG icons in sprite sheet
export const iconSymbols: Record<string, string> = ${JSON.stringify(iconSymbols, null, 2)} as const;

// Provider name to LobeHub icon name mapping
export const providerIconMap: Record<string, string> = ${JSON.stringify(PROVIDER_ICON_MAP, null, 2)} as const;

// Sprite sheet containing all icons
export const spriteSheet = \`${spriteContent}\`;

export function getIcon(providerName: string): string | null {
  // First check if the provider name maps to a LobeHub icon
  const iconName = providerIconMap[providerName];
  if (iconName) {
    const symbolId = iconSymbols[iconName];
    if (symbolId) {
      return \`#\${symbolId}\`;
    }
  }
  
  // Fallback: check if the provider name directly matches an icon
  const symbolId = iconSymbols[providerName];
  if (symbolId) {
    return \`#\${symbolId}\`;
  }
  
  return null;
}

export function hasProviderIcon(providerName: string): boolean {
  // First check if the provider name maps to a LobeHub icon
  const iconName = providerIconMap[providerName];
  if (iconName) {
    return iconName in iconSymbols;
  }
  
  // Fallback: check if the provider name directly matches an icon
  return providerName in iconSymbols;
}

export function isSvgIcon(providerName: string): boolean {
  // All icons are SVG
  return hasProviderIcon(providerName);
}

export function isBase64Icon(providerName: string): boolean {
  // No base64 icons when using LobeHub icons
  return false;
}
`;

    writeFileSync(OUTPUT_FILE, tsContent);

    // Log summary
    console.log(`\n📊 Icon Generation Summary:`);
    console.log(`   • Total providers: ${totalIcons}`);
    console.log(`   • LobeHub icons: ${successfulIcons}`);
    console.log(`   • Custom icons: ${customIcons}`);
    console.log(`   • Fallback icons: ${fallbackIcons}`);
    console.log(`   • Failed icons: ${failedIcons}`);
    console.log(`   • Success rate: ${(((successfulIcons + customIcons + fallbackIcons) / totalIcons) * 100).toFixed(1)}%`);

    if (customIcons > 0) {
        console.log(`\n🎨 Used ${customIcons} custom icons for providers without LobeHub icons`);
    }

    if (fallbackIcons > 0) {
        console.log(`\n🔄 Created ${fallbackIcons} fallback icons for providers without any icons`);
    }

    if (failedIcons > 0) {
        console.log(`\n⚠️  ${failedIcons} providers still have no icon mapping`);
    }

    console.log(`\n✅ Generated icon system with ${successfulIcons + customIcons + fallbackIcons} icons in ${OUTPUT_FILE}`);
};

generateSpriteSheet();
