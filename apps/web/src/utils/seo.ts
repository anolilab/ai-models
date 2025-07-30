import type { MetaHTMLAttributes, LinkHTMLAttributes } from "react";

// Define the properties the SEO utility can accept
interface SeoProps {
    title: string;
    description?: string;
    keywords?: string;
    image: string;
    twitterImage: string; // Added for specific Twitter image
    url?: string; // Full canonical URL for the page
    type?: "website" | "article" | "product"; // Default: 'website'
    siteName?: string; // e.g., "Anolilab"
    robots?: string; // e.g., "index, follow", "noindex, nofollow" (Default: "index, follow")
    twitterHandle?: string; // e.g., "@anolilab"
}

// Define the return type: separate arrays for title, meta, and links
interface SeoOutput {
    title: string;
    meta: MetaHTMLAttributes<HTMLMetaElement>[];
    links: (LinkHTMLAttributes<HTMLLinkElement> & { rel: string })[];
}

/**
 * Generates title string, meta tags, and link tags for SEO.
 */
export const seo = ({
    title,
    description,
    keywords,
    image,
    twitterImage, // Added
    url,
    type = "website", // Default type
    siteName,
    robots = "index, follow", // Default robots value
    twitterHandle,
}: SeoProps): SeoOutput => {
    const metaTags: MetaHTMLAttributes<HTMLMetaElement>[] = [];
    const linkTags: (LinkHTMLAttributes<HTMLLinkElement> & { rel: string })[] = [];

    // Helper to add meta tag if content exists
    const addMeta = (attrs: MetaHTMLAttributes<HTMLMetaElement>) => {
        if (attrs.content != null || attrs.name != null || attrs.property != null) {
            metaTags.push(attrs);
        }
    };

    // --- Essential Meta ---
    addMeta({ name: "description", content: description });
    addMeta({ name: "keywords", content: keywords });
    addMeta({ name: "robots", content: robots });

    // --- Static Meta ---
    addMeta({ name: "viewport", content: "width=device-width, initial-scale=1" });
    addMeta({ charSet: "utf-8" });

    // --- Open Graph ---
    addMeta({ property: "og:title", content: title });
    addMeta({ property: "og:description", content: description });
    addMeta({ property: "og:url", content: url });
    addMeta({ property: "og:type", content: type });
    addMeta({ property: "og:site_name", content: siteName });
    addMeta({ property: "og:image", content: image });

    // --- Twitter Card ---
    addMeta({ name: "twitter:card", content: twitterImage ? "summary_large_image" : "summary" });
    addMeta({ name: "twitter:title", content: title });
    addMeta({ name: "twitter:description", content: description });
    addMeta({ name: "twitter:image", content: twitterImage });
    addMeta({ name: "twitter:site", content: twitterHandle });

    // --- Canonical Link ---
    if (url) {
        linkTags.push({ rel: "canonical", href: url });
    }

    return {
        title: title, // Return title directly as a string
        meta: metaTags,
        links: linkTags,
    };
};
