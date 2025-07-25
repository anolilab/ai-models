/**
 * Transforms an OpenRouter model object (new API structure) into the normalized structure.
 * 
 * @param {Object} model - The raw model object from OpenRouter API.
 * @returns {Object} The normalized model structure.
 * 
 * @example
 * const rawModel = {
 *   id: 'openai/gpt-4',
 *   name: 'GPT-4',
 *   created: 1682607600,
 *   architecture: { input_modalities: ['text'], output_modalities: ['text'] },
 *   top_provider: { context_length: 8192, max_completion_tokens: 4096 },
 *   pricing: { prompt: '0.00003', completion: '0.00006' }
 * };
 * 
 * const normalized = transformOpenRouterModel(rawModel);
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
    },
    limit: {
      context: topProvider.context_length ?? model.context_length ?? null,
      output: topProvider.max_completion_tokens ?? null,
    },
    modalities: {
      input: architecture.input_modalities || ['text'],
      output: architecture.output_modalities || ['text'],
    },
  };
};

export default transformOpenRouterModel; 