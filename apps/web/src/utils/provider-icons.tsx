import { getIcon, isSvgIcon, spriteSheet } from "@anolilab/provider-registry/icons";
import React from "react";

interface ProviderIconProps {
    className?: string;
    provider: string;
    providerIcon: string | null;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ className = "w-5 h-5", provider, providerIcon }) => {
    if (!providerIcon) {
        return (
            <div className={`${className} bg-muted flex items-center justify-center rounded`}>
                <span className="text-muted-foreground text-xs font-medium">{provider.slice(0, 2).toUpperCase()}</span>
            </div>
        );
    }

    // Get the icon data from the provider registry
    const iconData = getIcon(providerIcon);

    if (iconData) {
        // Check if it's an SVG icon or base64 icon
        if (isSvgIcon(providerIcon)) {
            return (
                <div className={`${className} flex items-center justify-center overflow-hidden rounded bg-white/50 p-0.5`}>
                    <svg className="h-full w-full">
                        <use href={iconData} />
                    </svg>
                </div>
            );
        }

        // Base64 icon - use img tag
        return (
                <div className={`${className} flex items-center justify-center overflow-hidden rounded bg-white/50 p-0.5`}>
                    <img alt={provider} className="h-full w-full object-contain" src={iconData} />
                </div>
        );
    }

    // Fallback to text if no icon is found
    return (
        <div className={`${className} bg-muted flex items-center justify-center rounded`}>
            <span className="text-muted-foreground text-xs font-medium">{providerIcon.toUpperCase().slice(0, 2)}</span>
        </div>
    );
};

// Component to inject the sprite sheet into the DOM
export const IconSpriteSheet: React.FC = () => {
    React.useEffect(() => {
        // Inject the sprite sheet into the DOM if it doesn't exist
        if (!document.getElementById("icon-sprite-sheet")) {
            const spriteElement = document.createElement("div");

            spriteElement.id = "icon-sprite-sheet";
            spriteElement.innerHTML = spriteSheet;
            spriteElement.style.display = "none";

            document.body.appendChild(spriteElement);
        }
    }, []);

    return null;
};
