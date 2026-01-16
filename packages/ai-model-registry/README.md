<!-- START_PACKAGE_OG_IMAGE_PLACEHOLDER -->

<a href="https://www.anolilab.com/open-source" align="center">

  <img src="__assets__/package-og.svg" alt="ai-model-registry" />

</a>

<h3 align="center">Unified registry for AI model providers and their metadata</h3>

<!-- END_PACKAGE_OG_IMAGE_PLACEHOLDER -->

<br />

<div align="center">

[![typescript-image][typescript-badge]][typescript-url]
[![apache licence][license-badge]][license]
[![npm downloads][npm-downloads-badge]][npm-downloads]
[![Chat][chat-badge]][chat]
[![PRs Welcome][prs-welcome-badge]][prs-welcome]

</div>

---

<div align="center">
    <p>
        <sup>
            Daniel Bannert's open source work is supported by the community on <a href="https://github.com/sponsors/prisis">GitHub Sponsors</a>
        </sup>
    </p>
</div>

---

## Install

```sh
npm install @anolilab/ai-model-registry
```

```sh
yarn add @anolilab/ai-model-registry
```

```sh
pnpm add @anolilab/ai-model-registry
```

## Usage

```typescript
import { getProviders, getModelsByProvider, getModelById, searchModels, getAllModels, type ProviderName } from "@anolilab/ai-model-registry";

// Get all available providers (async)
const providers = await getProviders();
console.log(providers);
// ['Anthropic', 'Google', 'Groq', 'Meta', 'OpenAI', 'DeepSeek', ...]

// Get all models from a specific provider (type-safe provider name)
const anthropicModels = await getModelsByProvider("Anthropic" as ProviderName);
console.log(`Found ${anthropicModels.length} Anthropic models`);

// Get a specific model by ID
const model = await getModelById("claude-3-opus-20240229");
if (model) {
    console.log(`Model: ${model.name}`);
    console.log(`Provider: ${model.provider}`);
    console.log(`Cost: $${model.cost.input}/1K input, $${model.cost.output}/1K output`);
    console.log(`Context: ${model.limit.context?.toLocaleString()} tokens`);
}

// Search for models with specific capabilities
const visionModels = await searchModels({ vision: true });
const reasoningModels = await searchModels({ reasoning: true });
const toolCallModels = await searchModels({ tool_call: true });

// Get all models for advanced filtering
const allModels = await getAllModels();
```

### Type-Safe Provider and Model Names

The package provides TypeScript types for provider names and model IDs:

```typescript
import type { ProviderName } from "@anolilab/ai-model-registry";
import type ModelName from "@anolilab/ai-model-registry/types/open-router";

// Type-safe provider names
const provider: ProviderName = "OpenAI"; // ✅ Valid
const invalid: ProviderName = "InvalidProvider"; // ❌ TypeScript error

// Type-safe model IDs for specific providers
const modelId: ModelName = "meta-llama/llama-3.1-8b-instruct"; // ✅ Valid
const invalidId: ModelName = "invalid-model"; // ❌ TypeScript error
```

## Features

- Unified interface to access models from multiple providers through a single API
- Full TypeScript support with Zod schema validation for type safety
- Type-safe provider names and model IDs with generated union types
- Dynamic imports for optimal code splitting and tree shaking
- Provider-specific JSON files for efficient loading
- Tree shaking support - import only what you need to minimize bundle size
- Comprehensive model information including capabilities, pricing, and limits
- Advanced search and filtering capabilities across all models
- Automatic data synchronization between models with the same ID
- Real-time pricing data integration from Helicone API (840+ models)
- Detailed provider statistics and analytics

## API Reference

### Core Functions

All functions are async and use dynamic imports for optimal code splitting.

#### `getProviders(): Promise<ProviderName[]>`

Returns an array of all available provider names.

```typescript
const providers = await getProviders();
// ['Anthropic', 'Google', 'Groq', 'Meta', 'OpenAI', ...]
```

