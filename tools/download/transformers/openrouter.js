import axios from 'axios';

/**
 * Transforms an OpenRouter model object (new API structure) into the normalized structure.
 * 
 * @param {Object} model - The raw model object from OpenRouter API.
 * @returns {Object} The normalized model structure.
 */
const transformOpenRouterModel = (model) => {
  const get = (obj, key, def = null) => (obj && obj[key] !== undefined ? obj[key] : def);
  const topProvider = get(model, 'top_provider', {});
  const architecture = get(model, 'architecture', {});
  const pricing = get(model, 'pricing', {});

  return {
    id: get(model, 'id', null),
    name: get(model, 'name', null),
    release_date: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    last_updated: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: null,
    tool_call: true,
    open_weights: true,
    cost: {
      input: pricing.prompt ? Number(pricing.prompt) : null,
      output: pricing.completion ? Number(pricing.completion) : null,
      input_cache_hit: null,
    },
    limit: {
      context: topProvider.context_length ?? model.context_length ?? null,
      output: topProvider.max_completion_tokens ?? null,
    },
    modalities: {
      input: architecture.input_modalities || ['text'],
      output: architecture.output_modalities || ['text'],
    },
    provider: model.owned_by || model.author || (model.id && model.id.split('/')[0]) || 'unknown',
  };
};

/**
 * Fetches models from OpenRouter API and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchOpenRouterModels() {
  console.log('[OpenRouter] Fetching: https://openrouter.ai/api/v1/models');
  
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models');
    const data = response.data;
    
    const models = Array.isArray(data.data) ? data.data : [];
    const transformedModels = models.map(transformOpenRouterModel);
    
    return transformedModels;
    
  } catch (error) {
    console.error('[OpenRouter] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchOpenRouterModels,
  transformOpenRouterModel,
}; 