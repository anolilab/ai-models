import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PROVIDER_ICON_MAP } from './config';

const ICONS_DIR = join(process.cwd(), 'assets', 'icons', 'providers');
const OUTPUT_FILE = join(process.cwd(), 'src', 'icons-sprite.ts');

interface IconData {
  [key: string]: string;
}

/**
 * Validates that SVG content contains valid SVG elements
 */
function validateSvgContent(svgContent: string): boolean {
  // Basic validation - check for common SVG elements
  const hasValidElements = /<(path|rect|circle|ellipse|line|polyline|polygon|g|defs|use|text|image)[^>]*>/i.test(svgContent);
  const hasValidStructure = !/<script|<object|<embed/i.test(svgContent); // No potentially harmful elements
  
  return hasValidElements && hasValidStructure;
}

/**
 * Checks if SVG content extends beyond the viewBox and scales it if necessary
 */
function ensureContentFitsViewBox(svgContent: string, viewBox: string): string {
  // Special case for Meta icon - preserve its original design
  if (svgContent.includes('lobe-icons-meta-fill-')) {
    return svgContent;
  }
  
  // Parse viewBox
  const viewBoxMatch = viewBox.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
  if (!viewBoxMatch) return svgContent;
  
  const [, x, y, width, height] = viewBoxMatch;
  const viewBoxWidth = parseFloat(width);
  const viewBoxHeight = parseFloat(height);
  
  // Extract all coordinates from paths and other elements
  const coordinates: number[] = [];
  
  // Find all numbers in path data (only actual path coordinates)
  const pathMatches = svgContent.match(/d="[^"]*"/g);
  if (pathMatches) {
    pathMatches.forEach(match => {
      const numbers = match.match(/-?\d+(?:\.\d+)?/g);
      if (numbers) {
        coordinates.push(...numbers.map(n => parseFloat(n)));
      }
    });
  }
  
  // Find coordinates in other elements (rect, circle, etc.) but exclude gradient definitions
  const coordMatches = svgContent.match(/(?:x|y|width|height|cx|cy|r)="[^"]*"/g);
  if (coordMatches) {
    coordMatches.forEach(match => {
      // Skip gradient-related attributes
      if (match.includes('x1=') || match.includes('x2=') || match.includes('y1=') || match.includes('y2=')) {
        return;
      }
      const numbers = match.match(/-?\d+(?:\.\d+)?/g);
      if (numbers) {
        coordinates.push(...numbers.map(n => parseFloat(n)));
      }
    });
  }
  
  if (coordinates.length === 0) return svgContent;
  
  // Find the bounds of the content
  const minX = Math.min(...coordinates.filter((_, i) => i % 2 === 0));
  const maxX = Math.max(...coordinates.filter((_, i) => i % 2 === 0));
  const minY = Math.min(...coordinates.filter((_, i) => i % 2 === 1));
  const maxY = Math.max(...coordinates.filter((_, i) => i % 2 === 1));
  
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  
  // Check if content extends beyond viewBox with tolerance
  // Use tolerance to avoid unnecessary scaling for icons that are already close to the right size
  const tolerance = 5; // Allow 5 units of overflow to avoid over-scaling icons that are already properly sized
  const extendsBeyond = minX < -tolerance || maxX > viewBoxWidth + tolerance || minY < -tolerance || maxY > viewBoxHeight + tolerance;
  
  if (!extendsBeyond) {
    return svgContent;
  }
  
  // Additional check: if the content is already very close to the target size, don't scale
  // This prevents over-scaling icons that are designed for the target viewBox
  const contentRatio = Math.max(contentWidth / viewBoxWidth, contentHeight / viewBoxHeight);
  if (contentRatio < 1.2) {
    return svgContent; // If content is less than 20% larger than viewBox, don't scale
  }
  
  // Calculate scale to fit content within viewBox with some padding
  const padding = 0.5; // 0.5 unit padding
  const scaleX = (viewBoxWidth - padding * 2) / contentWidth;
  const scaleY = (viewBoxHeight - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
  
  if (scale >= 1) return svgContent; // No scaling needed
  
  // Apply transform to scale and center the content
  const centerX = (viewBoxWidth - contentWidth * scale) / 2;
  const centerY = (viewBoxHeight - contentHeight * scale) / 2;
  const translateX = centerX - minX * scale;
  const translateY = centerY - minY * scale;
  
  // Wrap content in a group with transform
  return `<g transform="translate(${translateX} ${translateY}) scale(${scale})">${svgContent}</g>`;
}

/**
 * Optimizes SVG content by removing unnecessary attributes, whitespace, and comments
 */
function optimizeSvgContent(svgContent: string): string {
  let optimized = svgContent;
  
  // Remove comments
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove unnecessary whitespace and newlines
  optimized = optimized.replace(/\s+/g, ' ');
  optimized = optimized.replace(/>\s+</g, '><');
  optimized = optimized.trim();
  
  // Remove common unnecessary attributes that don't affect rendering
  optimized = optimized.replace(/\s+(xmlns:xlink|xlink:href|xml:space|xml:lang|enable-background|fill-rule|clip-rule)="[^"]*"/g, '');
  
  // Remove empty style attributes
  optimized = optimized.replace(/\s+style="\s*"/g, '');
  
  // Remove empty class attributes
  optimized = optimized.replace(/\s+class="\s*"/g, '');
  
  // Remove empty id attributes (except for defs and symbols)
  optimized = optimized.replace(/\s+id="\s*"/g, '');
  
  // Preserve title elements for accessibility (but remove empty ones)
  optimized = optimized.replace(/<title>\s*<\/title>/g, '');
  
  // Remove data-* attributes that are often added by design tools
  optimized = optimized.replace(/\s+data-[^=]*="[^"]*"/g, '');
  
  // Remove Adobe Illustrator specific attributes
  optimized = optimized.replace(/\s+(sodipodi|inkscape):[^=]*="[^"]*"/g, '');
  
  // Remove Sketch/Figma specific attributes
  optimized = optimized.replace(/\s+(sketch|figma):[^=]*="[^"]*"/g, '');
  
  // Remove empty groups and elements that don't contribute to rendering
  optimized = optimized.replace(/<g[^>]*>\s*<\/g>/g, '');
  optimized = optimized.replace(/<path[^>]*\/>\s*<path[^>]*\/>/g, (match) => {
    // Keep only non-empty paths
    const paths = match.match(/<path[^>]*\/>/g) || [];
    return paths.filter(path => {
      const hasD = path.includes('d=');
      const hasFill = path.includes('fill=') && !path.includes('fill="none"');
      return hasD || hasFill;
    }).join('');
  });
  
  // Preserve original viewBox or use 24x24 as default
  // Only normalize if the viewBox is clearly wrong (like 0 0 0 0)
  optimized = optimized.replace(/viewBox="0 0 0 0"/g, 'viewBox="0 0 24 24"');
  
  // Remove width and height attributes from inner elements (keep them on root svg)
  optimized = optimized.replace(/(<[^>]*)\s+(width|height)="[^"]*"/g, '$1');
  
  // Clean up multiple spaces
  optimized = optimized.replace(/\s{2,}/g, ' ');
  
  return optimized;
}

function extractSvgContent(filePath: string): { content: string; viewBox: string } {
  const content = readFileSync(filePath, 'utf-8');
  // Extract the SVG content and attributes
  const svgMatch = content.match(/<svg([^>]*)>(.*?)<\/svg>/s);
  if (!svgMatch) {
    throw new Error(`Invalid SVG file: ${filePath}`);
  }
  
  const svgAttributes = svgMatch[1];
  let svgContent = svgMatch[2].trim();
  
  // Extract viewBox from original SVG
  let viewBox = '0 0 24 24'; // default
  const viewBoxMatch = svgAttributes.match(/viewBox="([^"]*)"/);
  if (viewBoxMatch) {
    viewBox = viewBoxMatch[1];
  }
  
  // Remove any <style> tags and their content to prevent CSS conflicts
  svgContent = svgContent.replace(/<style[^>]*>.*?<\/style>/gs, '');
  
  // Remove any CSS media queries that might affect icon colors
  svgContent = svgContent.replace(/@media[^{]*\{[^}]*\}/g, '');
  
  // Extract defs section (gradient definitions) to keep them outside the transform group
  const defsMatch = svgContent.match(/(<defs[^>]*>.*?<\/defs>)/s);
  const defsContent = defsMatch ? defsMatch[1] : '';
  
  // Remove defs from the main content
  svgContent = svgContent.replace(/<defs[^>]*>.*?<\/defs>/s, '');
  
  // Optimize the SVG content
  svgContent = optimizeSvgContent(svgContent);
  
  // Ensure content fits within viewBox
  svgContent = ensureContentFitsViewBox(svgContent, viewBox);
  
  // Add defs back at the beginning (before the transform group)
  if (defsContent) {
    svgContent = defsContent + '\n' + svgContent;
  }
  
  // Validate the optimized content
  if (!validateSvgContent(svgContent)) {
    console.warn(`Warning: Optimized SVG content for ${filePath} may be invalid`);
  }
  
  return { content: svgContent, viewBox };
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
  
  // Optimization statistics
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let optimizedCount = 0;
  
  iconFiles.forEach((file) => {
    const filePath = join(ICONS_DIR, file);
    const providerName = file.replace(/\.(svg|png|jpg|jpeg|webp)$/, '');
    const ext = file.split('.').pop()?.toLowerCase();
    
    try {
      if (ext === 'svg') {
        // Handle SVG files - add to sprite sheet
        const originalContent = readFileSync(filePath, 'utf-8');
        const originalSize = originalContent.length;
        totalOriginalSize += originalSize;
        
        const { content: svgContent, viewBox } = extractSvgContent(filePath);
        const optimizedSize = svgContent.length;
        totalOptimizedSize += optimizedSize;
        optimizedCount++;
        
        const symbolId = `icon-${providerName}`;
        
        // Add to sprite sheet with original viewBox
        spriteContent += `  <symbol id="${symbolId}" viewBox="${viewBox}">\n`;
        spriteContent += `    ${svgContent}\n`;
        spriteContent += `  </symbol>\n`;
        
        // Store reference
        svgIcons[providerName] = symbolId;
        
        // Log optimization results for this file
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`✓ Optimized ${file}: ${originalSize} → ${optimizedSize} bytes (${reduction}% reduction)`);
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
  
  // Log optimization summary
  if (optimizedCount > 0) {
    const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    const totalBytesSaved = totalOriginalSize - totalOptimizedSize;
    console.log(`\n📊 SVG Optimization Summary:`);
    console.log(`   • ${optimizedCount} SVG files optimized`);
    console.log(`   • Total size: ${totalOriginalSize} → ${totalOptimizedSize} bytes`);
    console.log(`   • ${totalReduction}% reduction (${totalBytesSaved} bytes saved)`);
  }
  
  console.log(`\n✅ Generated icon system with ${Object.keys(svgIcons).length} SVG icons and ${Object.keys(base64Icons).length} base64 icons in ${OUTPUT_FILE}`);
}

generateSpriteSheet(); 