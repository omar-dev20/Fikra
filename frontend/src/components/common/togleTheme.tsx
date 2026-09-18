import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useIntl } from "react-intl";

export function ModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { formatMessage } = useIntl();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full p-2 border-2 border-black/20 dark:border-white/20  bg-transparent transition-all duration-300 hover:scale-125 hover:text-primary-foreground dark:hover:text-accent-foreground active:scale-100 active:rotate-180"
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700 dark:text-slate-200 " />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-amber-400" />
      )}
      <span className="sr-only">{formatMessage({ id: "theme.toggle" })}</span>
    </button>
  );
}