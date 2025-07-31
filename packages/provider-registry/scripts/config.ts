/**
 * Configuration file for provider registry aggregation
 */

/**
 * Interface for provider configuration
 */
export interface ProviderConfig {
  name: string;
  transformer: string;
  output: string;
}

/**
 * Maps provider names to their corresponding icon files
 * Uses lowercase provider names for consistency
 */
export const PROVIDER_ICON_MAP: Record<string, string> = {
  // Primary providers with specific icons
  'anthropic': 'anthropic.svg',
  'azure': 'azure.svg',
  'azure-open-ai': 'azure.svg',
  'amazon': 'amazon.svg',
  'amazon-bedrock': 'amazon-bedrock.svg',
  'claude': 'claude.svg',
  'deepseek': 'deepseek.svg',
  'deep-seek': 'deepseek.svg',
  'fireworks': 'fireworks.svg',
  'fireworks-ai': 'fireworks.svg',
  'google': 'google.svg',
  'github': 'github.svg',
  'github copilot': 'githubcopilot.svg',
  'git-hub-copilot': 'githubcopilot.svg',
  'grok': 'grok.svg',
  'groq': 'groq.svg',
  'huggingface': 'huggingface.svg',
  'hugging-face': 'huggingface.svg',
  'inference': 'inference.svg',
  'meta': 'meta.svg',
  'meta-llama': 'meta.svg',
  'mistral': 'mistral.svg',
  'mistralai': 'mistral.svg',
  'mistral ai': 'mistral.svg',
  'morph': 'morph.svg',
  'ollama': 'ollama.svg',
  'openai': 'openai.svg',
  'openrouter': 'openrouter.svg',
  'open-router': 'openrouter.svg',
  'requesty': 'requesty.svg',
  'upstage': 'upstage.svg',
  'v0': 'v0.svg',
  'venice': 'v0.svg',
  'vercel': 'vercel.svg',
  'vertexai': 'vertexai.svg',
  
  'cohere': 'cohere.png',
  'microsoft': 'azure.svg',
  'stability ai': 'stability-ai.png',
  'perplexity': 'perplexity.png',
  'together': 'together.svg',
  'nvidia': 'nvidia.jpg',
  'inflection': 'inflection.svg',
  'x-ai': 'x-ai.png',
  'xai': 'x-ai.png',
  'writer': 'writer.png',
  'luma': 'luma.svg',
  'rekaai': 'rekaai.jpg',
  'sambanova': 'sambanova.png',
  'cerebras': 'cerebras.png',
  'eleutherai': 'eleutherai.png',
  'featherless': 'featherless.svg',
  'featherless-ai': 'featherless.svg',
  'hyperbolic': 'hyperbolic.png',
  'infermatic': 'infermatic.png',
  'liquid': 'liquid.png',
  'minimax': 'minimax.png',
  'nebius': 'nebius.png',
  'nousresearch': 'nousresearch.png',
  'novita': 'novita.png',
  'nscale': 'nscale.png',
  'opengvlab': 'opengvlab.png',
  'qwen': 'qwen.png',
  'sarvamai': 'sarvamai.png',
  'tencent': 'tencent.png',
  'aion-labs': 'aion-labs.png',
  'arcee-ai': 'arcee-ai.png',
  'baidu': 'baidu.ico',
  'z-ai': 'z-ai.svg',
  'zai': 'z-ai.svg',
  
  // Providers with newly downloaded icons
  'moonshotai': 'moonshotai.png',
  'inception': 'inception.png',
  'mancer': 'mancer.png',
  'miatral': '',
  'neversleep': 'neversleep.png',
  'nothingiisreal': 'nothingiisreal.png',
  'pygmalionai': 'pygmalionai.png',
  'raifle': 'raifle.png',
  'sao10k': 'sao10k.png',
  'scb10x': 'scb10x.png',
  'shisa-ai': 'shisa-ai.png',
  'sophosympatheia': 'sophosympatheia.png',
  'switchpoint': 'switchpoint.png',
  'thedrummer': 'thedrummer.png',
  'thudm': 'thudm.png',
  'tngtech': 'tngtech.png',
  'undi95': 'undi95.png',
  'agentica-org': 'agentica-org.png',
  'alfredpros': 'alfredpros.png',
  'alibaba': 'alibaba.png',
  'alpindale': 'alpindale.png',
  'anthracite-org': 'anthracite-org.png',
  'arliai': 'arliai.png',
  'bytedance': 'bytedance.png',
  'cognitivecomputations': 'cognitivecomputations.png',
  'gryphe': 'gryphe.png',
  
  // Additional providers with downloaded icons
  'aionlabs': 'aionlabs.png',
  'avian': 'avian.png',
  'atlascloud': 'atlascloud.png',
  'atoma': 'atoma.png',
  'chutes': 'chutes.png',
  'cloudflare': 'cloudflare.png',
  'crusoe': 'crusoe.png',
  'deepinfra': 'deepinfra.webp',
  'enfer': 'enfer.png',
  'friendli': 'friendli.png',
  'gmicloud': 'gmicloud.png',
  'inferencenet': 'inferencenet.png',
  'kluster': 'kluster.png',
  'lambda': 'lambda.png',
  'nineteen': 'nineteen.png',
  'ncompass': 'ncompass.png',
  'openinference': 'openinference.png',
  'parasail': 'parasail.png',
  'phala': 'phala.png',
  'targon': 'targon.png',
  'ubicloud': 'ubicloud.png',
};

/**
 * Maps directory names to proper brand names
 */
export const BRAND_NAME_MAP: Record<string, string> = {
  'groq': 'Groq',
  'amazon-bedrock': 'Amazon Bedrock',
  'anthropic': 'Anthropic',
  'azure': 'Azure OpenAI',
  'deepseek': 'DeepSeek',
  'github-copilot': 'GitHub Copilot',
  'google': 'Google',
  'huggingface': 'Hugging Face',
  'llama': 'Meta',
  'openrouter': 'OpenRouter',
  'vercel': 'Vercel',
};

/**
 * Provider configurations for downloading and transforming provider data
 */
export const PROVIDERS_CONFIG: ProviderConfig[] = [
  {
    name: "OpenRouter",
    transformer: "./transformers/openrouter.ts",
    output: "openrouter"
  },
  {
    name: "VercelGateway", 
    transformer: "./transformers/vercel.ts",
    output: "vercel"
  },
  {
    name: "Amazon Bedrock",
    transformer: "./transformers/bedrock.ts", 
    output: "amazon-bedrock"
  },
  {
    name: "Anthropic",
    transformer: "./transformers/anthropic.ts",
    output: "anthropic"
  },
  {
    name: "Azure OpenAI",
    transformer: "./transformers/azure.ts",
    output: "azure"
  },
  {
    name: "DeepSeek",
    transformer: "./transformers/deepseek.ts",
    output: "deepseek"
  },
  {
    name: "GitHub Copilot",
    transformer: "./transformers/github-copilot.ts",
    output: "github-copilot"
  },
  {
    name: "Google",
    transformer: "./transformers/google.ts",
    output: "google"
  },
  {
    name: "Groq",
    transformer: "./transformers/groq.ts",
    output: "groq"
  },
  {
    name: "Hugging Face",
    transformer: "./transformers/huggingface.ts",
    output: "huggingface"
  },
  {
    name: "Llama",
    transformer: "./transformers/llama.ts",
    output: "llama"
  }
]; 