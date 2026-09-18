import { FormattedMessage } from "react-intl";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-black/10 dark:border-white/10 ">
      <div className="mx-auto  flex w-full max-w-6xl items-center justify-between px-4 py-6 font-semibold text-base text-muted-foreground md:px-6">
        <p className="mx-auto">
          <FormattedMessage
            id="footer.copyright"
            values={{ year: new Date().getFullYear() }}
          />
        </p>
      </div>
    </footer>
  );
}
