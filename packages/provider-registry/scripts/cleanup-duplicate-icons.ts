import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const LOBEHUB_ICONS_DIR = join(process.cwd(), 'node_modules', '@lobehub', 'icons-static-svg', 'icons');
const CUSTOM_ICONS_DIR = join(process.cwd(), 'assets', 'icons', 'providers');

/**
 * Gets all available LobeHub icon names
 */
function getLobeHubIconNames(): Set<string> {
  try {
    const files = readdirSync(LOBEHUB_ICONS_DIR);
    const iconNames = new Set<string>();
    
    for (const file of files) {
      if (file.endsWith('.svg')) {
        // Extract base name without extension and variants
        const baseName = file.replace(/\.svg$/, '')
          .replace(/-color$/, '')
          .replace(/-text$/, '')
          .replace(/-brand$/, '')
          .replace(/-brand-color$/, '');
        iconNames.add(baseName);
      }
    }
    
    return iconNames;
  } catch (error) {
    console.error('Error reading LobeHub icons directory:', error);
    return new Set();
  }
}

/**
 * Gets all custom icon names
 */
function getCustomIconNames(): Set<string> {
  try {
    const files = readdirSync(CUSTOM_ICONS_DIR);
    const iconNames = new Set<string>();
    
    for (const file of files) {
      if (file.endsWith('.svg') || file.endsWith('.png')) {
        // Extract base name without extension
        const baseName = file.replace(/\.(svg|png)$/, '');
        iconNames.add(baseName);
      }
    }
    
    return iconNames;
  } catch (error) {
    console.error('Error reading custom icons directory:', error);
    return new Set();
  }
}

/**
 * Maps custom icon names to LobeHub equivalents
 */
function mapCustomToLobeHub(): Record<string, string> {
  const mapping: Record<string, string> = {
    // Direct matches
    'amazon': 'amazon',
    'anthropic': 'anthropic',
    'microsoft': 'microsoft',
    'openai': 'openai',
    'meta': 'meta',
    'mistral': 'mistral',
    'cohere': 'cohere',
    'perplexity': 'perplexity',
    'nvidia': 'nvidia',
    'together': 'together',
    'writer': 'writer',
    'inflection': 'inflection',
    'cerebras': 'cerebras',
    'featherless': 'featherless',
    'eleutherai': 'eleutherai',
    'rekaai': 'reka-ai',
    'sambanova': 'sambanova',
    'groq': 'groq',
    'cloudflare': 'cloudflare',
    'lambda': 'lambda',
    'mancer': 'mancer',
    'novita': 'novita',
    'hyperbolic': 'hyperbolic',
    'deepinfra': 'deepinfra',
    'ncompass': 'ncompass',
    'nineteen': 'nineteen',
    'nscale': 'nscale',
    'opengvlab': 'opengvlab',
    'z-ai': 'z-ai',
    'baidu': 'baidu',
    'tencent': 'tencent',
    'bytedance': 'bytedance',
    'kluster': 'kluster',
    'atoma': 'atoma',
    'alibaba': 'alibaba',
    'targon': 'targon',
    'phala': 'phala',
    'chutes': 'chutes',
    'atlascloud': 'atlascloud',
    'baseten': 'baseten',
    'nextbit': 'nextbit',
    'gmicloud': 'gmicloud',
    'enfer': 'enfer',
    'openinference': 'openinference',
    'parasail': 'parasail',
    'ubicloud': 'ubicloud',
    'crusoe': 'crusoe',
    'nebius': 'nebius',
    'friendli': 'friendli',
    'inferencenet': 'inferencenet',
    'google-ai-studio': 'google-ai-studio',
    'avian': 'avian',
    'ai21': 'ai21',
    'moonshotai': 'moonshot',
    'arcee-ai': 'arcee-ai',
    'sarvamai': 'sarvam-ai',
    'switchpoint': 'switchpoint',
    'qwen': 'qwen',
    'liquid': 'liquid',
    'infermatic': 'infermatic',
    'minimax': 'minimax',
    'aion-labs': 'aionlabs',
    'scb10x': 'scb10x',
    'agentica-org': 'agentica-org',
    'arliai': 'arliai',
    'alfredpros': 'alfredpros',
    'shisa-ai': 'shisa-ai',
    'thudm': 'thudm',
    'tngtech': 'tngtech',
    'inception': 'inception',
    'sophosympatheia': 'sophosympatheia',
    'cognitivecomputations': 'cognitive-computations',
    'nothingiisreal': 'nothing-is-real',
    'thedrummer': 'the-drummer',
    'anthracite-org': 'anthracite-org',
    'pygmalionai': 'pygmalion-ai',
    'neversleep': 'neversleep',
    'undi95': 'undi95',
    'gryphe': 'gryphe',
    'alpindale': 'alpindale',
    'nousresearch': 'nousresearch',
    'meta-llama': 'meta',
    'openrouter': 'openrouter',
    'mistralai': 'mistral',
    'luma': 'luma',
    'model-scope': 'modelscope',
    
    // Keep these custom icons (not in LobeHub)
    'morph': '', // Keep - custom icon
    'requesty': '', // Keep - custom icon
    'venice': '', // Keep - custom icon
    'x-ai': '', // Keep - custom icon
    'amazon-bedrock': '', // Keep - custom icon
  };
  
  return mapping;
}

