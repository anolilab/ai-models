import "unfonts.css";

import { ConsentManagerDialog, CookieBanner } from "@c15t/react";
import { baseTranslations } from "@c15t/translations";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
// eslint-disable-next-line import/no-extraneous-dependencies
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { LinkHTMLAttributes, MetaHTMLAttributes } from "react";

import Loader from "@/components/loader";
import { Toaster } from "@/components/ui/sonner";
import ConsentManagerProvider from "@/providers/consent-manager";
import { AnalyticsProvider } from "@/providers/posthog";
import { IconSpriteSheet } from "@/utils/provider-icons";
import seo from "@/utils/seo";

import appCss from "../index.css?url";

type LinkElement = LinkHTMLAttributes<HTMLLinkElement> & { rel: string };
type MetaElement = MetaHTMLAttributes<HTMLMetaElement>;

let siteBaseUrl = import.meta.env.VITE_SITE_BASE_URL;

if (siteBaseUrl && !siteBaseUrl.endsWith("/")) {
    siteBaseUrl += "/";
}

const siteName = "AI Models Registry | Anolilab";
const defaultTitle = "AI Models Registry | Comprehensive Database of AI Models and Providers";
const defaultDescription
    = "Explore a comprehensive registry of AI models from leading providers. Find the perfect AI model for your project with detailed information, comparisons, and provider details.";
const twitterHandle = "@anolilab";
const defaultKeywords
    = "AI models, artificial intelligence, machine learning, AI providers, OpenAI, Anthropic, Google AI, Hugging Face, AI comparison, model registry, AI development, LLM, large language models";
const defaultOgImage = `${siteBaseUrl}images/og.png`;
const defaultTwitterImage = `${siteBaseUrl}images/og.png`;

const RootDocument = () => {
    const isFetching = useRouterState({ select: (s) => s.isLoading });

    return (
        <html className="dark" lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="h-screen w-screen" suppressHydrationWarning={true}>
                <ConsentManagerProvider
                    options={{
                        mode: "offline",
                        store: {
                            initialGdprTypes: ["measurement", "necessary"],
                            translationConfig: {
                                defaultLanguage: "en",
                                disableAutoLanguageSwitch: true,
                                translations: {
                                    de: baseTranslations.de,
                                    en: baseTranslations.en,
                                },
                            },
                        },
                    }}
                >
                    <CookieBanner />
                    <ConsentManagerDialog />
                    <AnalyticsProvider>{isFetching ? <Loader /> : <Outlet />}</AnalyticsProvider>
                    <IconSpriteSheet />
                </ConsentManagerProvider>
                <Toaster richColors />
                <TanStackRouterDevtools position="bottom-right" />
                <Scripts />
            </body>
        </html>
    );
};

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
    component: RootDocument,

    head: (context) => {
        const currentMatch = context.matches[context.matches.length - 1];
        const fullPath = currentMatch?.fullPath?.startsWith("/") ? currentMatch.fullPath.slice(1) : currentMatch?.fullPath || "";
        const canonicalUrl = `${siteBaseUrl}${fullPath}`;

        const {
            links: generatedLinks,
            meta: generatedMeta,
            title: generatedTitle,
        } = seo({
            description: defaultDescription,
            image: defaultOgImage,
            keywords: defaultKeywords,
            siteName,
            title: defaultTitle,
            twitterHandle,
            twitterImage: defaultTwitterImage,
            url: canonicalUrl,
        });

        const staticMetaTags: MetaElement[] = [
            { content: "width=device-width, initial-scale=1, viewport-fit=cover", name: "viewport" },
            // Theme and display
            { content: "#dfff1b", name: "theme-color" },
            { content: "light dark", name: "color-scheme" },
            { content: "#dfff1b", name: "msapplication-TileColor" },
            // Additional SEO meta tags
            { content: "en", property: "og:locale" },
            { content: "1200", property: "og:image:width" },
            { content: "630", property: "og:image:height" },
            { content: "image/png", property: "og:image:type" },
            { content: twitterHandle, name: "twitter:creator" },
            { content: "summary_large_image", name: "twitter:card" },
            // PWA meta tags
            { content: "standalone", name: "apple-mobile-web-app-capable" },
            { content: "AI Models Registry", name: "apple-mobile-web-app-title" },
            { content: "#dfff1b", name: "apple-mobile-web-app-status-bar-style" },
            { content: "AI Models Registry | Anolilab", name: "application-name" },
            // Security and performance
            { content: "nosniff", httpEquiv: "X-Content-Type-Options" },
            { content: "1; mode=block", httpEquiv: "X-XSS-Protection" },
            { content: "max-age=31536000; includeSubDomains", httpEquiv: "Strict-Transport-Security" },
            {
                content:
                    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.i.posthog.com https://ph.anolilab.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://eu.i.posthog.com https://ph.anolilab.com;",
                httpEquiv: "Content-Security-Policy",
            },
        ];

        const staticLinkTags: LinkElement[] = [
            { href: "/apple-touch-icon.png", rel: "apple-touch-icon", sizes: "180x180" },
            { href: "/favicon-48x48.png", rel: "icon", sizes: "48x48", type: "image/png" },
            { href: "/favicon-32x32.png", rel: "icon", sizes: "32x32", type: "image/png" },
            { href: "/favicon-16x16.png", rel: "icon", sizes: "16x16", type: "image/png" },
            { href: "/manifest.webmanifest", rel: "manifest" },
            { href: "/favicon.ico", rel: "icon" },
            // Performance optimizations
            { href: "https://eu.i.posthog.com", rel: "preconnect" },
            { href: "https://eu.i.posthog.com", rel: "dns-prefetch" },
            { href: "https://ph.anolilab.com", rel: "preconnect" },
            { href: "https://ph.anolilab.com", rel: "dns-prefetch" },
            { href: appCss, rel: "stylesheet" },
            // Additional performance optimizations
            { as: "image", href: defaultOgImage, rel: "preload" },
            { href: "/sitemap.xml", rel: "sitemap", type: "application/xml" },
        ];

        // Structured data for SEO
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            description: defaultDescription,
            name: siteName,
            potentialAction: {
                "@type": "SearchAction",
                "query-input": "required name=search_term_string",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteBaseUrl}?search={search_term_string}`,
                },
            },
            url: siteBaseUrl,
        };

        return {
            links: [...staticLinkTags, ...generatedLinks],
            meta: [...staticMetaTags, ...generatedMeta],
            script: [
                {
                    children: JSON.stringify(structuredData),
                    type: "application/ld+json",
                },
            ],
            title: generatedTitle,
        };
    },
});
