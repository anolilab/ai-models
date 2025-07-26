/**
 * Llama transformer using Puppeteer for real-time data only (no static fallback)
 */

const transformLlamaModels = (models) => {
  return models.map(model => ({
    id: model.id,
    name: model.name,
    release_date: null,
    last_updated: null,
    attachment: false,
    reasoning: false,
    temperature: true,
    knowledge: null,
    tool_call: true,
    open_weights: false,
    cost: {
      input: null,
      output: null,
      input_cache_hit: null,
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
    streaming_supported: true,
    vision: model.inputModalities.includes('image'),
    extended_thinking: false,
    preview: model.name.includes('(Preview)'),
  }));
};

/**
 * Fetch models using Puppeteer to get real-time data from the documentation
 */
async function fetchLlamaModels() {
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
        const name = cells[0].textContent.trim();
        const provider = cells[1].textContent.trim();
        const inputModalities = cells[2].textContent.trim().split(',').map(m => m.trim().toLowerCase());
        const outputModalities = cells[3].textContent.trim().split(',').map(m => m.trim().toLowerCase());
        
        return { id, name, provider, inputModalities, outputModalities };
      }).filter(Boolean);
    });
    
    await browser.close();
    
    if (models.length === 0) {
      throw new Error('[Llama] No models found with Puppeteer.');
    }
    
    console.log(`[Llama] Found ${models.length} models with Puppeteer`);
    return transformLlamaModels(models);
    
  } catch (error) {
    console.error('[Llama] Puppeteer fetch failed:', error.message);
    throw error;
  }
}

export {
  fetchLlamaModels,
  transformLlamaModels
}; 