import en from "./en.json";
import ar from "./ar.json";

export const massages = {
  en,
  ar,
};

export const defaultLang = "en";
export const supportedLangs = ["en", "ar"] as const;
export type locale = keyof typeof massages;

export function isSupportedLang(value: unknown): value is locale {
  return (
    typeof value === "string" &&
    (supportedLangs as readonly string[]).includes(value)
  );
}

export function getStoredLang(): locale {
  const stored = localStorage.getItem("lang");
  return isSupportedLang(stored) ? stored : defaultLang;
}

export function localizePath(lang: locale, to: string): string {
  if (!to || to === "/") return `/${lang}`;
  const path = to.startsWith("/") ? to : `/${to}`;
  const first = path.split("/").filter(Boolean)[0];
  if (isSupportedLang(first)) return path;
  return `/${lang}${path}`;
}

export function swapLangInPath(pathname: string, nextLang: locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${nextLang}`;
  if (isSupportedLang(parts[0])) {
    parts[0] = nextLang;
    return `/${parts.join("/")}`;
  }
  return `/${nextLang}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function ensureLangPath(pathname: string, lang: locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${lang}`;
  if (isSupportedLang(parts[0])) return `/${parts.join("/")}`;
  return `/${lang}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
