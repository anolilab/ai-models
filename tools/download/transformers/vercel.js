/**
 * Transforms a Vercel Gateway model object into the normalized structure.
 * 
 * @param {Object} model - The raw model object from Vercel Gateway API.
 * @param {string} model.id - The model identifier.
 * @param {string} model.name - The model name.
 * @param {number} model.created - Unix timestamp of creation date.
 * @param {Object} model.pricing - Pricing information.
 * @param {string} model.pricing.input - Input token price.
 * @param {string} model.pricing.output - Output token price.
 * @param {number} model.context_window - Maximum context window size.
 * @param {number} model.max_tokens - Maximum output tokens.
 * @param {Array} model.input_modalities - Supported input modalities.
 * @param {Array} model.output_modalities - Supported output modalities.
 * @returns {Object} The normalized model structure.
 * 
 * @example
 * const rawModel = {
 *   id: 'openai/gpt-3.5-turbo',
 *   name: 'GPT-3.5 Turbo',
 *   created: 1682607600,
 *   pricing: { input: '0.0000015', output: '0.000002' },
 *   context_window: 4096,
 *   max_tokens: 4096,
 *   input_modalities: ['text'],
 *   output_modalities: ['text']
 * };
 * 
 * const normalized = transformVercelModel(rawModel);
 * // Returns:
 * // {
 * //   id: 'openai/gpt-3.5-turbo',
 * //   name: 'GPT-3.5 Turbo',
 * //   release_date: '2023-04-27',
 * //   last_updated: '2023-04-27',
 * //   attachment: false,
 * //   reasoning: false,
 * //   temperature: true,
 * //   knowledge: null,
 * //   tool_call: true,
 * //   open_weights: true,
 * //   cost: { input: 0.0000015, output: 0.000002 },
 * //   limit: { context: 4096, output: 4096 },
 * //   modalities: { input: ['text'], output: ['text'] }
 * // }
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
  };
};

export default transformVercelModel; 