import { ClerkProvider } from "@clerk/react"
import { dark } from "@clerk/ui/themes" 
import { useTheme } from "@/hooks/useTheme"
import { useLang } from "@/hooks/useLang"
import { arSA } from "@clerk/localizations"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to .env file");
}

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: currentTheme } = useTheme();
  const { lang } = useLang();
  const isDark = currentTheme === 'dark';
  return (
    <ClerkProvider
      localization={lang === "ar" ? arSA : undefined}
      appearance={{
        theme: isDark ? dark : undefined,
        variables: {
          colorPrimary: '#6d28d9',
          colorBackground: isDark ? '#0f0f10' : '#ffffff',
          colorForeground: isDark ? '#ffffff' : '#0f0f10',
        },
        elements: {
          userButtonPopoverActionButton: {
            color: isDark ? '#ffffff' : '#0f0f10',
            "&:hover": {
              color: isDark ? "#ffffffb5" : "#0f0f10b5",
            },
          },
          userButtonPopoverActionButtonIcon: {
            color: isDark ? '#ffffff' : '#0f0f10',
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}