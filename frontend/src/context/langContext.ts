import { type locale } from "@/i18n";
import React from "react";

export interface LangContextType {
  lang: locale;
  setLang: (lang: locale) => void;
  isRtl: boolean;
  toggleLang: () => void;
  path: (to: string) => string;
}

export const LangContext = React.createContext<LangContextType | null>(null);
