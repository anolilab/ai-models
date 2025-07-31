import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PROVIDER_ICON_MAP } from './config';

const ICONS_DIR = join(process.cwd(), 'assets', 'icons', 'providers');
const OUTPUT_FILE = join(process.cwd(), 'src', 'icons-sprite.ts');

interface IconData {
  [key: string]: string;
}

function extractSvgContent(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  // Extract the SVG content, removing the outer <svg> tags
  const match = content.match(/<svg[^>]*>(.*?)<\/svg>/s);
  if (!match) {
    throw new Error(`Invalid SVG file: ${filePath}`);
  }
  
  let svgContent = match[1].trim();
  
  // Remove any <style> tags and their content to prevent CSS conflicts
  svgContent = svgContent.replace(/<style[^>]*>.*?<\/style>/gs, '');
  
  // Remove any CSS media queries that might affect icon colors
  svgContent = svgContent.replace(/@media[^{]*\{[^}]*\}/g, '');
  
  return svgContent;
}

function fileToBase64(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp'
  };
  
  const mimeType = mimeTypes[ext || ''] || 'image/png';
  return `data:${mimeType};base64,${base64}`;
}

function generateSpriteSheet(): void {
  const files = readdirSync(ICONS_DIR);
  const iconFiles = files.filter(file => /\.(svg|png|jpg|jpeg|webp)$/.test(file));
  
  if (iconFiles.length === 0) {
    console.log('No icon files found');
    return;
  }

  const svgIcons: IconData = {};
  const base64Icons: IconData = {};
  let spriteContent = '<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">\n';
  
  iconFiles.forEach((file) => {
    const filePath = join(ICONS_DIR, file);
    const providerName = file.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
    const ext = file.split('.').pop()?.toLowerCase();
    
    try {
      if (ext === 'svg') {
        // Handle SVG files - add to sprite sheet
        const svgContent = extractSvgContent(filePath);
        const symbolId = `icon-${providerName}`;
        
        // Add to sprite sheet
        spriteContent += `  <symbol id="${symbolId}" viewBox="0 0 24 24">\n`;
        spriteContent += `    ${svgContent}\n`;
        spriteContent += `  </symbol>\n`;
        
        // Store reference
        svgIcons[providerName] = symbolId;
      } else {
        // Handle non-SVG files - convert to base64
        const base64Data = fileToBase64(filePath);
        base64Icons[providerName] = base64Data;
      }
    } catch (error) {
      console.warn(`Warning: Could not process ${file}:`, error);
    }
  });
  
  spriteContent += '</svg>';

  // Create reverse mapping from icon files to provider names
  const iconToProviderMap: Record<string, string> = {};
  Object.entries(PROVIDER_ICON_MAP).forEach(([providerName, iconFile]) => {
    if (iconFile) {
      const iconName = iconFile.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
      iconToProviderMap[iconName] = providerName;
    }
  });

  // Generate TypeScript file
  const tsContent = `// Auto-generated file - do not edit manually
// Generated from ${ICONS_DIR}

// SVG icons in sprite sheet
export const iconSymbols: Record<string, string> = ${JSON.stringify(svgIcons, null, 2)} as const;

// Base64 icons for non-SVG files
export const base64Icons: Record<string, string> = ${JSON.stringify(base64Icons, null, 2)} as const;

// Provider name to icon file mapping
export const providerIconMap: Record<string, string> = ${JSON.stringify(PROVIDER_ICON_MAP, null, 2)} as const;

// Combined icon mapping
export const allIcons: Record<string, string> = {
  ...iconSymbols,
  ...base64Icons
} as const;

export const spriteSheet = \`${spriteContent}\`;

export function getProviderIcon(providerName: string): string | null {
  // First check if the provider name maps to an icon file
  const iconFile = providerIconMap[providerName];
  if (iconFile) {
    const iconName = iconFile.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
    
    // Check if it's an SVG icon in the sprite sheet
    const symbolId = iconSymbols[iconName];
    if (symbolId) {
      return \`#\${symbolId}\`;
    }
    
    // Then check if it's a base64 icon
    const base64Icon = base64Icons[iconName];
    if (base64Icon) {
      return base64Icon;
    }
  }
  
  // Fallback: check if the provider name directly matches an icon
  const symbolId = iconSymbols[providerName];
  if (symbolId) {
    return \`#\${symbolId}\`;
  }
  
  const base64Icon = base64Icons[providerName];
  if (base64Icon) {
    return base64Icon;
  }
  
  return null;
}

export function hasProviderIcon(providerName: string): boolean {
  // First check if the provider name maps to an icon file
  const iconFile = providerIconMap[providerName];
  if (iconFile) {
    const iconName = iconFile.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
    return iconName in iconSymbols || iconName in base64Icons;
  }
  
  // Fallback: check if the provider name directly matches an icon
  return providerName in iconSymbols || providerName in base64Icons;
}

export function isSvgIcon(providerName: string): boolean {
  // First check if the provider name maps to an icon file
  const iconFile = providerIconMap[providerName];
  if (iconFile) {
    const iconName = iconFile.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
    return iconName in iconSymbols;
  }
  
  // Fallback: check if the provider name directly matches an icon
  return providerName in iconSymbols;
}

export function isBase64Icon(providerName: string): boolean {
  return providerName in base64Icons;
}
`;

  writeFileSync(OUTPUT_FILE, tsContent);
  console.log(`Generated icon system with ${Object.keys(svgIcons).length} SVG icons and ${Object.keys(base64Icons).length} base64 icons in ${OUTPUT_FILE}`);
}

generateSpriteSheet(); 