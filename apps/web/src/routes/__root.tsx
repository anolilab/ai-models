import { Toaster } from "@/components/ui/sonner";
  
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Loader from "@/components/loader";
import { ConsentManagerDialog, CookieBanner } from "@c15t/react";
import { baseTranslations } from "@c15t/translations";
import type { LinkHTMLAttributes, MetaHTMLAttributes } from "react";

import { ConsentManagerProvider } from "@/providers/consent-manager";
import { AnalyticsProvider } from "@/providers/posthog";
import { seo } from "@/utils/seo";

import appCss from "../index.css?url";
import 'unfonts.css'

type LinkElement = LinkHTMLAttributes<HTMLLinkElement> & { rel: string };
type MetaElement = MetaHTMLAttributes<HTMLMetaElement>;

let siteBaseUrl = import.meta.env.VITE_SITE_BASE_URL;

if (siteBaseUrl && !siteBaseUrl.endsWith("/")) {
    siteBaseUrl += "/";
}

const siteName = "Models | Anolilab";
const defaultTitle = "Anolilab | Next-Gen AI, Web & Software Development Studio – Modern Solutions for Ambitious Brands";
const defaultDescription
    = "Anolilab delivers high-performance websites, web applications, AI solutions, and custom software with a focus on modern technology and user experience.";
const twitterHandle = "@anolilab";
const defaultKeywords
    = "web development, software development, AI, artificial intelligence, react, typescript, nodejs, frontend, backend, headless cms, performance optimization, development studio";
const defaultOgImage = `${siteBaseUrl}/og_big.jpg`;
const defaultTwitterImage = `${siteBaseUrl}/og.jpg`;

export interface RouterAppContext {
}
  
export const Route = createRootRouteWithContext<RouterAppContext>()({
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
        { href: appCss, rel: "stylesheet" },
    ];

    return {
        links: [...staticLinkTags, ...generatedLinks],
        meta: [...staticMetaTags, ...generatedMeta],
        title: generatedTitle ?? defaultTitle,
    };
  },

  component: RootDocument,
});

function RootDocument() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning={true} className="h-screen w-screen">
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
                <AnalyticsProvider>
          {isFetching ? <Loader /> : <Outlet />}
                </AnalyticsProvider>
            </ConsentManagerProvider>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
