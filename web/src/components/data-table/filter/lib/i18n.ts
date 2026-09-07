import en from "../locales/en.json";

export type Locale = "en";

type Translations = Record<string, string>;

const translations: Record<Locale, Translations> = {
    en,
};

export const t = (key: string, locale: Locale): string => translations[locale][key] ?? key;
