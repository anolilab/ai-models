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
  env?: string[]; // Environment variables required
  npm?: string; // NPM package name
  doc?: string; // Documentation URL
  modelsDevId?: string; // ID from models.dev API
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
  'groq': 'groq.png',
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
  'open-ai': 'openai.svg',
  'openrouter': 'openrouter.svg',
  'open-router': 'openrouter.svg',
  'requesty': 'requesty.svg',
  'upstage': 'upstage.svg',
  'v0': 'v0.svg',
  'venice': 'venice.png',
  'vercel': 'vercel.svg',
  'vertexai': 'vertexai.svg',
  
  'cohere': 'cohere.png',
  'microsoft': 'azure.svg',
  'stability ai': 'stability-ai.png',
  'perplexity': 'perplexity.png',
  'together': 'together.svg',
  'togetherai': 'together.png',
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
  'modelscope': 'model-scope.svg',
  'deep-infra': 'deepinfra.webp',
  'google-vertex': 'google-ai-studio.svg',
  'google-vertex-anthropic': 'google-ai-studio.svg',
  'together-ai': 'together.png',
  'git-hub-models': 'github.svg',
  
  // Providers with newly downloaded icons
  'moonshotai': 'moonshotai.png',
  'moonshot-ai': 'moonshotai.png',
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
  'openai': 'OpenAI',
  'deepinfra': 'Deep Infra',
  // New providers from models.dev API
  'alibaba': 'Alibaba',
  'fireworks-ai': 'Fireworks AI',
  'github-models': 'GitHub Models',
  'google-vertex': 'Google Vertex',
  'google-vertex-anthropic': 'Google Vertex Anthropic',
  'inference': 'Inference',
  'mistral': 'Mistral',
  'morph': 'Morph',
  'requesty': 'Requesty',
  'togetherai': 'Together AI',
  'upstage': 'Upstage',
  'v0': 'V0',
  'venice': 'Venice',
  'xai': 'XAI',
  'modelscope': 'ModelScope',
};

/**
 * Provider configurations for downloading and transforming provider data
 * Updated with information from models.dev API
 */
