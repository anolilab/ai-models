import axios from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  release_date: z.string().nullable(),
  last_updated: z.string().nullable(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  knowledge: z.string().nullable(),
  tool_call: z.boolean(),
  open_weights: z.boolean(),
  cost: z.object({
    input: z.number().nullable(),
    output: z.number().nullable(),
  }),
  limit: z.object({
    context: z.number().nullable(),
    output: z.number().nullable(),
  }),
  modalities: z.object({
    input: z.array(z.string()),
    output: z.array(z.string()),
  }),
  // Optional additional metadata fields
  provider: z.string().optional(),
  regions: z.array(z.string()).optional(),
  streaming_supported: z.boolean().nullable().optional(),
  // Azure-specific fields
  deployment_type: z.string().optional(),
  training_data_cutoff: z.string().optional(),
  max_request_tokens: z.number().nullable().optional(),
  output_dimensions: z.number().nullable().optional(),
});

async function fetchAzureModels() {
  console.log('[Azure OpenAI] Fetching: https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/refs/heads/main/articles/ai-foundry/openai/concepts/models.md');
  
  try {
    const response = await axios.get('https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/refs/heads/main/articles/ai-foundry/openai/concepts/models.md');
    const markdown = response.data;
    
    const models = [];
    
    // Parse different model categories from the markdown
    const modelCategories = [
      { name: 'GPT-4.1 Series', pattern: /## GPT 4\.1 series[\s\S]*?(?=## |$)/ },
      { name: 'GPT-4o and GPT-4 Turbo', pattern: /## GPT-4o and GPT-4 Turbo[\s\S]*?(?=## |$)/ },
      { name: 'GPT-4', pattern: /## GPT-4[\s\S]*?(?=## |$)/ },
      { name: 'GPT-3.5', pattern: /## GPT-3\.5[\s\S]*?(?=## |$)/ },
      { name: 'o-series', pattern: /## o-series models[\s\S]*?(?=## |$)/ },
      { name: 'Embeddings', pattern: /## Embeddings[\s\S]*?(?=## |$)/ },
      { name: 'Image Generation', pattern: /## Image generation models[\s\S]*?(?=## |$)/ },
      { name: 'Audio', pattern: /## Audio[\s\S]*?(?=## |$)/ },
      { name: 'Video Generation', pattern: /## Video generation models[\s\S]*?(?=## |$)/ },
    ];
    
    for (const category of modelCategories) {
      const match = markdown.match(category.pattern);
      if (match) {
        const section = match[0];
        const sectionModels = parseModelSection(section, category.name);
        models.push(...sectionModels);
      }
    }
    
    // Parse region availability tables
    const regionModels = parseRegionAvailability(markdown);
    models.push(...regionModels);
    
    // Remove duplicates based on model ID
    const uniqueModels = [];
    const seenIds = new Set();
    
    for (const model of models) {
      if (!seenIds.has(model.id)) {
        seenIds.add(model.id);
        uniqueModels.push(model);
      }
    }
    
    console.log(`[Azure OpenAI] Done. Models processed: ${uniqueModels.length}, saved: ${uniqueModels.length}, errors: 0`);
    return uniqueModels;
    
  } catch (error) {
    console.error('[Azure OpenAI] Error fetching models:', error.message);
    return [];
  }
}

function parseModelSection(section, category) {
  const models = [];
  
  // Extract model tables from the section
  const tableMatches = section.matchAll(/\| Model ID \|.*?\n\|.*?\n((?:\|.*?\n)*)/g);
  
  for (const match of tableMatches) {
    const tableRows = match[1].trim().split('\n');
    
    for (const row of tableRows) {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 3) {
        const modelId = cells[0];
        const description = cells[1];
        const contextWindow = cells[2];
        const maxOutput = cells[3] || null;
        const trainingData = cells[4] || null;
        
        // Skip separator rows and invalid model IDs
        if (modelId && modelId !== '---' && !modelId.includes('Model ID') && !modelId.match(/^[-:]+$/)) {
          const model = createModelFromData(modelId, description, contextWindow, maxOutput, trainingData, category);
          if (model) {
            models.push(model);
          }
        }
      }
    }
  }
  
  return models;
}

function parseRegionAvailability(markdown) {
  const models = [];
  
  // Find the Assistants region availability table
  const assistantsSection = markdown.match(/## Assistants \(Preview\)[\s\S]*?(?=## |$)/);
  if (!assistantsSection) {
    return models;
  }
  
  const section = assistantsSection[0];
  
  // Find the region availability table - look for the table that starts with Region and has model names
  // The table has a complex structure with line breaks, so we need to capture more content
  const tableMatch = section.match(/\| \*\*Region\*\*[\s\S]*?\|:-----------------[\s\S]*?\| australiaeast[\s\S]*?(?=\n## |$)/);
  if (!tableMatch) {
    return models;
  }
  
  const tableContent = tableMatch[0];
  
  // Extract the header row (the first line that contains model names)
  const headerMatch = tableContent.match(/\| \*\*Region\*\*.*?\n/);
  if (!headerMatch) {
    return models;
  }
  
  const headerRow = headerMatch[0];
  
  // Extract model names from the header row
  const modelNames = [];
  const headerCells = headerRow.split('|').map(cell => cell.trim()).filter(cell => cell && cell !== '**Region**');
  
  for (const cell of headerCells) {
    // Extract model name from format like "**gpt-4o**, **2024-05-13**"
    const modelMatches = cell.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of modelMatches) {
      const modelName = match[1].trim();
      if (modelName && !modelName.match(/^[-:]+$/) && modelName !== 'Region') {
        modelNames.push(modelName);
      }
    }
  }
  
  // Extract region data from the table content
  const regionMatches = tableContent.matchAll(/\| ([a-z]+)\s+\|([^|]*)\|/g);
  
  for (const match of regionMatches) {
    const region = match[1];
    const availabilityCells = match[2].split('|').map(cell => cell.trim());
    
    // Check which models are available in this region
    for (let i = 0; i < availabilityCells.length && i < modelNames.length; i++) {
      const availability = availabilityCells[i];
      
      if (availability === '✅') {
        const modelName = modelNames[i];
        if (modelName) {
          const model = createModelFromName(modelName, null, region);
          if (model) {
            models.push(model);
          }
        }
      }
    }
  }
  
  // Also try a different approach to capture all regions
  const allRegionMatches = tableContent.matchAll(/\| ([a-z]+)\s+\|/g);
  const regions = [];
  for (const match of allRegionMatches) {
    const region = match[1];
    if (region && !regions.includes(region)) {
      regions.push(region);
    }
  }
  
  // For each model and region combination, create a model entry
  for (const modelName of modelNames) {
    if (modelName && !modelName.match(/^\d{4}-\d{2}-\d{2}$/)) { // Skip version numbers
      for (const region of regions) {
        const model = createModelFromName(modelName, null, region);
        if (model) {
          models.push(model);
        }
      }
    }
  }
  
  return models;
}

function createModelFromData(modelId, description, contextWindow, maxOutput, trainingData, category) {
  try {
    // Parse context window
    let contextLimit = null;
    if (contextWindow) {
      const contextMatch = contextWindow.match(/(\d+(?:,\d+)*)/);
      if (contextMatch) {
        contextLimit = parseInt(contextMatch[1].replace(/,/g, ''));
      }
    }
    
    // Parse max output
    let outputLimit = null;
    if (maxOutput) {
      const outputMatch = maxOutput.match(/(\d+(?:,\d+)*)/);
      if (outputMatch) {
        outputLimit = parseInt(outputMatch[1].replace(/,/g, ''));
      }
    }
    
    // Determine modalities based on category and description
    const inputModalities = [];
    const outputModalities = [];
    
    if (description) {
      const desc = description.toLowerCase();
      if (desc.includes('text') || desc.includes('chat')) {
        inputModalities.push('text');
        outputModalities.push('text');
      }
      if (desc.includes('image') || desc.includes('vision')) {
        inputModalities.push('image');
      }
      if (desc.includes('audio')) {
        inputModalities.push('audio');
        outputModalities.push('audio');
      }
      if (desc.includes('embedding')) {
        outputModalities.push('embedding');
      }
    }
    
    // Set defaults if no modalities detected
    if (inputModalities.length === 0) inputModalities.push('text');
    if (outputModalities.length === 0) outputModalities.push('text');
    
    // Determine capabilities
    const hasReasoning = category.toLowerCase().includes('o-series') || (description && description.toLowerCase().includes('reasoning'));
    const hasToolCall = description && description.toLowerCase().includes('function calling');
    const hasTemperature = true; // Most Azure models support temperature
    
    return {
      id: modelId,
      name: modelId, // Use model ID as name for now
      release_date: null,
      last_updated: null,
      attachment: false,
      reasoning: hasReasoning,
      temperature: hasTemperature,
      knowledge: trainingData,
      tool_call: hasToolCall,
      open_weights: false, // Azure models are not open weights
      cost: {
        input: null,
        output: null,
      },
      limit: {
        context: contextLimit,
        output: outputLimit,
      },
      modalities: {
        input: inputModalities,
        output: outputModalities,
      },
      provider: 'Microsoft',
      regions: [], // Will be populated from region tables
      streaming_supported: true, // Most Azure models support streaming
      deployment_type: 'standard',
      training_data_cutoff: trainingData,
      max_request_tokens: contextLimit,
    };
  } catch (error) {
    console.error(`[Azure OpenAI] Error parsing model ${modelId}:`, error.message);
    return null;
  }
}

function createModelFromName(modelId, version, region) {
  try {
    return {
      id: modelId,
      name: modelId,
      release_date: null,
      last_updated: null,
      attachment: false,
      reasoning: modelId.includes('o1') || modelId.includes('o2'),
      temperature: true,
      knowledge: null,
      tool_call: true,
      open_weights: false,
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
      provider: 'Microsoft',
      regions: region ? [region] : [],
      streaming_supported: true,
      deployment_type: 'standard',
      version: version,
    };
  } catch (error) {
    console.error(`[Azure OpenAI] Error creating model from name ${modelId}:`, error.message);
    return null;
  }
}

export {
  fetchAzureModels,
  modelSchema,
}; 