#### `getModelsByProvider(provider: ProviderName): Promise<Model[]>`

Returns all models for a specific provider. Uses provider-specific JSON files for efficient loading.

```typescript
import type { ProviderName } from "@anolilab/ai-model-registry";

const openAIModels = await getModelsByProvider("OpenAI" as ProviderName);
const anthropicModels = await getModelsByProvider("Anthropic" as ProviderName);
```

#### `getModelById(id: string): Promise<Model | undefined>`

Returns a specific model by its ID, or `undefined` if not found.

```typescript
const gpt4 = await getModelById("gpt-4");
const claude = await getModelById("claude-3-opus-20240229");
```

#### `getAllModels(): Promise<Model[]>`

Returns all models (useful for advanced filtering and custom logic). Loads all provider files in parallel.

```typescript
const allModels = await getAllModels();
const expensiveModels = allModels.filter((model) => (model.cost.input || 0) > 0.1 || (model.cost.output || 0) > 0.1);
```

#### `getProviderStats(): Promise<Record<ProviderName, number>>`

Returns provider statistics with model counts.

```typescript
const stats = await getProviderStats();
console.log(stats);
// {
//   'OpenAI': 15,
//   'Anthropic': 8,
//   'Google': 12,
//   'Meta': 25,
//   ...
// }
```

### Advanced Search

#### `searchModels(criteria: SearchCriteria): Promise<Model[]>`

Search models by various criteria with powerful filtering options. Automatically uses provider-specific files when a provider filter is specified.

```typescript
interface SearchCriteria {
    // Capability filters
    vision?: boolean;
    reasoning?: boolean;
    tool_call?: boolean;
    streaming_supported?: boolean;
    preview?: boolean;

    // Provider filter
    provider?: ProviderName;

    // Modality filters
    modalities?: {
        input?: string[];
        output?: string[];
    };

    // Context window filters
    context_min?: number;
    context_max?: number;

    // Cost filters
    max_input_cost?: number;
    max_output_cost?: number;
}
```

#### Search Examples

```typescript
// Find all vision-capable models
const visionModels = await searchModels({ vision: true });

// Find models with reasoning capabilities
const reasoningModels = await searchModels({ reasoning: true });

// Find models that support tool calling
const toolCallModels = await searchModels({ tool_call: true });

// Find models from a specific provider (uses provider-specific file)
const openAIModels = await searchModels({ provider: "OpenAI" as ProviderName });

// Find models with large context windows
const largeContextModels = await searchModels({ context_min: 100000 });

// Find models that accept text and image input
const multimodalModels = await searchModels({
    modalities: {
        input: ["text", "image"],
    },
});

// Find models with streaming support
const streamingModels = await searchModels({ streaming_supported: true });

// Find preview/beta models
const previewModels = await searchModels({ preview: true });
```

## Model Schema

Each model follows a comprehensive schema with the following structure:

```typescript
interface Model {
    // Core identification
    id: string;
    name: string | null;
    provider?: string;
    providerId?: string;

    // Provider metadata
    providerEnv?: string[];
    providerNpm?: string;
    providerDoc?: string;
    providerModelsDevId?: string;

    // Date information
    releaseDate?: string | null;
    lastUpdated?: string | null;
    launchDate?: string;
    trainingCutoff?: string | null;

    // Capabilities
    attachment: boolean;
    reasoning: boolean;
    temperature: boolean;
    toolCall: boolean;
    openWeights: boolean;
    vision?: boolean;
    extendedThinking?: boolean;
    preview?: boolean;

    // Knowledge and context
    knowledge?: string | null;

    // Pricing structure
    cost: {
        input: number | null; // per 1K tokens (see metadata.pricingUnit)
        output: number | null; // per 1K tokens (see metadata.pricingUnit)
        inputCacheHit: number | null; // cache hit pricing
        imageGeneration?: number | null;
        imageGenerationUltra?: number | null;
        videoGeneration?: number | null;
        videoGenerationWithAudio?: number | null;
        videoGenerationWithoutAudio?: number | null;
    };
```

