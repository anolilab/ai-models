import axios from 'axios';

/**
 * Transforms Hugging Face model data from their Router API into the normalized structure.
 * Creates separate model entries for each provider since providers can have different pricing and capabilities.
 * 
 * @param {Array} modelsData - The models data from the Hugging Face Router API.
 * @returns {Array} Array of normalized model objects.
 */
const transformHuggingFaceModels = (modelsData) => {
  const models = [];
  
  if (!modelsData || !Array.isArray(modelsData)) {
    console.error('[Hugging Face] Invalid models data received');
    return models;
  }
  
  for (const modelData of modelsData) {
    try {
      const normalizedModels = normalizeModelByProvider(modelData);
      if (normalizedModels && normalizedModels.length > 0) {
        models.push(...normalizedModels);
      }
    } catch (error) {
      console.error(`[Hugging Face] Error normalizing model ${modelData.id}:`, error.message);
    }
  }
  
  return models;
};

/**
 * Normalize a single Hugging Face model by creating separate entries for each provider
 * @param {Object} modelData - Raw model data from Hugging Face API
 * @returns {Array} Array of normalized model objects, one per provider
 */
function normalizeModelByProvider(modelData) {
  try {
    // Extract basic model information
    const modelId = modelData.id;
    const modelName = modelData.id.split('/').pop() || modelData.id;
    const ownedBy = modelData.owned_by || 'Unknown';
    const created = modelData.created ? new Date(modelData.created * 1000).toISOString() : null;
    
    const providers = modelData.providers || [];
    const models = [];
    
    // Create a separate model entry for each provider
    for (const provider of providers) {
      try {
        const normalizedModel = createProviderSpecificModel(
          modelData, 
          modelId, 
          modelName, 
          ownedBy, 
          created, 
          provider
        );
        
        if (normalizedModel) {
          models.push(normalizedModel);
        }
      } catch (error) {
        console.error(`[Hugging Face] Error creating model for provider ${provider.provider}:`, error.message);
      }
    }
    
    return models;
    
  } catch (error) {
    console.error(`[Hugging Face] Error normalizing model:`, error.message);
    return [];
  }
}

/**
 * Create a model entry for a specific provider
 * @param {Object} modelData - Raw model data from Hugging Face API
 * @param {string} modelId - The model ID
 * @param {string} modelName - The model name
 * @param {string} ownedBy - The model owner
 * @param {string} created - Creation date
 * @param {Object} provider - Provider-specific data
 * @returns {Object|null} Normalized model data for this provider
 */
function createProviderSpecificModel(modelData, modelId, modelName, ownedBy, created, provider) {
  try {
    // Create provider-specific model ID
    const providerModelId = `${modelId}@${provider.provider}`;
    
    // Extract provider-specific capabilities
    const capabilities = analyzeProviderCapabilities(provider, modelId);
    
    // Extract provider-specific pricing
    const pricing = extractProviderPricing(provider);
    
    // Extract provider-specific limits
    const limits = extractProviderLimits(provider);
    
    // Create the normalized model object
    const model = {
      id: providerModelId,
      name: `${modelName} (${provider.provider})`,
      release_date: created,
      last_updated: created,
      attachment: false,
      reasoning: capabilities.reasoning,
      temperature: true,
      knowledge: null,
      tool_call: capabilities.tool_call,
      open_weights: determineOpenWeights(modelId, ownedBy),
      cost: {
        input: pricing.input,
        output: pricing.output,
        input_cache_hit: null,
      },
      limit: {
        context: limits.context,
        output: limits.output,
      },
      modalities: {
        input: capabilities.input_modalities,
        output: capabilities.output_modalities,
      },
      provider: provider.provider,
      streaming_supported: true,
      // Hugging Face-specific fields
      owned_by: ownedBy,
      original_model_id: modelId,
      provider_status: provider.status,
      supports_tools: provider.supports_tools || false,
      supports_structured_output: provider.supports_structured_output || false,
    };
    
    return model;
    
  } catch (error) {
    console.error(`[Hugging Face] Error creating provider-specific model:`, error.message);
    return null;
  }
}

