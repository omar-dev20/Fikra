import { useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { IntlProvider } from "react-intl";
import { massages } from "@/i18n";

export function IntiWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();

  useEffect(() => {
    document.title = massages[lang]["app.title"];
  }, [lang]);

  return (
    <IntlProvider locale={lang} messages={massages[lang]}>
      {children}
    </IntlProvider>
  );
}
