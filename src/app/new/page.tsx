import { getTranslations } from "next-intl/server";
import { NewPlanForm } from "@/components/plans/new-plan-form";

export default async function NewPlanPage() {
  const t = await getTranslations("newPlan");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-indigo-dark text-3xl font-bold tracking-tight">
          {t("heading")}
        </h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      <NewPlanForm />
    </main>
  );
}
