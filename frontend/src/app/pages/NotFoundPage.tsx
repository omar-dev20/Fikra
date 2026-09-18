import { Link } from "react-router-dom";

import { GlassCard } from "@/components/common/GlassCard";
import { FormattedMessage } from "react-intl";
import { useLang } from "@/hooks/useLang";

export function NotFoundPage() {
  const { path } = useLang();
  return (
    <GlassCard className="px-6 py-12 text-center sm:px-10">
      <h1 className="text-2xl font-semibold ">
        <FormattedMessage id="notFound.title" />
      </h1>
      <p className="mt-3 text-sm ">
        <FormattedMessage id="notFound.description" />
      </p>
      <Link
        to={path("/")}
        className="mt-6 inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium  transition "
      >
        <FormattedMessage id="notFound.backHome" />
      </Link>
    </GlassCard>
  );
}
