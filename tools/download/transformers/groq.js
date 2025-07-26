import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms Groq model data from their documentation page into the normalized structure.
 * 
 * @param {string} modelsHtml - The HTML content from the Groq models page.
 * @returns {Array} Array of normalized model objects.
 */
const transformGroqModels = async (modelsHtml) => {
  const $ = cheerio.load(modelsHtml);
  const models = [];
  
  console.log('[Groq] Starting to parse models page...');
  
  // Extract all model detail URLs from the page
  const modelDetailUrls = [];
  
  // Find all "Details" links that point to model pages
  $('a[href*="/docs/model/"], a[href*="/docs/agentic-tooling/"]').each((index, element) => {
    const href = $(element).attr('href');
    if (href && href.includes('Details')) {
      const fullUrl = href.startsWith('http') ? href : `https://console.groq.com${href}`;
      modelDetailUrls.push(fullUrl);
    }
  });
  
  // Also look for model IDs in the page content
  const modelIds = [];
  $('span[id]').each((index, element) => {
    const id = $(element).attr('id');
    if (id && !id.includes('-details')) {
      modelIds.push(id);
    }
  });
  
  console.log(`[Groq] Found ${modelDetailUrls.length} detail URLs and ${modelIds.length} model IDs`);
  console.log('[Groq] Model IDs found:', modelIds);
  
  // Create a set of unique model URLs to fetch
  const uniqueModelUrls = new Set();
  
  // Add URLs from detail links
  modelDetailUrls.forEach(url => uniqueModelUrls.add(url));
  
  // Add URLs for model IDs that don't have detail links
  modelIds.forEach(modelId => {
    const detailUrl = `https://console.groq.com/docs/model/${modelId}`;
    if (!Array.from(uniqueModelUrls).some(url => url.includes(modelId))) {
      uniqueModelUrls.add(detailUrl);
    }
  });
  
  // Add compound model URLs
  const compoundModels = ['compound-beta', 'compound-beta-mini'];
  compoundModels.forEach(modelId => {
    const detailUrl = `https://console.groq.com/docs/agentic-tooling/${modelId}`;
    uniqueModelUrls.add(detailUrl);
  });
  
  console.log(`[Groq] Will fetch details for ${uniqueModelUrls.size} models:`);
  Array.from(uniqueModelUrls).forEach(url => {
    console.log(`[Groq] - ${url}`);
  });
  
  // Fetch details for each model
  for (const detailUrl of uniqueModelUrls) {
    try {
      console.log(`[Groq] Fetching details from: ${detailUrl}`);
      const detailResponse = await axios.get(detailUrl);
      const detailHtml = detailResponse.data;
      
      const modelData = parseModelDetailPage(detailHtml, detailUrl);
      if (modelData) {
        models.push(modelData);
        console.log(`[Groq] Successfully parsed model: ${modelData.id}`);
      }
      
      // Add a small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`[Groq] Error fetching model details from ${detailUrl}:`, error.message);
    }
  }
  
  console.log(`[Groq] Successfully parsed ${models.length} models`);
  return models;
};

/**
 * Parse a model detail page to extract model information
 * @param {string} html - HTML content of the model detail page
 * @param {string} url - URL of the detail page
 * @returns {Object|null} Parsed model data or null if parsing failed
 */
function parseModelDetailPage(html, url) {
  const $ = cheerio.load(html);
  
  try {
    // Extract model ID from URL
    const urlParts = url.split('/');
    const modelId = urlParts[urlParts.length - 1];
    
    // Extract model name from the page title
    const title = $('h1').first().text().trim();
    const modelName = title || modelId;
    
    // Extract pricing information
    const pricing = parsePricing($);
    
    // Extract limits information
    const limits = parseLimits($);
    
    // Extract capabilities
    const capabilities = parseCapabilities($);
    
    // Extract provider information
    const provider = parseProvider($);
    
    // Extract description
    const description = $('p').first().text().trim();
    
    // Determine model type based on URL
    const isCompound = url.includes('/agentic-tooling/');
    
    // Create the normalized model object
    const model = {
      id: modelId,
      name: modelName,
      release_date: null, // Not provided in the structure
      last_updated: null, // Not provided in the structure
      attachment: false, // Groq models don't support attachments
      reasoning: capabilities.reasoning || false,
      temperature: true, // Assume true for Groq models
      knowledge: null, // Not provided in the structure
      tool_call: capabilities.tool_call || false,
      open_weights: false, // Groq models are not open weights
      cost: {
        input: pricing.input,
        output: pricing.output,
        input_cache_hit: null, // Not provided by Groq
      },
      limit: {
        context: limits.context,
        output: limits.output,
      },
      modalities: {
        input: capabilities.input_modalities || ['text'],
        output: capabilities.output_modalities || ['text'],
      },
      provider: provider || 'Groq',
      streaming_supported: true, // Assume true for Groq models
      // Groq-specific fields
      compound_system: isCompound,
      description: description,
    };
    
    return model;
    
  } catch (error) {
    console.error(`[Groq] Error parsing model detail page:`, error.message);
    return null;
  }
}