### JSON File Structure

Provider-specific JSON files include metadata about the pricing unit:

```typescript
interface ProviderJsonFile {
    metadata: {
        description: string;
        lastUpdated: string;
        pricingUnit: "1K"; // Cost values are stored as "per 1K tokens" (per 1000 tokens)
        provider: string;
        totalModels: number;
        version: string;
    };
    models: Model[];
}
```

**Important:** All cost values in the `cost` object are stored according to the `metadata.pricingUnit` field. Currently, all providers use `"1K"` (per 1000 tokens), meaning:

- `cost.input: 0.4` means $0.40 per 1,000 input tokens
- `cost.output: 1.2` means $1.20 per 1,000 output tokens

This metadata field makes the pricing unit explicit and helps prevent confusion when working with the data.

    // Limits
    limit: {
        context: number | null; // max tokens
        output: number | null; // max tokens
    };

    // Modalities
    modalities: {
        input: string[]; // ['text', 'image', 'audio', ...]
        output: string[]; // ['text', 'image', 'audio', ...]
    };

    // Infrastructure
    regions?: string[];
    streamingSupported?: boolean | null;
    deploymentType?: string;
    version?: string | null;

    // Provider-specific capabilities
    cacheRead?: boolean;
    codeExecution?: boolean;
    searchGrounding?: boolean;
    structuredOutputs?: boolean;
    batchMode?: boolean;
    audioGeneration?: boolean;
    imageGeneration?: boolean;
    compoundSystem?: boolean;

    // Version management
    versions?: {
        stable?: string | null;
        preview?: string | null;
    };

    // Additional metadata
    description?: string;
    ownedBy?: string;
    originalModelId?: string;
    providerStatus?: string;
    supportsTools?: boolean;
    supportsStructuredOutput?: boolean;

}

````

## Tree Shaking and Code Splitting

The package supports tree shaking and uses dynamic imports for optimal code splitting:

```typescript
// Only import specific functions
import { getProviders, getModelById, type ProviderName } from "@anolilab/ai-model-registry";

// Import schema for validation
import { ModelSchema } from "@anolilab/ai-model-registry/schema";

// Import icons (if needed)
import { getIcon } from "@anolilab/ai-model-registry/icons";

// Import provider-specific model ID types
import type ModelName from "@anolilab/ai-model-registry/types/open-router";
import type { ProviderName } from "@anolilab/ai-model-registry/types/providers";
````

### Dynamic Loading

The package uses dynamic imports to load provider-specific JSON files on demand:

- **Single provider queries**: Only loads the specific provider's JSON file
- **All models queries**: Loads all provider files in parallel
- **Automatic caching**: Results are cached to avoid re-loading
- **Better code splitting**: Bundlers can split provider files into separate chunks

## Icons

The package provides icon utilities for displaying provider icons. Icons can be either SVG (using sprite sheets) or base64 encoded images.

### Basic Usage

```typescript
import { getIcon, isSvgIcon, spriteSheet } from "@anolilab/ai-model-registry/icons";

// Get icon data for a provider
const providerIcon = "openai"; // or any provider icon identifier
const iconData = getIcon(providerIcon);

if (iconData) {
    if (isSvgIcon(providerIcon)) {
        // SVG icon - use with sprite sheet
        // First, inject the sprite sheet into your DOM (see example below)
        // Then use: <svg><use href={iconData} /></svg>
    } else {
        // Base64 icon - use directly as image source
        // <img src={iconData} alt="Provider icon" />
    }
}
```

### React Example

Here's a complete React component example:

```typescript
import { getIcon, isSvgIcon, spriteSheet } from "@anolilab/ai-model-registry/icons";
import React from "react";

