import type { LinkHTMLAttributes, MetaHTMLAttributes } from "react";

// Define the properties the SEO utility can accept
interface SeoProperties {
    description?: string;
    image: string;
    keywords?: string;
    robots?: string; // e.g., "index, follow", "noindex, nofollow" (Default: "index, follow")
    siteName?: string; // e.g., "Anolilab"
    title: string;
    twitterHandle?: string; // e.g., "@anolilab"
    twitterImage: string; // Added for specific Twitter image
    type?: "website" | "article" | "product"; // Default: 'website'
    url?: string; // Full canonical URL for the page
}

// Define the return type: separate arrays for meta and links
interface SeoOutput {
    links: (LinkHTMLAttributes<HTMLLinkElement> & { rel: string })[];
    meta: MetaHTMLAttributes<HTMLMetaElement>[];
}

/**
 * Generates title string, meta tags, and link tags for SEO.
 */
const seo = ({
    description,
    image,
    keywords,
    robots = "index, follow", // Default robots value
    siteName,
    title,
    twitterHandle,
    twitterImage, // Added
    type = "website", // Default type
    url,
}: SeoProperties): SeoOutput => {
    const metaTags: MetaHTMLAttributes<HTMLMetaElement>[] = [];
    const linkTags: (LinkHTMLAttributes<HTMLLinkElement> & { rel: string })[] = [];

    // Helper to add meta tag if content exists
    const addMeta = (attributes: MetaHTMLAttributes<HTMLMetaElement>) => {
        if (attributes.content !== undefined || attributes.name !== undefined || attributes.property !== undefined) {
            metaTags.push(attributes);
        }
    };

    // --- Title and Essential Meta ---
    addMeta({ title });
    addMeta({ content: description, name: "description" });
    addMeta({ content: keywords, name: "keywords" });
    addMeta({ content: robots, name: "robots" });

    // --- Static Meta ---
    addMeta({ content: "width=device-width, initial-scale=1", name: "viewport" });
    addMeta({ charSet: "utf8" });

    // --- Open Graph ---
    addMeta({ content: title, property: "og:title" });
    addMeta({ content: description, property: "og:description" });
    addMeta({ content: url, property: "og:url" });
    addMeta({ content: type, property: "og:type" });
    addMeta({ content: siteName, property: "og:site_name" });
    addMeta({ content: image, property: "og:image" });

    // --- Twitter Card ---
    addMeta({ content: twitterImage ? "summary_large_image" : "summary", name: "twitter:card" });
    addMeta({ content: title, name: "twitter:title" });
    addMeta({ content: description, name: "twitter:description" });
    addMeta({ content: twitterImage, name: "twitter:image" });
    addMeta({ content: twitterHandle, name: "twitter:site" });

    // --- Canonical Link ---
    if (url) {
        linkTags.push({ href: url, rel: "canonical" });
    }

    return {
        links: linkTags,
        meta: metaTags,
    };
};

export default seo;
