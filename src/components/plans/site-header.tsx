import { Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="bg-indigo-dark text-primary-foreground">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          {t("brand")}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-primary-foreground hover:bg-white/10 hover:text-white",
            )}
          >
            {t("plans")}
          </Link>
          <Link
            href="/new"
            className={cn(
              buttonVariants(),
              "bg-mint text-foreground hover:bg-mint/80",
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
