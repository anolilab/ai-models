import React from 'react';
import { getProviderIcon, spriteSheet, isSvgIcon } from '@anolilab/provider-registry/icons';

interface ProviderIconProps {
  providerIcon: string | null;
  provider: string;
  className?: string;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  providerIcon, 
  provider, 
  className = "w-5 h-5" 
}) => {
  if (!providerIcon) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded`}>
        <span className="text-xs font-medium text-muted-foreground">
          {provider.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  // The providerIcon field contains the provider name directly (e.g., "amazon-bedrock", "openai")
  const providerName = providerIcon;
  if (!providerName) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded`}>
        <span className="text-xs font-medium text-muted-foreground">
          {provider.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  // Get the icon data from the provider registry
  const iconData = getProviderIcon(providerName);
  
  if (iconData) {
    // Check if it's an SVG icon (starts with #) or base64 icon
    if (isSvgIcon(providerName)) {
      // SVG icon - use sprite sheet
      return (
        <div className={`${className} flex items-center justify-center bg-muted rounded overflow-hidden`}>
          <svg className="w-full h-full">
            <use href={iconData} />
          </svg>
        </div>
      );
    } else {
      // Base64 icon - use img tag
      return (
        <div className={`${className} flex items-center justify-center bg-muted rounded overflow-hidden`}>
          <img 
            src={iconData}
            alt={provider}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
  }

  // Fallback to text if no icon is found
  return (
    <div className={`${className} flex items-center justify-center bg-muted rounded`}>
      <span className="text-xs font-medium text-muted-foreground">
        {providerName.toUpperCase().slice(0, 2)}
      </span>
    </div>
  );
};

// Component to inject the sprite sheet into the DOM
export const IconSpriteSheet: React.FC = () => {
  React.useEffect(() => {
    // Inject the sprite sheet into the DOM if it doesn't exist
    if (!document.getElementById('icon-sprite-sheet')) {
      const spriteElement = document.createElement('div');
      spriteElement.id = 'icon-sprite-sheet';
      spriteElement.innerHTML = spriteSheet;
      spriteElement.style.display = 'none';
      document.body.appendChild(spriteElement);
    }
  }, []);

  return null;
};