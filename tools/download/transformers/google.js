import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Transforms Google Gemini model data from their documentation page into the normalized structure.
 * 
 * @param {string} modelsHtml - The HTML content from the Google Gemini models page.
 * @param {string} pricingHtml - The HTML content from the Google Gemini pricing page.
 * @returns {Array} Array of normalized model objects.
 */
const transformGoogleModels = (modelsHtml, pricingHtml) => {
  const $ = cheerio.load(modelsHtml);
  const $pricing = cheerio.load(pricingHtml);
  const models = [];
  const currentDate = new Date();
  
  // Parse pricing data from the pricing page
  const pricingData = parsePricingData($pricing);
  
  // Find all <section> elements with <devsite-expandable>
  $('section').each((sectionIndex, sectionElement) => {
    const $section = $(sectionElement);
    const $expandable = $section.find('devsite-expandable');
    
    if ($expandable.length === 0) {
      return; // Skip sections without expandable content
    }
    
    // Skip sections that don't have an ID (these are likely navigation sections)
    const expandableId = $expandable.attr('id');
    if (!expandableId || expandableId.includes('nav') || expandableId.includes('menu')) {
      return;
    }

    try {
      // Extract model name from the h3 heading
      const $heading = $section.find('h3');
      if ($heading.length === 0) {
        return; // Skip sections without headings
      }
      
      const modelName = $heading.text().trim();
      if (!modelName || modelName === '') {
        return; // Skip sections without model names
      }
      
      // Skip sections with very long names (likely navigation sections)
      if (modelName.length > 100) {
        return;
      }

      // Find the model details table - look for the specific table with model details
      const $table = $section.find('table.gemini-api-model-table');
      if ($table.length === 0) {
        // Skip sections without the model table
        return;
      }
      
      // Check if this table has the expected structure (Property/Description columns)
      const $header = $table.find('tr').first().find('th');
      if ($header.length < 2 || !$header.eq(0).text().trim().includes('Property')) {
        return; // Skip tables that don't have the expected structure
      }
      
      // Additional check: ensure this is a model details table by looking for specific properties
      const tableText = $table.text();
      if (!tableText.includes('Model code') && !tableText.includes('Token limits')) {
        return; // Skip tables that don't contain model-specific information
      }

      const modelData = {
        name: modelName,
        modelCode: null,
        supportedDataTypes: { inputs: [], output: [] },
        tokenLimits: { input: null, output: null },
        capabilities: {},
        versions: { stable: null, preview: null },
        latestUpdate: null,
        knowledgeCutoff: null,
        deprecationDate: null
      };

      // Parse the table rows
      $table.find('tr').each((rowIndex, rowElement) => {
        const $row = $(rowElement);
        const $cells = $row.find('td, th');
        
        if ($cells.length < 2) {
          return; // Skip rows without enough cells
        }

        const property = $cells.eq(0).text().trim();
        const value = $cells.eq(1);

        // Parse Model code
        if (property.includes('Model code')) {
          const codeElements = value.find('code');
          if (codeElements.length > 0) {
            // If there are multiple codes, take the first one (usually the main one)
            const codeText = codeElements.first().text().trim();
            if (codeText) {
              modelData.modelCode = codeText.replace(/\s+/g, ''); // Remove whitespace
            }
          }
        }

        // Parse Supported data types
        else if (property.includes('Supported data types')) {
          const inputSection = value.find('section').first();
          const outputSection = value.find('section').last();
          
          if (inputSection.length > 0) {
            const inputText = inputSection.text().trim();
            if (inputText.includes('Text')) modelData.supportedDataTypes.inputs.push('text');
            if (inputText.includes('image')) modelData.supportedDataTypes.inputs.push('image');
            if (inputText.includes('video')) modelData.supportedDataTypes.inputs.push('video');
            if (inputText.includes('audio')) modelData.supportedDataTypes.inputs.push('audio');
          }
          
          if (outputSection.length > 0) {
            const outputText = outputSection.text().trim();
            if (outputText.includes('Text')) modelData.supportedDataTypes.output.push('text');
            if (outputText.includes('image')) modelData.supportedDataTypes.output.push('image');
            if (outputText.includes('video')) modelData.supportedDataTypes.output.push('video');
            if (outputText.includes('audio')) modelData.supportedDataTypes.output.push('audio');
          }
        }

        // Parse Token limits
        else if (property.includes('Token limits')) {
          const sections = value.find('section');
          sections.each((sectionIndex, sectionElement) => {
            const $section = $(sectionElement);
            const sectionText = $section.text().trim();
            
            if (sectionText.includes('Input token limit')) {
              const limitText = $section.find('p').last().text().trim();
              const limitMatch = limitText.match(/([\d,]+)/);
              if (limitMatch) {
                modelData.tokenLimits.input = parseInt(limitMatch[1].replace(/,/g, ''));
              }
            } else if (sectionText.includes('Output token limit')) {
              const limitText = $section.find('p').last().text().trim();
              const limitMatch = limitText.match(/([\d,]+)/);
              if (limitMatch) {
                modelData.tokenLimits.output = parseInt(limitMatch[1].replace(/,/g, ''));
              }
            }
          });
        }

        // Parse Capabilities
        else if (property.includes('Capabilities')) {
          const sections = value.find('section');
          sections.each((sectionIndex, sectionElement) => {
            const $section = $(sectionElement);
            const capabilityName = $section.find('p').first().text().trim();
            const capabilityValue = $section.find('p').last().text().trim();
            
            if (capabilityName && capabilityValue) {
              const isSupported = capabilityValue.includes('Supported');
              modelData.capabilities[capabilityName.toLowerCase().replace(/\s+/g, '_')] = isSupported;
            }
          });
        }

        // Parse Versions
        else if (property.includes('Versions')) {
          const stableMatch = value.text().match(/Stable:\s*<code[^>]*>([^<]+)<\/code>/);
          const previewMatch = value.text().match(/Preview:\s*<code[^>]*>([^<]+)<\/code>/);
          
          if (stableMatch) {
            modelData.versions.stable = stableMatch[1].trim();
          }
          if (previewMatch) {
            modelData.versions.preview = previewMatch[1].trim();
          }
        }

        // Parse Latest update
        else if (property.includes('Latest update')) {
          const updateText = value.text().trim();
          if (updateText && updateText !== '-') {
            modelData.latestUpdate = updateText;
          }
        }

        // Parse Knowledge cutoff
        else if (property.includes('Knowledge cutoff')) {
          const cutoffText = value.text().trim();
          if (cutoffText && cutoffText !== '-') {
            modelData.knowledgeCutoff = cutoffText;
          }
        }

        // Parse Deprecation date (if present)
        else if (property.includes('Deprecation date')) {
          const deprecationText = value.text().trim();
          if (deprecationText && deprecationText !== '-') {
            modelData.deprecationDate = deprecationText;
          }
        }
      });

      // Check if model is deprecated
      if (modelData.deprecationDate) {
        const deprecationDate = parseDate(modelData.deprecationDate);
        if (deprecationDate && deprecationDate < currentDate) {
          console.log(`[Google] Skipping deprecated model: ${modelName} (deprecated: ${modelData.deprecationDate})`);
          return; // Skip this model
        }
      }

              // Create the normalized model object
        if (modelData.modelCode) {
          const modelId = modelData.modelCode.replace('models/', '');
          
          // Get pricing data for this model
          const modelPricing = getModelPricing(modelData.name, pricingData);
          
          const model = {
            id: modelId,
            name: modelData.name,
            release_date: null, // Not provided in the structure
            last_updated: modelData.latestUpdate ? parseDateToISO(modelData.latestUpdate) : null,
            attachment: false,
            reasoning: modelData.capabilities.thinking || false,
            temperature: true, // Assume true for Google models
            knowledge: modelData.knowledgeCutoff,
            tool_call: modelData.capabilities.function_calling || false,
            open_weights: false, // Google models are not open weights
            cost: {
              input: modelPricing.input,
              output: modelPricing.output,
              input_cache_hit: modelPricing.input_cache_hit,
              image_generation: modelPricing.image_generation,
              image_generation_ultra: modelPricing.image_generation_ultra,
              video_generation: modelPricing.video_generation,
              video_generation_with_audio: modelPricing.video_generation_with_audio,
              video_generation_without_audio: modelPricing.video_generation_without_audio,
            },
          limit: {
            context: modelData.tokenLimits.input,
            output: modelData.tokenLimits.output,
          },
          modalities: {
            input: modelData.supportedDataTypes.inputs.length > 0 ? modelData.supportedDataTypes.inputs : ['text'],
            output: modelData.supportedDataTypes.output.length > 0 ? modelData.supportedDataTypes.output : ['text'],
          },
          provider: 'Google',
          streaming_supported: true, // Assume true for Google models
          // Google-specific capabilities
          cache_read: modelData.capabilities.caching || false,
          code_execution: modelData.capabilities.code_execution || false,
          search_grounding: modelData.capabilities.search_grounding || false,
          structured_outputs: modelData.capabilities.structured_outputs || false,
          batch_mode: modelData.capabilities.batch_mode || false,
          audio_generation: modelData.capabilities.audio_generation || false,
          image_generation: modelData.capabilities.image_generation || false,
          versions: modelData.versions,
        };

        models.push(model);
      }

    } catch (error) {
      console.error(`[Google] Error parsing model section:`, error.message);
    }
  });

  return models;
};

