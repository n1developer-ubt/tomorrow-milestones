import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="bg-indigo-dark text-primary-foreground">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <span className="bg-mint text-indigo-dark flex size-7 items-center justify-center rounded-md">
            <Zap className="size-3.5" aria-hidden />
          </span>
          {t("brand")}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            {t("plans")}
          </Link>
          <Link
            href="/new"
            className={cn(
              buttonVariants(),
              "bg-mint text-indigo-dark hover:bg-mint/85 shadow-mint/30 rounded-full px-3 font-semibold shadow-md",
            )}
          >
            <Plus aria-hidden />
            {t("newPlan")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
