import { readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const LOBEHUB_ICONS_DIR = join(process.cwd(), "node_modules", "@lobehub", "icons-static-svg", "icons");
const CUSTOM_ICONS_DIR = join(process.cwd(), "assets", "icons", "providers");

/**
 * Gets all available LobeHub icon names
 */
const getLobeHubIconNames = (): Set<string> => {
    try {
        const files = readdirSync(LOBEHUB_ICONS_DIR);
        const iconNames = new Set<string>();

        for (const file of files) {
            if (file.endsWith(".svg")) {
                // Extract base name without extension and variants
                const baseName = file
                    .replace(/\.svg$/, "")
                    .replace(/-color$/, "")
                    .replace(/-text$/, "")
                    .replace(/-brand$/, "")
                    .replace(/-brand-color$/, "");

                iconNames.add(baseName);
            }
        }

        return iconNames;
    } catch (error) {
        console.error("Error reading LobeHub icons directory:", error);

        return new Set();
    }
};

/**
 * Gets all custom icon names
 */
const getCustomIconNames = (): Set<string> => {
    try {
        const files = readdirSync(CUSTOM_ICONS_DIR);
        const iconNames = new Set<string>();

        for (const file of files) {
            if (file.endsWith(".svg") || file.endsWith(".png")) {
                // Extract base name without extension
                const baseName = file.replace(/\.(svg|png)$/, "");

                iconNames.add(baseName);
            }
        }

        return iconNames;
    } catch (error) {
        console.error("Error reading custom icons directory:", error);

        return new Set();
    }
};

/**
 * Maps custom icon names to LobeHub equivalents
 */
const mapCustomToLobeHub = (): Record<string, string> => {
    const mapping: Record<string, string> = {
        "agentica-org": "agentica-org",
        ai21: "ai21",
        "aion-labs": "aionlabs",
        alfredpros: "alfredpros",
        alibaba: "alibaba",
        alpindale: "alpindale",
        // Direct matches
        amazon: "amazon",
        "amazon-bedrock": "", // Keep - custom icon
        "anthracite-org": "anthracite-org",
        anthropic: "anthropic",
        "arcee-ai": "arcee-ai",
        arliai: "arliai",
        atlascloud: "atlascloud",
        atoma: "atoma",
        avian: "avian",
        baidu: "baidu",
        baseten: "baseten",
        bytedance: "bytedance",
        cerebras: "cerebras",
        chutes: "chutes",
        cloudflare: "cloudflare",
        cognitivecomputations: "cognitive-computations",
        cohere: "cohere",
        crusoe: "crusoe",
        deepinfra: "deepinfra",
        eleutherai: "eleutherai",
        enfer: "enfer",
        featherless: "featherless",
        friendli: "friendli",
        gmicloud: "gmicloud",
        "google-ai-studio": "google-ai-studio",
        groq: "groq",
        gryphe: "gryphe",
        hyperbolic: "hyperbolic",
        inception: "inception",
        inferencenet: "inferencenet",
        infermatic: "infermatic",
        inflection: "inflection",
        kluster: "kluster",
        lambda: "lambda",
        liquid: "liquid",
        luma: "luma",
        mancer: "mancer",
        meta: "meta",
        "meta-llama": "meta",
        microsoft: "microsoft",
        minimax: "minimax",
        mistral: "mistral",
        mistralai: "mistral",
        "model-scope": "modelscope",
        moonshotai: "moonshot",
        // Keep these custom icons (not in LobeHub)
        morph: "", // Keep - custom icon
        ncompass: "ncompass",
        nebius: "nebius",
        neversleep: "neversleep",
        nextbit: "nextbit",
        nineteen: "nineteen",
        nothingiisreal: "nothing-is-real",
        nousresearch: "nousresearch",
        novita: "novita",
        nscale: "nscale",
        nvidia: "nvidia",
        openai: "openai",
        opengvlab: "opengvlab",
        openinference: "openinference",
        openrouter: "openrouter",
        parasail: "parasail",
        perplexity: "perplexity",
        phala: "phala",
        pygmalionai: "pygmalion-ai",
        qwen: "qwen",
        rekaai: "reka-ai",
        requesty: "", // Keep - custom icon
        sambanova: "sambanova",
        sarvamai: "sarvam-ai",
        scb10x: "scb10x",
        "shisa-ai": "shisa-ai",
        sophosympatheia: "sophosympatheia",
        switchpoint: "switchpoint",
        targon: "targon",
        tencent: "tencent",
        thedrummer: "the-drummer",
        thudm: "thudm",
        tngtech: "tngtech",
        together: "together",
        ubicloud: "ubicloud",
        undi95: "undi95",

        venice: "", // Keep - custom icon
        writer: "writer",
        "x-ai": "xai",
        "z-ai": "z-ai",
    };

    return mapping;
};

const cleanupDuplicateIcons = (): void => {
    console.log("🧹 Starting cleanup of duplicate icons...\n");

    const lobeHubIcons = getLobeHubIconNames();
    const customIcons = getCustomIconNames();
    const mapping = mapCustomToLobeHub();

    console.log(`📊 Found ${lobeHubIcons.size} LobeHub icons`);
    console.log(`📊 Found ${customIcons.size} custom icons\n`);

    const iconsToRemove: string[] = [];
    const iconsToKeep: string[] = [];

    for (const customIcon of customIcons) {
        const lobeHubEquivalent = mapping[customIcon];

        if (lobeHubEquivalent && lobeHubEquivalent !== "" && lobeHubIcons.has(lobeHubEquivalent)) {
            iconsToRemove.push(customIcon);
            console.log(`🗑️  Will remove: ${customIcon} (available as ${lobeHubEquivalent} in LobeHub)`);
        } else {
            iconsToKeep.push(customIcon);
            console.log(`✅ Will keep: ${customIcon} (${lobeHubEquivalent ? "not in LobeHub" : "custom icon"})`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Icons to remove: ${iconsToRemove.length}`);
    console.log(`   • Icons to keep: ${iconsToKeep.length}`);

    if (iconsToRemove.length === 0) {
        console.log("\n✅ No duplicate icons found to remove!");

        return;
    }

    console.log("\n🗑️  Removing duplicate icons...");

    let removedCount = 0;

    for (const iconName of iconsToRemove) {
        try {
            // Try to remove both .svg and .png versions
            const svgPath = join(CUSTOM_ICONS_DIR, `${iconName}.svg`);
            const pngPath = join(CUSTOM_ICONS_DIR, `${iconName}.png`);

            try {
                unlinkSync(svgPath);
                console.log(`   ✅ Removed ${iconName}.svg`);
                removedCount++;
            } catch {
                // SVG file doesn't exist, try PNG
            }

            try {
                unlinkSync(pngPath);
                console.log(`   ✅ Removed ${iconName}.png`);
                removedCount++;
            } catch {
                // PNG file doesn't exist
            }
        } catch (error) {
            console.warn(`   ⚠️  Failed to remove ${iconName}:`, error);
        }
    }

    console.log(`\n✅ Cleanup complete! Removed ${removedCount} duplicate icon files.`);
    console.log(`📁 Kept ${iconsToKeep.length} custom icons for providers not in LobeHub.`);
};

cleanupDuplicateIcons();