interface ProviderIconProps {
    className?: string;
    provider: string;
    providerIcon: string | null;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
    className = "w-5 h-5", 
    provider, 
    providerIcon 
}) => {
    if (!providerIcon) {
        return (
            <div className={`${className} bg-muted flex items-center justify-center rounded`}>
                <span className="text-muted-foreground text-xs font-medium">
                    {provider.slice(0, 2).toUpperCase()}
                </span>
            </div>
        );
    }

    // Get the icon data from the provider registry
    const iconData = getIcon(providerIcon);

    if (iconData) {
        // Check if it's an SVG icon or base64 icon
        if (isSvgIcon(providerIcon)) {
            return (
                <div className={`${className} flex items-center justify-center overflow-hidden rounded bg-white/50 p-0.5`}>
                    <svg className="h-full w-full">
                        <use href={iconData} />
                    </svg>
                </div>
            );
        }

        // Base64 icon - use img tag
        return (
            <div className={`${className} flex items-center justify-center overflow-hidden rounded bg-white/50 p-0.5`}>
                <img alt={provider} className="h-full w-full object-contain" src={iconData} />
            </div>
        );
    }

    // Fallback to text if no icon is found
    return (
        <div className={`${className} bg-muted flex items-center justify-center rounded`}>
            <span className="text-muted-foreground text-xs font-medium">
                {providerIcon.toUpperCase().slice(0, 2)}
            </span>
        </div>
    );
};

// Component to inject the sprite sheet into the DOM (required for SVG icons)
export const IconSpriteSheet: React.FC = () => {
    React.useEffect(() => {
        // Inject the sprite sheet into the DOM if it doesn't exist
        if (!document.getElementById("icon-sprite-sheet")) {
            const spriteElement = document.createElement("div");
            spriteElement.id = "icon-sprite-sheet";
            spriteElement.innerHTML = spriteSheet;
            spriteElement.style.display = "none";
            document.body.appendChild(spriteElement);
        }
    }, []);

    return null;
};
```

**Important:** For SVG icons to work, you must inject the sprite sheet into your DOM. Include the `IconSpriteSheet` component once in your app (e.g., in your root component).

### API Reference

#### `getIcon(iconId: string): string | undefined`

Returns the icon data for a given icon identifier. Returns `undefined` if the icon is not found.

- For SVG icons: Returns a fragment identifier (e.g., `#icon-openai`) to use with `<use href="...">`
- For base64 icons: Returns the base64 data URL directly

#### `isSvgIcon(iconId: string): boolean`

Checks if an icon identifier corresponds to an SVG icon (requires sprite sheet) or a base64 image.

#### `spriteSheet: string`

The SVG sprite sheet HTML string that contains all SVG icons. Must be injected into the DOM for SVG icons to work.

## Supported Providers

The registry includes models from 50+ providers:

### Major Providers

- OpenAI (GPT-4, GPT-3.5, O1, O3, etc.)
- Anthropic (Claude 3.5, Claude 3, Claude 2.1, etc.)
- Google (Gemini 2.5, Gemini 1.5, PaLM, etc.)
- Meta (Llama 3, Llama 2, Code Llama, etc.)
- Groq (Various models with ultra-fast inference)
- DeepSeek (DeepSeek R1, DeepSeek V3, etc.)

### Specialized Providers

- Mistral AI (Mistral Large, Mixtral, etc.)
- Cohere (Command R, Command A, etc.)
- Perplexity (Sonar, Sonar Pro, etc.)
- Together AI (Various open models)
- Fireworks AI (Various models)
- Vercel (v0 models)

### Open Source & Research

- HuggingFace (Various hosted models)
- ModelScope (Chinese models)
- OpenRouter (Aggregated models)
- GitHub Copilot (Code models)
- Azure (OpenAI models)

And many more...

## Pricing Data Integration

