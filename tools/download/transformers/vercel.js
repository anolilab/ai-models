import axios from 'axios';

/**
 * Transforms a Vercel Gateway model object into the normalized structure.
 * 
 * @param {Object} model - The raw model object from Vercel Gateway API.
 * @returns {Object} The normalized model structure.
 */
const transformVercelModel = (model) => {
  const get = (obj, key, def = null) => (obj && obj[key] !== undefined ? obj[key] : def);
  return {
    id: get(model, 'id', null),
    name: get(model, 'name', null),
    release_date: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    last_updated: get(model, 'created', null) ? new Date(model.created * 1000).toISOString().slice(0, 10) : null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: get(model, 'knowledge', null),
    tool_call: true,
    open_weights: true,
    cost: {
      input: get(model, 'pricing', {}).input ? Number(model.pricing.input) : null,
      output: get(model, 'pricing', {}).output ? Number(model.pricing.output) : null,
    },
    limit: {
      context: get(model, 'context_window', null),
      output: get(model, 'max_tokens', null),
    },
    modalities: {
      input: get(model, 'input_modalities', null) || ['text'],
      output: get(model, 'output_modalities', null) || ['text'],
    },
    provider: model.owned_by || model.author || (model.id && model.id.split('/')[0]) || 'unknown',
  };
};

/**
 * Fetches models from Vercel Gateway API and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchVercelModels() {
  console.log('[VercelGateway] Fetching: https://ai-gateway.vercel.sh/v1/models');
  
  try {
    const response = await axios.get('https://ai-gateway.vercel.sh/v1/models');
    const data = response.data;
    
    const models = Array.isArray(data.data) ? data.data : [];
    const transformedModels = models.map(transformVercelModel);
    
    return transformedModels;
    
  } catch (error) {
    console.error('[VercelGateway] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchVercelModels,
  transformVercelModel,
}; 