/**
 * Analyze capabilities for a specific provider
 * @param {Object} provider - Provider object
 * @param {string} modelId - The model ID
 * @returns {Object} Capabilities object
 */
function analyzeProviderCapabilities(provider, modelId) {
  const capabilities = {
    tool_call: false,
    reasoning: false,
    input_modalities: ['text'], // Default to text
    output_modalities: ['text'], // Default to text
  };
  
  // Check for tool support
  if (provider.supports_tools) {
    capabilities.tool_call = true;
  }
  
  // Check for structured output support (indicates reasoning capability)
  if (provider.supports_structured_output) {
    capabilities.reasoning = true;
  }
  
  // Determine modalities based on model ID patterns
  const lowerModelId = modelId.toLowerCase();
  if (lowerModelId.includes('vision') || lowerModelId.includes('vl') || lowerModelId.includes('multimodal')) {
    if (!capabilities.input_modalities.includes('image')) {
      capabilities.input_modalities.push('image');
    }
  }
  
  if (lowerModelId.includes('audio') || lowerModelId.includes('speech')) {
    if (!capabilities.input_modalities.includes('audio')) {
      capabilities.input_modalities.push('audio');
    }
  }
  
  return capabilities;
}

/**
 * Extract pricing information from a specific provider
 * @param {Object} provider - Provider object
 * @returns {Object} Pricing object
 */
function extractProviderPricing(provider) {
  const pricing = {
    input: null,
    output: null
  };
  
  if (provider.pricing) {
    pricing.input = provider.pricing.input || null;
    pricing.output = provider.pricing.output || null;
  }
  
  return pricing;
}

/**
 * Extract limits information from a specific provider
 * @param {Object} provider - Provider object
 * @returns {Object} Limits object
 */
function extractProviderLimits(provider) {
  const limits = {
    context: null,
    output: null
  };
  
  if (provider.context_length) {
    limits.context = provider.context_length;
  }
  
  return limits;
}

/**
 * Determine if a model is open weights based on the model ID and owner
 * @param {string} modelId - The model ID
 * @param {string} ownedBy - The model owner
 * @returns {boolean} Whether the model is open weights
 */
function determineOpenWeights(modelId, ownedBy) {
  // Models from major companies are typically not open weights
  const closedWeightOwners = [
    'openai', 'anthropic', 'google', 'meta', 'microsoft', 'amazon', 'cohere',
    'ai21', 'alibaba', 'baidu', 'tencent', 'deepmind'
  ];
  
  const lowerOwnedBy = ownedBy.toLowerCase();
  
  // Check if owner is in the closed weights list
  if (closedWeightOwners.some(owner => lowerOwnedBy.includes(owner))) {
    return false;
  }
  
  // Check for specific model patterns that indicate closed weights
  const closedWeightPatterns = [
    'gpt-', 'claude-', 'gemini-', 'llama-', 'palm-', 'cohere-', 'jurassic-',
    'bedrock-', 'azure-', 'openai-', 'anthropic-'
  ];
  
  const lowerModelId = modelId.toLowerCase();
  if (closedWeightPatterns.some(pattern => lowerModelId.includes(pattern))) {
    return false;
  }
  
  // Default to true for Hugging Face models (most are open weights)
  return true;
}

/**
 * Fetches models from Hugging Face Router API and transforms them.
 * @param {string} apiKey - Optional Hugging Face API key
 * @returns {Array} Array of transformed models.
 */
async function fetchHuggingFaceModels(apiKey = null) {
  try {
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await axios.get('https://router.huggingface.co/v1/models', {
      headers,
      timeout: 30000 // 30 second timeout
    });
    
    const modelsData = response.data.data || [];
    const models = transformHuggingFaceModels(modelsData);
    
    console.log(`[Hugging Face] Successfully fetched and transformed ${models.length} provider-specific models from ${modelsData.length} base models`);
    return models;
    
  } catch (error) {
    console.error('[Hugging Face] Error fetching models:', error.message);
    if (error.response) {
      console.error('[Hugging Face] Response status:', error.response.status);
      console.error('[Hugging Face] Response data:', error.response.data);
    }
    return [];
  }
}

export {
  fetchHuggingFaceModels,
  transformHuggingFaceModels,
}; 