This package automatically includes real-time pricing data from [Helicone's LLM Cost API](https://helicone.ai/api/llm-costs) during the aggregation process.

### Features

- Automatic enrichment: Pricing data is automatically added during aggregation
- Smart matching: Uses multiple strategies to match models with pricing data
- Non-destructive: Preserves existing pricing data while filling in missing values
- Cost conversion: Automatically converts from per 1M tokens to per 1K tokens format
- 840+ models: Covers pricing for 840+ models across all major providers

### Supported Pricing Providers

Helicone provides pricing data for models from:

- OpenAI (GPT-4, GPT-3.5, O1, O3, etc.)
- Anthropic (Claude models)
- Google (Gemini models)
- Meta (Llama models)
- Mistral (Mistral models)
- Groq (Various models)
- And many more...

## Model Data Synchronization

The provider registry includes a powerful data synchronization system that automatically merges missing data between models with the same ID across different providers.

### How It Works

1. Groups models by ID: Finds all models with the same ID across different providers
2. Calculates completeness scores: Evaluates how complete each model's data is (excluding cost fields)
3. Uses the most complete model as base: Selects the model with the highest data completeness
4. Merges missing data: Fills in missing fields from other models with the same ID
5. Preserves cost data: Never overwrites existing cost information

### Protected Fields

The following cost-related fields are never synchronized to preserve pricing accuracy:

- `cost` (entire cost object)
- `input` (input cost)
- `output` (output cost)
- `inputCacheHit` (cache hit pricing)
- `imageGeneration` (image generation pricing)
- `videoGeneration` (video generation pricing)

### Example

If you have the same model (e.g., `gpt-4`) from multiple providers:

**OpenAI Provider:**

```json
{
    "id": "gpt-4",
    "name": "GPT-4",
    "cost": { "input": 0.03, "output": 0.06 },
    "description": null,
    "releaseDate": "2023-03-14"
}
```

**Azure Provider:**

```json
{
    "id": "gpt-4",
    "name": null,
    "cost": { "input": 0.03, "output": 0.06 },
    "description": "GPT-4 is a large multimodal model",
    "releaseDate": null
}
```

**Result after synchronization:**

```json
{
    "id": "gpt-4",
    "name": "GPT-4",
    "cost": { "input": 0.03, "output": 0.06 },
    "description": "GPT-4 is a large multimodal model",
    "releaseDate": "2023-03-14"
}
```

## Development

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/anolilab/ai-models.git
cd ai-models

# Install dependencies
pnpm install

# Complete build process
pnpm run download    # Download provider data
pnpm run aggregate   # Aggregate and enrich data
pnpm run generate-icons  # Generate provider icons
pnpm run build       # Build the package

# Run tests
pnpm test
```

### Build Process

The complete build process involves several steps to download, aggregate, and generate all necessary data:

```bash
# 1. Download provider data
pnpm run download

# 2. Aggregate and enrich provider data (includes pricing from Helicone API)
pnpm run aggregate

# 3. Generate provider icons
pnpm run generate-icons

# 4. Build the package
pnpm run build
```

#### What Each Step Does

1. **Download (`pnpm run download`)**: Downloads model data from various AI providers using transformers in `scripts/download/transformers/`. This creates the raw provider data in `data/providers/`.

2. **Aggregate (`pnpm run aggregate`)**:
    - Reads all provider data from `data/providers/`
    - Fetches pricing data from Helicone API
    - Enriches models with icon information
    - Synchronizes data between models with the same ID
    - Generates `public/api.json` (main API file)
    - Generates `public/{provider-name}.json` (provider-specific files)
    - Generates `public/providers.json` (provider index)
    - Generates `src/types/providers.ts` (ProviderName type)
    - Generates `src/types/{provider-name}.ts` (ModelName types per provider)

3. **Generate Icons (`pnpm run generate-icons`)**:
    - Creates SVG sprite sheet from LobeHub icons and custom icons
    - Generates `src/icons-sprite.ts` with icon mappings
    - Provides fallback icons for providers without official icons

4. **Build (`pnpm run build`)**:
    - Compiles TypeScript to JavaScript
    - Generates type definitions
    - Creates the final distributable package

### Available Scripts

```bash
# Download provider data from various sources
pnpm run download

# Download data for a specific provider
pnpm run download --provider openai
pnpm run download --provider anthropic

# Aggregate provider data (includes pricing enrichment and synchronization)
pnpm run aggregate

# Generate provider icons
pnpm run generate-icons

# Build the package
pnpm run build

# Build for production
pnpm run build:prod

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Lint code
pnpm run lint:eslint

# Type check
pnpm run lint:types
```

### Project Structure

```
packages/ai-model-registry/
├── src/
│   ├── index.ts          # Main exports (async functions)
│   ├── schema.ts         # Model schema definitions
│   ├── icons-sprite.ts   # Generated icon sprite
│   └── types/            # Generated TypeScript types
│       ├── providers.ts  # ProviderName type
│       ├── open-router.ts  # ModelName type for OpenRouter
│       ├── open-ai.ts    # ModelName type for OpenAI
│       └── ...           # Other provider model types
├── scripts/
│   ├── aggregate-providers.ts    # Data aggregation script
│   ├── generate-svg-sprite.ts    # Icon generation
│   └── download/                 # Provider data downloaders
├── public/               # Generated JSON files
│   ├── api.json          # Main API file (all models)
│   ├── providers.json    # Provider index
│   ├── open-router.json  # Provider-specific models
│   ├── open-ai.json      # Provider-specific models
│   └── ...               # Other provider files
├── data/
│   └── providers/        # Raw provider data
└── assets/
    └── icons/            # Provider icons
```

## Supported Node.js Versions

Libraries in this ecosystem make the best effort to track [Node.js' release schedule](https://nodejs.org/en/about/releases/). Here's [a post on why we think this is important](https://medium.com/the-node-js-collection/maintainers-should-consider-following-node-js-release-schedule-ab08ed4de71a).

## Contributing

If you would like to help take a look at the [list of issues](https://github.com/anolilab/ai-models/issues) and check our [Contributing](.github/CONTRIBUTING.md) guide.

> **Note:** please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

### Adding New Providers

1. Create a transformer in `scripts/download/transformers/`
2. Add provider configuration to `scripts/config.ts`
3. Run `pnpm run download --provider <provider-name>`
4. Test with `pnpm run aggregate`

### Reporting Issues

Please use our [Issue Tracker](https://github.com/anolilab/ai-models/issues) to report bugs or request features.

## Credits

- [Daniel Bannert](https://github.com/prisis)
- [All Contributors](https://github.com/anolilab/ai-models/graphs/contributors)

## Made with ❤️ at Anolilab

This is an open source project and will always remain free to use. If you think it's cool, please star it 🌟. [Anolilab](https://www.anolilab.com/open-source) is a Development and AI Studio. Contact us at [hello@anolilab.com](mailto:hello@anolilab.com) if you need any help with these technologies or just want to say hi!

## License

The anolilab ai-model-registry is open-sourced software licensed under the [Apache License 2.0][license-url]

<!-- badges -->

[license-badge]: https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge
[license]: https://github.com/anolilab/ai-models/blob/main/packages/ai-model-registry/LICENSE.md
[npm-downloads-badge]: https://img.shields.io/npm/dm/@anolilab/ai-model-registry?style=for-the-badge
[npm-downloads]: https://www.npmjs.com/package/@anolilab/ai-model-registry
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[prs-welcome]: https://github.com/anolilab/ai-models/blob/main/.github/CONTRIBUTING.md
[chat-badge]: https://img.shields.io/discord/902465130518949899.svg?style=for-the-badge
[chat]: https://discord.gg/TtFJY8xkFK
[typescript-badge]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: https://www.typescriptlang.org/
[license-url]: LICENSE.md
