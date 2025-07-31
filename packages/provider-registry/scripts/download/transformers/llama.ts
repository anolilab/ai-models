import type { Model } from '../../../src/schema.js';

/**
 * Raw model data extracted from Llama documentation table
 */
interface LlamaModelData {
  id: string;
  name: string;
  provider: string;
  inputModalities: string[];
  outputModalities: string[];
}

/**
 * Transforms Llama model data into the normalized structure.
 * 
 * @param models - Array of raw model data from Llama documentation
 * @returns Array of normalized model objects
 */
function transformLlamaModels(models: LlamaModelData[]): Model[] {
  return models.map(model => ({
    id: model.id,
    name: model.name,
    releaseDate: null,
    lastUpdated: null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: null,
    toolCall: true,
    openWeights: false,
    cost: {
      input: null,
      output: null,
      inputCacheHit: null,
    },
    limit: {
      context: model.id.includes('128e') ? 128000 :
               model.id.includes('16e') ? 16000 : 8192,
      output: null,
    },
    modalities: {
      input: model.inputModalities,
      output: model.outputModalities,
    },
    provider: model.provider,
    streamingSupported: true,
    vision: model.inputModalities.includes('image'),
    extendedThinking: false,
    preview: model.name.includes('(Preview)'),
  }));
}

/**
 * Fetches models using Puppeteer to get real-time data from the documentation.
 * @returns Promise that resolves to an array of transformed models
 */
async function fetchLlamaModels(): Promise<Model[]> {
  try {
    console.log('[Llama] Fetching with Puppeteer...');
    
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set a longer timeout and wait for network to be idle
    await page.goto('https://llama.developer.meta.com/docs/models', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Extract the model data from the table
    const models = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;
        
        const modelLink = cells[0].querySelector('a');
        const id = modelLink?.getAttribute('href')?.replace('#', '') || '';
        const name = cells[0].textContent?.trim() || '';
        const provider = cells[1].textContent?.trim() || '';
        const inputModalities = cells[2].textContent?.trim().split(',').map(m => m.trim().toLowerCase()) || [];
        const outputModalities = cells[3].textContent?.trim().split(',').map(m => m.trim().toLowerCase()) || [];
        
        return { id, name, provider, inputModalities, outputModalities };
      }).filter(Boolean) as LlamaModelData[];
    });
    
    await browser.close();
    
    if (models.length === 0) {
      throw new Error('[Llama] No models found with Puppeteer.');
    }
    
    console.log(`[Llama] Found ${models.length} models with Puppeteer`);
    return transformLlamaModels(models);
    
  } catch (error) {
    console.error('[Llama] Puppeteer fetch failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export {
  fetchLlamaModels,
  transformLlamaModels
}; 