/**
 * Parses pricing data from the pricing page
 * @param {Object} $ - Cheerio object for the pricing page
 * @returns {Object} Object mapping model names to pricing data
 */
function parsePricingData($) {
  const pricingData = {};
  
  // Find all pricing tables and their positions
  const pricingTables = [];
  $('table.pricing-table').each((tableIndex, tableElement) => {
    const $table = $(tableElement);
    pricingTables.push({
      table: $table,
      index: tableIndex
    });
  });
  
  console.log(`[Google] Found ${pricingTables.length} pricing tables`);
  
  // Find all h2 elements that contain model names
  const modelHeadings = [];
  $('h2').each((headingIndex, headingElement) => {
    const $heading = $(headingElement);
    const modelName = $heading.text().trim();
    
    // Check if this is a model heading (contains "Gemini", "Imagen", "Veo", etc.)
    if (modelName.includes('Gemini') || modelName.includes('Imagen') || modelName.includes('Veo') || modelName.includes('Gemma')) {
      modelHeadings.push({
        name: modelName,
        element: $heading,
        index: headingIndex
      });
      console.log(`[Google] Found pricing heading: "${modelName}"`);
    }
  });
  
  // Map each heading to its corresponding pricing table by index
  modelHeadings.forEach((heading, headingIndex) => {
    const modelName = heading.name;
    
    // Find the pricing table that corresponds to this heading
    let closestTable = null;
    let selectedTableIndex = -1;
    
    // Simple mapping: heading index maps to table index
    if (headingIndex < pricingTables.length) {
      selectedTableIndex = headingIndex;
      closestTable = pricingTables[headingIndex].table;
    }
    
    if (closestTable) {
      // Parse pricing from the table based on model type
      const pricing = {
        input: null,
        output: null,
        input_cache_hit: null,
        image_generation: null,
        image_generation_ultra: null,
        video_generation: null,
        video_generation_with_audio: null,
        video_generation_without_audio: null
      };
      
      // Determine model type for pricing structure
      const isImageModel = modelName.includes('Imagen');
      const isVideoModel = modelName.includes('Veo');
      
      closestTable.find('tr').each((rowIndex, rowElement) => {
        const $row = $(rowElement);
        const $cells = $row.find('td, th');
        
        if ($cells.length >= 3) {
          const rowText = $row.text().trim();
          
          if (isImageModel) {
            // Parse image generation pricing
            if (rowText.includes('Standard image price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.image_generation = parseFloat(priceMatch[1]);
              }
            } else if (rowText.includes('Ultra image price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.image_generation_ultra = parseFloat(priceMatch[1]);
              }
            } else if (rowText.includes('Image price')) {
              // Handle simpler pricing structure (e.g., Imagen 3)
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.image_generation = parseFloat(priceMatch[1]);
              }
            }
          } else if (isVideoModel) {
            // Parse video generation pricing
            if (rowText.includes('Video with audio price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.video_generation_with_audio = parseFloat(priceMatch[1]);
              }
            } else if (rowText.includes('Video without audio price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.video_generation_without_audio = parseFloat(priceMatch[1]);
              }
            } else if (rowText.includes('Video price')) {
              // Handle simpler pricing structure (e.g., Veo 2)
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.video_generation = parseFloat(priceMatch[1]);
              }
            }
          } else {
            // Parse text model pricing (existing logic)
            if (rowText.includes('Input price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const textPriceMatch = priceText.match(/\$([\d.]+)\s*\(text/);
              if (textPriceMatch) {
                pricing.input = parseFloat(textPriceMatch[1]);
              } else {
                const priceMatch = priceText.match(/\$([\d.]+)/);
                if (priceMatch) {
                  pricing.input = parseFloat(priceMatch[1]);
                }
              }
            } else if (rowText.includes('Output price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const priceMatch = priceText.match(/\$([\d.]+)/);
              if (priceMatch) {
                pricing.output = parseFloat(priceMatch[1]);
              }
            } else if (rowText.includes('Context caching price')) {
              const paidTierCell = $cells.eq(2);
              const priceText = paidTierCell.text().trim();
              const textPriceMatch = priceText.match(/\$([\d.]+)\s*\(text/);
              if (textPriceMatch) {
                pricing.input_cache_hit = parseFloat(textPriceMatch[1]);
              } else {
                const priceMatch = priceText.match(/\$([\d.]+)/);
                if (priceMatch) {
                  pricing.input_cache_hit = parseFloat(priceMatch[1]);
                }
              }
            }
          }
        }
      });
      
      // Store pricing data for this model
      pricingData[modelName] = pricing;
    }
  });
  
  return pricingData;
}

/**
 * Maps model names to pricing headings to handle naming mismatches
 * @param {string} modelName - The model name from the models page
 * @param {Object} pricingData - The pricing data object
 * @returns {Object} The pricing data for the model
 */
function getModelPricing(modelName, pricingData) {
  // Direct match first
  if (pricingData[modelName]) {
    return pricingData[modelName];
  }
  
  // Handle specific mismatches
  const pricingMappings = {
    'Imagen 4': 'Imagen 4 Preview',
    'Veo 3': 'Veo 3 Preview',
    // Add more mappings as needed
  };
  
  const mappedName = pricingMappings[modelName];
  if (mappedName && pricingData[mappedName]) {
    return pricingData[mappedName];
  }
  
  // Return default pricing structure
  return {
    input: null,
    output: null,
    input_cache_hit: null,
    image_generation: null,
    image_generation_ultra: null,
    video_generation: null,
    video_generation_with_audio: null,
    video_generation_without_audio: null
  };
}

/**
 * Parse a date string to a Date object
 * @param {string} dateStr - Date string like "June 2025" or "January 2025"
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Handle formats like "June 2025", "January 2025"
    const dateMatch = dateStr.match(/(\w+)\s+(\d{4})/);
    if (dateMatch) {
      const [, month, year] = dateMatch;
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
      return new Date(parseInt(year), monthIndex, 1);
    }
    
    // Handle other date formats if needed
    return new Date(dateStr);
  } catch (error) {
    console.error(`[Google] Error parsing date: ${dateStr}`, error.message);
    return null;
  }
}

/**
 * Parse a date string to ISO format (YYYY-MM)
 * @param {string} dateStr - Date string like "June 2025"
 * @returns {string|null} ISO formatted date or null if invalid
 */
function parseDateToISO(dateStr) {
  const date = parseDate(dateStr);
  if (date) {
    return date.toISOString().slice(0, 7); // YYYY-MM format
  }
  return null;
}

/**
 * Fetches models from Google Gemini documentation and transforms them.
 * @returns {Array} Array of transformed models.
 */
async function fetchGoogleModels() {
  console.log('[Google] Fetching models and pricing from Google Gemini documentation...');
  
  try {
    // Fetch both models and pricing data
    const [modelsResponse, pricingResponse] = await Promise.all([
      axios.get('https://ai.google.dev/gemini-api/docs/models'),
      axios.get('https://ai.google.dev/gemini-api/docs/pricing')
    ]);
    
    const modelsHtml = modelsResponse.data;
    const pricingHtml = pricingResponse.data;
    
    const models = transformGoogleModels(modelsHtml, pricingHtml);
    
    return models;
    
  } catch (error) {
    console.error('[Google] Error fetching models:', error.message);
    return [];
  }
}

export {
  fetchGoogleModels,
  transformGoogleModels,
}; 