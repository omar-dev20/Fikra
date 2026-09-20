"use client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { CircleUser } from "lucide-react";
import { CircleArrowUp } from "lucide-react";
import { ModeToggle } from "@/components/common/togleTheme";
import { useLang } from "@/hooks/useLang";
import { FormattedMessage } from "react-intl";
export function Header() {
  const { isRtl, toggleLang, path } = useLang();
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto w-full max-w-6xl px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div className="glass-card flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start sm:gap-3">
            <Link to={path("/")} className="text-lg font-semibold tracking-wide ">
              <FormattedMessage id="app.title" />
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline"></span>
          </div>

          <div className="flex items-center  order-last w-full justify-between gap-2 sm:w-auto sm:order-1 sm:justify-end sm:gap-3">
            <ModeToggle />

            <Button
              onClick={toggleLang}
              size="sm"
              className="px-2.5 text-xs sm:px-4 sm:text-sm"
            >
              {isRtl ? "English" : "العربية"}
            </Button>

            <Show when="signed-out">
              <SignInButton>
                <div className="border text-center transition duration-300 text-sm item-center bg-black/10 shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/10 dark:border-input dark:hover:bg-input/30 flex rounded-md cursor-pointer items-center justify-center gap-1.5 px-2.5 py-[6px] text-xs font-medium sm:gap-2 sm:px-4 sm:py-[7px] sm:text-sm">
                  <CircleUser className="h-4 w-4 icon" />
                  <span >
                    <FormattedMessage id="header.signIn" />
                  </span>
                </div>
              </SignInButton>
              <SignUpButton>
                <div className="border flex transition duration-300 rounded-md cursor-pointer items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:border-black/20 dark:hover:border-white/20 hover:scale-[1.05] hover:shadow-lg active:scale-[0.95] active:shadow-sm sm:gap-2 sm:px-4 sm:text-sm">
                  <CircleArrowUp className="h-5 w-5  icon" />
                  <span>
                    <FormattedMessage id="header.signUp" />
                  </span>
                </div>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}