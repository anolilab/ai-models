import * as cheerio from 'cheerio';

/**
 * Transforms Amazon Bedrock model data from the models-supported.html page into the normalized structure.
 * 
 * @param {string} htmlContent - The HTML content from the models-supported page.
 * @returns {Array} Array of normalized model objects.
 * 
 * @example
 * const htmlContent = await fetch('https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html');
 * const models = transformBedrockModels(htmlContent);
 */
const transformBedrockModels = (htmlContent) => {
  const $ = cheerio.load(htmlContent);
  const models = [];
  
  // Parse the table structure based on the provided HTML format
  $('table tbody tr').each((index, element) => {
    const $row = $(element);
    const $cells = $row.find('td');
    
    // Expected columns: Provider, Model name, Model ID, Regions, Input modalities, Output modalities, Streaming, Inference params, Hyperparams
    if ($cells.length >= 9) {
      const provider = $cells.eq(0).find('span').text().trim() || $cells.eq(0).text().trim();
      const modelName = $cells.eq(1).text().trim();
      const modelId = $cells.eq(2).text().trim();
      const regions = $cells.eq(3).text().trim();
      const inputModalities = $cells.eq(4).text().trim();
      const outputModalities = $cells.eq(5).text().trim();
      const streamingSupported = $cells.eq(6).text().trim();
      
      if (modelName && modelId) {
        // Parse input modalities
        const inputMods = inputModalities.toLowerCase().includes('text') ? ['text'] : [];
        if (inputModalities.toLowerCase().includes('image')) inputMods.push('image');
        if (inputModalities.toLowerCase().includes('audio')) inputMods.push('audio');
        if (inputModalities.toLowerCase().includes('video')) inputMods.push('video');
        
        // Parse output modalities
        const outputMods = [];
        if (outputModalities.toLowerCase().includes('text')) outputMods.push('text');
        if (outputModalities.toLowerCase().includes('chat')) outputMods.push('text'); // Chat is text output
        if (outputModalities.toLowerCase().includes('image')) outputMods.push('image');
        if (outputModalities.toLowerCase().includes('embedding')) outputMods.push('embedding');
        
        // Convert model ID format from dots to slashes (e.g., 'ai21.jamba-1-5-large-v1:0' -> 'ai21/jamba-1-5-large-v1:0')
        const formattedModelId = modelId.replace(/\./g, '/');
        
        models.push({
          id: formattedModelId,
          name: modelName,
          release_date: null,
          last_updated: null,
          attachment: false,
          reasoning: false,
          temperature: true,
          knowledge: null,
          tool_call: true,
          open_weights: true,
          cost: {
            input: null,
            output: null,
          },
          limit: {
            context: null,
            output: null,
          },
          modalities: {
            input: inputMods.length > 0 ? inputMods : ['text'],
            output: outputMods.length > 0 ? outputMods : ['text'],
          },
          // Additional metadata from the table
          provider: provider,
          regions: regions,
          streaming_supported: streamingSupported.toLowerCase() === 'yes',
        });
      }
    }
  });
  
  return models;
};

/**
 * Transforms a single model object (placeholder for now).
 * This function signature matches the expected transformer interface.
 * 
 * @param {Object} model - The model object (will be HTML content in this case).
 * @returns {Object} The normalized model structure.
 */
const transformBedrockModel = (model) => {
  // This function is called for each "model" in the data
  // For HTML parsing, you might want to parse the entire HTML content
  // and return multiple models from a single HTML page
  
  return {
    id: 'placeholder-model-id',
    name: 'Placeholder Model Name',
    release_date: null,
    last_updated: null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: null,
    tool_call: true,
    open_weights: true,
    cost: {
      input: null,
      output: null,
    },
    limit: {
      context: null,
      output: null,
    },
    modalities: {
      input: ['text'],
      output: ['text'],
    },
  };
};

export default transformBedrockModel;
