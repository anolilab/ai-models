# Provider Registry Download Scripts

This directory contains TypeScript scripts for downloading and transforming AI model data from various providers into a normalized format.

## Overview

The download system consists of:

- **Main script** (`index.ts`) - Orchestrates the download process
- **Configuration** (`config.json`) - Defines which providers to process
- **Transformers** (`transformers/`) - Provider-specific data transformation logic

## Architecture

### Main Script (`index.ts`)

The main script provides:

- Command-line argument parsing
- Configuration validation
- Provider processing orchestration
- Error handling and reporting
- Model validation using Zod schema

### Transformers

Each transformer is responsible for:

1. **Fetching** raw data from a provider's API or documentation
2. **Transforming** the data into the normalized `Model` schema
3. **Exporting** a `fetch<Provider>Models()` function

## Usage

### Basic Usage

```bash
# Process all providers
node index.ts

# Process a specific provider
node index.ts --provider "Anthropic"

# Use a custom config file
node index.ts --config ./custom-config.json

# Show help
node index.ts --help
```

### Configuration

The `config.json` file defines which providers to process:

```json
{
  "providers": [
    {
      "name": "Anthropic",
      "transformer": "./transformers/anthropic.ts",
      "output": "anthropic"
    }
  ]
}
```

## TypeScript Features

### Type Safety

All scripts use TypeScript with:

- **Strict type checking** - All variables and functions are properly typed
- **Interface definitions** - Clear contracts for data structures
- **Generic types** - Reusable type-safe utilities
- **Zod validation** - Runtime type validation for the Model schema

### JSDoc Documentation

All functions include comprehensive JSDoc documentation:

```typescript
/**
 * Transforms model data from provider format to normalized structure.
 * 
 * @param rawData - The raw data from the provider
 * @returns Array of normalized model objects
 * @example
 * const models = transformData(rawData);
 */
function transformData(rawData: RawData): Model[] {
  // Implementation
}
```

### Error Handling

Robust error handling with:

- **Type-safe error messages** - Using `instanceof Error` checks
- **Graceful degradation** - Individual provider failures don't stop the entire process
- **Detailed logging** - Clear error messages with context
- **Validation errors** - Zod schema validation with detailed issue reporting

## Provider Transformers

### Completed Transformers

- **Anthropic** (`anthropic.ts`) - Full implementation with HTML parsing
- **OpenRouter** (`openrouter.ts`) - API-based with type-safe data extraction
- **Vercel** (`vercel.ts`) - API-based with proper error handling
- **Bedrock** (`bedrock.ts`) - HTML parsing with comprehensive data extraction
- **Llama** (`llama.ts`) - Puppeteer-based with real-time data fetching
- **DeepSeek** (`deepseek.ts`) - Complex HTML parsing with pricing extraction
- **GitHub Copilot** (`github-copilot.ts`) - Table parsing with model information

### Placeholder Transformers

The following transformers have TypeScript structure but need full implementation:

- **Azure OpenAI** (`azure.ts`) - Complex HTML parsing required
- **Google** (`google.ts`) - Extensive pricing and capability parsing
- **Groq** (`groq.ts`) - Multi-page data extraction needed
- **HuggingFace** (`huggingface.ts`) - API-based with complex model analysis

## Data Schema

All transformers output data conforming to the `Model` schema defined in `../../../src/schema.ts`:

```typescript
interface Model {
  id: string;
  name: string | null;
  releaseDate: string | null;
  lastUpdated: string | null;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  knowledge: string | null;
  toolCall: boolean;
  openWeights: boolean;
  cost: {
    input: number | null;
    output: number | null;
    inputCacheHit: number | null;
  };
  limit: {
    context: number | null;
    output: number | null;
  };
  modalities: {
    input: string[];
    output: string[];
  };
  provider: string;
  // ... additional optional fields
}
```

## Development

### Adding a New Provider

1. Create a new transformer file in `transformers/`
2. Implement the `fetch<Provider>Models()` function
3. Add proper TypeScript types and JSDoc documentation
4. Add the provider to `config.json`
5. Test with `node index.ts --provider "ProviderName"`

### Testing

```bash
# Test a specific provider
node index.ts --provider "Anthropic"

# Test with custom config
node index.ts --config ./test-config.json

# Check for TypeScript errors
npx tsc --noEmit
```

### Error Handling

The system provides comprehensive error handling:

- **Network errors** - Retry logic and graceful fallbacks
- **Parsing errors** - Detailed error messages with context
- **Validation errors** - Zod schema validation with issue details
- **Configuration errors** - Clear error messages for invalid config

## Dependencies

- **axios** - HTTP requests
- **cheerio** - HTML parsing
- **puppeteer** - Browser automation (for Llama)
- **zod** - Runtime type validation

## Output

Processed models are saved to `../../data/providers/{provider}/{model-id}.json` with the normalized structure. 