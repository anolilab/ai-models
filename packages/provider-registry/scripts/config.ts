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
 * Maps provider names to their corresponding LobeHub icon names
 * Uses lowercase provider names for consistency
 */
export const PROVIDER_ICON_MAP: Record<string, string> = {
  // Primary providers with LobeHub icons
  'anthropic': 'anthropic',
  'azure': 'microsoft',
  'azure-open-ai': 'microsoft',
  'azure openai': 'microsoft',
  'amazon': 'amazon',
  'amazon-bedrock': 'amazon',
  'amazon bedrock': 'amazon',
  'claude': 'anthropic',
  'deepseek': 'deepseek',
  'deep-seek': 'deepseek',
  'deep infra': 'deepinfra',
  'fireworks': 'fireworks',
  'fireworks-ai': 'fireworks',
  'fireworks ai': 'fireworks',
  'google': 'google',
  'github': 'github',
  'github copilot': 'githubcopilot',
  'git-hub-copilot': 'githubcopilot',
  'github models': 'github',
  'google vertex': 'google',
  'google vertex anthropic': 'google',
  'grok': 'grok',
  'groq': 'groq',
  'huggingface': 'huggingface',
  'hugging-face': 'huggingface',
  'hugging face': 'huggingface',
  'inference': 'inference',
  'meta': 'meta',
  'meta-llama': 'meta',
  'mistral': 'mistral',
  'mistralai': 'mistral',
  'mistral ai': 'mistral',
  'morph': 'morph',
  'ollama': 'ollama',
  'openai': 'openai',
  'open-ai': 'openai',
  'openrouter': 'openrouter',
  'open-router': 'openrouter',
  'requesty': 'requesty',
  'upstage': 'upstage',
  'v0': 'v0',
  'venice': 'venice',
  'vercel': 'vercel',
  'vertexai': 'google',
  'xai': 'x-ai',
  
  // Additional providers with LobeHub icons
  'cohere': 'cohere',
  'microsoft': 'microsoft',
  'stability ai': 'stability',
  'perplexity': 'perplexity',
  'together': 'together',
  'togetherai': 'together',
  'together ai': 'together',
  'nvidia': 'nvidia',
  'inflection': 'inflection',
  'x-ai': 'x-ai',
  'writer': 'writer',
  'luma': 'luma',
  'rekaai': 'reka-ai',
  'sambanova': 'sambanova',
  'cerebras': 'cerebras',
  'eleutherai': 'eleutherai',
  'featherless': 'featherless',
  'featherless-ai': 'featherless',
  'hyperbolic': 'hyperbolic',
  'infermatic': 'infermatic',
  'liquid': 'liquid',
  'minimax': 'minimax',
  'nebius': 'nebius',
  'nousresearch': 'nousresearch',
  'novita': 'novita',
  'nscale': 'nscale',
  'opengvlab': 'opengvlab',
  'qwen': 'qwen',
  'sarvamai': 'sarvam-ai',
  'tencent': 'tencent',
  'aion-labs': 'aionlabs',
  'arcee-ai': 'arcee-ai',
  'baidu': 'baidu',
  'z-ai': 'z-ai',
  'zai': 'z-ai',
  'modelscope': 'modelscope',
  'deep-infra': 'deepinfra',
  'google-vertex': 'google',
  'google-vertex-anthropic': 'google',
  'together-ai': 'together',
  'git-hub-models': 'github',
  
  // Additional providers with LobeHub icons
  'moonshotai': 'moonshot',
  'moonshot-ai': 'moonshot',
  'inception': 'inception',
  'mancer': 'mancer',
  'miatral': '',
  'neversleep': 'neversleep',
  'nothingiisreal': 'nothing-is-real',
  'pygmalionai': 'pygmalion-ai',
  'raifle': 'raifle',
  'sao10k': 'sao10k',
  'scb10x': 'scb10x',
  'shisa-ai': 'shisa-ai',
  'sophosympatheia': 'sophosympatheia',
  'switchpoint': 'switchpoint',
  'thedrummer': 'the-drummer',
  'thudm': 'thudm',
  'tngtech': 'tngtech',
  'undi95': 'undi95',
  'agentica-org': 'agentica-org',
  'alfredpros': 'alfredpros',
  'alibaba': 'alibaba',
  'alpindale': 'alpindale',
  'anthracite-org': 'anthracite-org',
  'arliai': 'arliai',
  'bytedance': 'bytedance',
  'cognitivecomputations': 'cognitive-computations',
  'gryphe': 'gryphe',
  
  // Additional providers with LobeHub icons
  'aionlabs': 'aionlabs',
  'avian': 'avian',
  'atlascloud': 'atlascloud',
  'atoma': 'atoma',
  'chutes': 'chutes',
  'cloudflare': 'cloudflare',
  'crusoe': 'crusoe',
  'deepinfra': 'deepinfra',
  'enfer': 'enfer',
  'friendli': 'friendli',
  'gmicloud': 'gmicloud',
  'inferencenet': 'inferencenet',
  'kluster': 'kluster',
  'lambda': 'lambda',
  'nineteen': 'nineteen',
  'ncompass': 'ncompass',
  'openinference': 'openinference',
  'parasail': 'parasail',
  'phala': 'phala',
  'targon': 'targon',
  'ubicloud': 'ubicloud',
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