function cleanupDuplicateIcons(): void {
  console.log('🧹 Starting cleanup of duplicate icons...\n');
  
  const lobeHubIcons = getLobeHubIconNames();
  const customIcons = getCustomIconNames();
  const mapping = mapCustomToLobeHub();
  
  console.log(`📊 Found ${lobeHubIcons.size} LobeHub icons`);
  console.log(`📊 Found ${customIcons.size} custom icons\n`);
  
  const iconsToRemove: string[] = [];
  const iconsToKeep: string[] = [];
  
  for (const customIcon of customIcons) {
    const lobeHubEquivalent = mapping[customIcon];
    
    if (lobeHubEquivalent && lobeHubEquivalent !== '' && lobeHubIcons.has(lobeHubEquivalent)) {
      iconsToRemove.push(customIcon);
      console.log(`🗑️  Will remove: ${customIcon} (available as ${lobeHubEquivalent} in LobeHub)`);
    } else {
      iconsToKeep.push(customIcon);
      console.log(`✅ Will keep: ${customIcon} (${lobeHubEquivalent ? 'not in LobeHub' : 'custom icon'})`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   • Icons to remove: ${iconsToRemove.length}`);
  console.log(`   • Icons to keep: ${iconsToKeep.length}`);
  
  if (iconsToRemove.length === 0) {
    console.log('\n✅ No duplicate icons found to remove!');
    return;
  }
  
  console.log('\n🗑️  Removing duplicate icons...');
  
  let removedCount = 0;
  for (const iconName of iconsToRemove) {
    try {
      // Try to remove both .svg and .png versions
      const svgPath = join(CUSTOM_ICONS_DIR, `${iconName}.svg`);
      const pngPath = join(CUSTOM_ICONS_DIR, `${iconName}.png`);
      
      try {
        unlinkSync(svgPath);
        console.log(`   ✅ Removed ${iconName}.svg`);
        removedCount++;
      } catch (error) {
        // SVG file doesn't exist, try PNG
      }
      
      try {
        unlinkSync(pngPath);
        console.log(`   ✅ Removed ${iconName}.png`);
        removedCount++;
      } catch (error) {
        // PNG file doesn't exist
      }
    } catch (error) {
      console.warn(`   ⚠️  Failed to remove ${iconName}:`, error);
    }
  }
  
  console.log(`\n✅ Cleanup complete! Removed ${removedCount} duplicate icon files.`);
  console.log(`📁 Kept ${iconsToKeep.length} custom icons for providers not in LobeHub.`);
}

cleanupDuplicateIcons(); 