export const PROVIDERS_CONFIG: ProviderConfig[] = [
  {
    name: "OpenRouter",
    transformer: "./transformers/openrouter.ts",
    output: "openrouter",
    env: ["OPENROUTER_API_KEY"],
    npm: "@ai-sdk/openrouter",
    doc: "https://openrouter.ai/docs",
    modelsDevId: "openrouter"
  },
  {
    name: "VercelGateway", 
    transformer: "./transformers/vercel.ts",
    output: "vercel",
    env: ["VERCEL_AI_API_KEY"],
    npm: "@ai-sdk/vercel",
    doc: "https://sdk.vercel.ai/docs",
    modelsDevId: "vercel"
  },
  {
    name: "Amazon Bedrock",
    transformer: "./transformers/bedrock.ts", 
    output: "amazon-bedrock",
    env: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
    npm: "@ai-sdk/aws-bedrock",
    doc: "https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html",
    modelsDevId: "amazon-bedrock"
  },
  {
    name: "Anthropic",
    transformer: "./transformers/anthropic.ts",
    output: "anthropic",
    env: ["ANTHROPIC_API_KEY"],
    npm: "@ai-sdk/anthropic",
    doc: "https://docs.anthropic.com/en/docs/about-claude/models",
    modelsDevId: "anthropic"
  },
  {
    name: "Azure OpenAI",
    transformer: "./transformers/azure.ts",
    output: "azure",
    env: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"],
    npm: "@ai-sdk/azure-openai",
    doc: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models",
    modelsDevId: "azure-openai"
  },
  {
    name: "DeepSeek",
    transformer: "./transformers/deepseek.ts",
    output: "deepseek",
    env: ["DEEPSEEK_API_KEY"],
    npm: "@ai-sdk/deepseek",
    doc: "https://api-docs.deepseek.com/quick_start/pricing",
    modelsDevId: "deepseek"
  },
  {
    name: "GitHub Copilot",
    transformer: "./transformers/github-copilot.ts",
    output: "github-copilot",
    env: ["GITHUB_TOKEN"],
    npm: "@ai-sdk/github-copilot",
    doc: "https://docs.github.com/en/copilot/reference/ai-models/supported-models",
    modelsDevId: "github-copilot"
  },
  {
    name: "Google",
    transformer: "./transformers/google.ts",
    output: "google",
    env: ["GOOGLE_API_KEY"],
    npm: "@ai-sdk/google",
    doc: "https://ai.google.dev/models",
    modelsDevId: "google"
  },
  {
    name: "Groq",
    transformer: "./transformers/groq.ts",
    output: "groq",
    env: ["GROQ_API_KEY"],
    npm: "@ai-sdk/groq",
    doc: "https://console.groq.com/docs/models",
    modelsDevId: "groq"
  },
  {
    name: "Hugging Face",
    transformer: "./transformers/huggingface.ts",
    output: "huggingface",
    env: ["HUGGINGFACE_API_KEY"],
    npm: "@ai-sdk/huggingface",
    doc: "https://huggingface.co/docs/api-inference",
    modelsDevId: "huggingface"
  },
  {
    name: "Llama",
    transformer: "./transformers/llama.ts",
    output: "llama",
    env: ["META_API_KEY"],
    npm: "@ai-sdk/meta",
    doc: "https://llama.meta.com/llama/",
    modelsDevId: "meta"
  },
  // New providers from models.dev API
  {
    name: "OpenAI",
    transformer: "./transformers/openai.ts",
    output: "openai",
    env: ["OPENAI_API_KEY"],
    npm: "@ai-sdk/openai",
    doc: "https://platform.openai.com/docs/models",
    modelsDevId: "openai"
  },
  {
    name: "Deep Infra",
    transformer: "./transformers/deepinfra.ts",
    output: "deepinfra",
    env: ["DEEPINFRA_API_KEY"],
    npm: "@ai-sdk/deepinfra",
    doc: "https://deepinfra.com/models",
    modelsDevId: "deepinfra"
  },
  // Additional missing providers from models.dev API
  {
    name: "Alibaba",
    transformer: "./transformers/alibaba.ts",
    output: "alibaba",
    env: ["ALIBABA_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    doc: "https://help.aliyun.com/zh/dashscope/developer-reference/api-details",
    modelsDevId: "alibaba"
  },
  {
    name: "Fireworks AI",
    transformer: "./transformers/fireworks-ai.ts",
    output: "fireworks-ai",
    env: ["FIREWORKS_API_KEY"],
    npm: "@ai-sdk/fireworks",
    doc: "https://readme.fireworks.ai/",
    modelsDevId: "fireworks-ai"
  },
  {
    name: "GitHub Models",
    transformer: "./transformers/github-models.ts",
    output: "github-models",
    env: ["GITHUB_TOKEN"],
    npm: "@ai-sdk/openai-compatible",
    doc: "https://docs.github.com/en/github-models",
    modelsDevId: "github-models"
  },
  {
    name: "Google Vertex",
    transformer: "./transformers/google-vertex.ts",
    output: "google-vertex",
    env: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
    npm: "@ai-sdk/google-vertex",
    doc: "https://cloud.google.com/vertex-ai/docs/generative-ai",
    modelsDevId: "google-vertex"
  },
  {
    name: "Google Vertex Anthropic",
    transformer: "./transformers/google-vertex-anthropic.ts",
    output: "google-vertex-anthropic",
    env: ["GOOGLE_VERTEX_PROJECT", "GOOGLE_VERTEX_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"],
    npm: "@ai-sdk/google-vertex/anthropic",
    doc: "https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude",
    modelsDevId: "google-vertex-anthropic"
  },
  {
    name: "Inference",
    transformer: "./transformers/inference.ts",
    output: "inference",
    env: ["INFERENCE_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    doc: "https://inference.net/models",
    modelsDevId: "inference"
  },
  {
    name: "Mistral",
    transformer: "./transformers/mistral.ts",
    output: "mistral",
    env: ["MISTRAL_API_KEY"],
    npm: "@ai-sdk/mistral",
    doc: "https://docs.mistral.ai/getting-started/models/",
    modelsDevId: "mistral"
  },
  {
    name: "Morph",
    transformer: "./transformers/morph.ts",
    output: "morph",
    env: ["MORPH_API_KEY"],
    npm: "@ai-sdk/morph",
    doc: "https://docs.morph.ai/",
    modelsDevId: "morph"
  },
  {
    name: "Requesty",
    transformer: "./transformers/requesty.ts",
    output: "requesty",
    env: ["REQUESTY_API_KEY"],
    npm: "@requesty/ai-sdk",
    doc: "https://requesty.ai/solution/llm-routing/models",
    modelsDevId: "requesty"
  },
  {
    name: "Together AI",
    transformer: "./transformers/togetherai.ts",
    output: "togetherai",
    env: ["TOGETHER_API_KEY"],
    npm: "@ai-sdk/togetherai",
    doc: "https://docs.together.ai/docs/serverless-models",
    modelsDevId: "togetherai"
  },
  {
    name: "Upstage",
    transformer: "./transformers/upstage.ts",
    output: "upstage",
    env: ["UPSTAGE_API_KEY"],
    npm: "@ai-sdk/upstage",
    doc: "https://docs.upstage.ai/",
    modelsDevId: "upstage"
  },
  {
    name: "V0",
    transformer: "./transformers/v0.ts",
    output: "v0",
    env: ["V0_API_KEY"],
    npm: "@ai-sdk/v0",
    doc: "https://v0.dev/docs",
    modelsDevId: "v0"
  },
  {
    name: "Venice",
    transformer: "./transformers/venice.ts",
    output: "venice",
    env: ["VENICE_API_KEY"],
    npm: "@ai-sdk/venice",
    doc: "https://docs.venice.ai/",
    modelsDevId: "venice"
  },
  {
    name: "XAI",
    transformer: "./transformers/xai.ts",
    output: "xai",
    env: ["XAI_API_KEY"],
    npm: "@ai-sdk/xai",
    doc: "https://docs.x.ai/",
    modelsDevId: "xai"
  },
  {
    name: "ModelScope",
    transformer: "./transformers/modelscope.ts",
    output: "modelscope",
    env: ["MODELSCOPE_API_KEY"],
    npm: "@ai-sdk/openai-compatible",
    doc: "https://modelscope.cn/docs/model-service/API-Inference/intro",
    modelsDevId: "modelscope"
  }
]; 