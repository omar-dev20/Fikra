import React, { useCallback, useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ensureLangPath,
  getStoredLang,
  isSupportedLang,
  localizePath,
  swapLangInPath,
  type locale,
} from "@/i18n";
import { LangContext } from "@/context/langContext";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { lang: langParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const lang = isSupportedLang(langParam) ? langParam : getStoredLang();
  const isRtl = lang === "ar";

  const setLang = useCallback(
    (nextLang: locale) => {
      if (nextLang === lang) return;
      localStorage.setItem("lang", nextLang);
      const nextPath = swapLangInPath(location.pathname, nextLang);
      navigate(`${nextPath}${location.search}${location.hash}`);
    },
    [lang, location.hash, location.pathname, location.search, navigate],
  );

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const path = useCallback((to: string) => localizePath(lang, to), [lang]);

  useEffect(() => {
    if (!isSupportedLang(langParam)) return;
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl, lang, langParam]);

  if (!isSupportedLang(langParam)) {
    const nextPath = ensureLangPath(location.pathname, lang);
    return (
      <Navigate
        to={`${nextPath}${location.search}${location.hash}`}
        replace
      />
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, isRtl, toggleLang, path }}>
      {children}
    </LangContext.Provider>
  );
}

export function RedirectToLang() {
  return <Navigate to={`/${getStoredLang()}`} replace />;
}
