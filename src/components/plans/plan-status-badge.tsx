import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PlanStatus } from "@/lib/storage/milestone-plan-repository";

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const t = useTranslations("plansPage.status");

  return (
    <Badge
      variant={status === "published" ? "default" : "secondary"}
      className={status === "published" ? "bg-mint text-foreground" : undefined}
    >
      {t(status)}
    </Badge>
  );
}