/**
 * Parse pricing information from the detail page
 * @param {Object} $ - Cheerio object
 * @returns {Object} Pricing data
 */
function parsePricing($) {
  const pricing = {
    input: null,
    output: null
  };
  
  // Look for pricing information in the page
  $('div').each((index, element) => {
    const text = $(element).text();
    
    // Look for input pricing
    if (text.includes('Input') && text.includes('$')) {
      const inputMatch = text.match(/\$([\d.]+)/);
      if (inputMatch) {
        pricing.input = parseFloat(inputMatch[1]);
      }
    }
    
    // Look for output pricing
    if (text.includes('Output') && text.includes('$')) {
      const outputMatch = text.match(/\$([\d.]+)/);
      if (outputMatch) {
        pricing.output = parseFloat(outputMatch[1]);
      }
    }
  });
  
  return pricing;
}

/**
 * Parse limits information from the detail page
 * @param {Object} $ - Cheerio object
 * @returns {Object} Limits data
 */
function parseLimits($) {
  const limits = {
    context: null,
    output: null
  };
  
  // Look for context window information
  $('div').each((index, element) => {
    const text = $(element).text();
    
    if (text.includes('CONTEXT WINDOW') || text.includes('Context Window')) {
      const contextMatch = text.match(/([\d,]+)/);
      if (contextMatch) {
        limits.context = parseInt(contextMatch[1].replace(/,/g, ''));
      }
    }
    
    if (text.includes('MAX OUTPUT') || text.includes('Max Output')) {
      const outputMatch = text.match(/([\d,]+)/);
      if (outputMatch) {
        limits.output = parseInt(outputMatch[1].replace(/,/g, ''));
      }
    }
  });
  
  return limits;
}

/**
 * Parse capabilities from the detail page
 * @param {Object} $ - Cheerio object
 * @returns {Object} Capabilities data
 */
function parseCapabilities($) {
  const capabilities = {
    tool_call: false,
    reasoning: false,
    input_modalities: ['text'],
    output_modalities: ['text']
  };
  
  // Look for tool use capability
  $('a[href*="tool-use"]').each((index, element) => {
    capabilities.tool_call = true;
  });
  
  // Look for reasoning/extended thinking capability
  $('div').each((index, element) => {
    const text = $(element).text();
    if (text.includes('reasoning') || text.includes('thinking')) {
      capabilities.reasoning = true;
    }
  });
  
  return capabilities;
}

/**
 * Parse provider information from the detail page
 * @param {Object} $ - Cheerio object
 * @returns {string} Provider name
 */
function parseProvider($) {
  // Look for provider information
  $('div').each((index, element) => {
    const text = $(element).text();
    if (text.includes('Meta') || text.includes('meta')) {
      return 'Meta';
    }
    if (text.includes('Google') || text.includes('google')) {
      return 'Google';
    }
    if (text.includes('OpenAI') || text.includes('openai')) {
      return 'OpenAI';
    }
    if (text.includes('DeepSeek') || text.includes('deepseek')) {
      return 'DeepSeek';
    }
    if (text.includes('Moonshot') || text.includes('moonshot')) {
      return 'Moonshot AI';
    }
    if (text.includes('Alibaba') || text.includes('alibaba')) {
      return 'Alibaba Cloud';
    }
    if (text.includes('PlayAI') || text.includes('playai')) {
      return 'PlayAI';
    }
  });
  
  return 'Groq'; // Default to Groq if no specific provider found
}

/**
 * Fetches models from Groq documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchGroqModels() {
  console.log('[Groq] Fetching models from Groq documentation...');
  
  try {
    const response = await axios.get('https://console.groq.com/docs/models');
    const modelsHtml = response.data;
    
    const models = await transformGroqModels(modelsHtml);
    
    return models;
    
  } catch (error) {
    console.error('[Groq] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchGroqModels,
  transformGroqModels,
}; 