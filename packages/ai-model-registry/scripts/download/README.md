# Provider Registry Download Scripts

This directory contains scripts for downloading and transforming provider data from various sources.

## Parallel Downloads

The download script now supports parallel processing with configurable concurrency limits for significantly improved performance.

### Performance Improvements

- **Sequential (old)**: ~30-45 minutes for all providers
- **Parallel (new)**: ~5-10 minutes for all providers (3-6x faster)
- **Configurable concurrency**: Control how many providers download simultaneously

### Usage

#### Basic Parallel Download
```bash
# From the ai-model-registry package directory
pnpm run download                    # Default: 5 concurrent downloads
pnpm run download:fast              # 10 concurrent downloads
pnpm run download:slow              # 2 concurrent downloads (API-friendly)
pnpm run download:max               # 20 concurrent downloads (maximum speed)
```

#### Custom Concurrency
```bash
# Custom concurrency level
pnpm run download --concurrency 8   # 8 concurrent downloads
pnpm run download --concurrency 15  # 15 concurrent downloads
```

#### Single Provider (still parallel for internal operations)
```bash
# Download specific provider
pnpm run download --provider "OpenAI" --concurrency 3
```

### Concurrency Guidelines

- **Conservative (2-3)**: For rate-limited APIs or when being respectful to services
- **Balanced (5-10)**: Good balance of speed and API friendliness (recommended)
- **Aggressive (15-20)**: Maximum speed, but may hit rate limits

### Progress Tracking

The script now provides real-time progress updates:
```
Progress: 15/45 (33.3%) - 5 running - Elapsed: 45.2s - ETA: 90.4s
[OpenAI] Completed (16/45 - 35.6%)
```

## Helicone Pricing Enrichment

The Helicone API integration allows you to enrich existing models with pricing data from [Helicone's LLM Cost API](https://helicone.ai/api/llm-costs).

### Features

- **Automatic Pricing Enrichment**: Fetches pricing data for models that are missing cost information
- **Smart Model Matching**: Uses multiple strategies to match models with pricing data
- **Provider-Specific Filtering**: Can fetch pricing data for specific providers
- **Cost Conversion**: Automatically converts from per 1M tokens to per 1K tokens format

### Usage

#### Enrich All Providers

```bash
# From the ai-model-registry package directory
pnpm run enrich-pricing
```

#### Enrich Specific Provider

```bash
# Enrich only OpenAI models
pnpm run enrich-pricing --provider "OpenAI"
```

#### Download Helicone Data Only

```bash
# Download Helicone provider data (pricing only)
pnpm run download --provider "Helicone"
```

### How It Works

1. **Data Fetching**: The script fetches pricing data from `https://helicone.ai/api/llm-costs`
2. **Model Matching**: Uses three strategies to match models with pricing:
    - Exact provider-model match
    - Model name contains match
    - Provider match with model name similarity
3. **Cost Conversion**: Converts Helicone's per 1M tokens pricing to per 1K tokens format
4. **Enrichment**: Updates models with missing pricing data while preserving existing data

### API Response Format

The Helicone API returns data in this format:

```json
{
    "metadata": {
        "total_models": 250,
        "note": "All costs are per 1 million tokens unless otherwise specified"
    },
    "data": [
        {
            "provider": "OPENAI",
            "model": "gpt-4",
            "input_cost_per_1m": 30.0,
            "output_cost_per_1m": 60.0,
            "show_in_playground": true
        }
    ]
}
```

### Supported Providers

The Helicone API provides pricing data for many providers including:

- OpenAI
- Anthropic
- Google
- Meta
- Mistral
- Groq
- And many more...

### Output

Enriched models are saved to `data/providers-enriched/` with the same structure as the original data, but with updated pricing information.

### Error Handling

- Network timeouts (30 seconds)
- Invalid JSON responses
- Missing or malformed data
- Rate limiting (handled gracefully)

### Dependencies

- `axios` for HTTP requests
- `zod` for data validation
- Node.js file system APIs

### Notes

- Helicone only provides pricing data, not model metadata
- The enrichment process is non-destructive - existing pricing data is preserved
- Models are matched using fuzzy logic to handle naming variations
- All costs are converted from per 1M tokens to per 1K tokens for consistency
