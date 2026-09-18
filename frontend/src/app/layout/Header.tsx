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
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        {/* Using glass class directly - header doesn't need rounded-2xl from glass-card */}
        <div className="glass-card flex items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 ">
            <Link to={path("/")} className="text-sm font-semibold tracking-wide">
              <FormattedMessage id="app.title" />
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline"></span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
          <div className="flex items-center gap-2 ">
            <Button onClick={toggleLang}>{isRtl ? "English" : "العربية"}</Button>
          </div>
          <Show when="signed-out">
            <SignInButton>
              <div className="border  text-center transition duration-300 text-sm item-center bg-black/10 shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/10 dark:border-input dark:hover:bg-input/30 flex  rounded-md cursor-pointer items-center justify-center gap-2 px-4 py-[7px] text-sm font-medium  ">
                <CircleUser className="h-4 w-4" />{" "}
                <span>
                  <FormattedMessage id="header.signIn" />
                </span>
              </div>
            </SignInButton>
            <SignUpButton>
              <div className="border flex transition duration-300 rounded-md cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:border-black/20 dark:hover:border-white/20 hover:scale-[1.05] hover:shadow-lg  active:scale-[0.95] active:shadow-sm">
                <CircleArrowUp className="h-5 w-5" />{" "}
                <span>
                  <FormattedMessage id="header.signUp" />
                </span>
              </div>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton>
            </UserButton>
          </Show>
        </div>
      </div>
    </header>
  );
}
