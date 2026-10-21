"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorAlert } from "@/components/milestones/error-alert";
import { MilestoneCard } from "@/components/milestones/milestone-card";
import { RefineAllForm } from "@/components/milestones/refine-all-form";
import { RemovedMilestones } from "@/components/milestones/removed-milestones";
import { acceptedCount, type MilestonePlanDto } from "@/lib/plans/plan-dto";
import { usePlanEditor } from "@/lib/plans/use-plan-editor";
import { PlanStatusBadge } from "./plan-status-badge";
import { PublishBar } from "./publish-bar";

type PlanEditorProps = { initialPlan: MilestonePlanDto };

export function PlanEditor({ initialPlan }: PlanEditorProps) {
  const t = useTranslations("review");
  const tRefine = useTranslations("refineAll");
  const tPublish = useTranslations("publish");
  const format = useFormatter();
  const editor = usePlanEditor(initialPlan);
  const [notice, setNotice] = useState<string | null>(null);
  const { plan, pending, error } = editor;
  const busy = pending !== null;
  const readOnly = plan.status === "published";
  const cards = plan.milestones;
  const pendingReview = cards.filter(
    (card) => card.status === "pending",
  ).length;

  const refineAll = async (instruction: string) => {
    setNotice(null);
    const result = await editor.refineAll(instruction);
    if (result?.changes.every((change) => change.kind === "unchanged")) {
      setNotice(tRefine("noChanges"));
    }
    return Boolean(result);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <PlanStatusBadge status={plan.status} />
            {plan.publishedAt && (
              <span className="text-muted-foreground text-sm">
                {tPublish("publishedOn", {
                  date: format.dateTime(new Date(plan.publishedAt), {
                    dateStyle: "medium",
                  }),
                })}
              </span>
            )}
          </div>
          <h1 className="text-indigo-dark text-3xl font-bold tracking-tight">
            {plan.title}
          </h1>
          <p className="text-muted-foreground whitespace-pre-line">
            {plan.brief}
          </p>
        </header>

        {error && <ErrorAlert error={error} onDismiss={editor.dismissError} />}

        <section
          aria-labelledby="review-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id="review-heading" className="text-lg font-semibold">
              {t("heading")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {readOnly ? t("publishedHint") : t("hint")}
            </p>
          </div>

          <ol className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {cards.map((card, index) => (
                <motion.li
                  key={card.milestone.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <MilestoneCard
                    card={card}
                    index={index}
                    readOnly={readOnly}
                    disabled={busy}
                    refining={
                      pending?.kind === "refineMilestone" &&
                      pending.milestoneId === card.milestone.id
                    }
                    onStatus={(status) =>
                      void editor.review({
                        type: "setStatus",
                        milestoneId: card.milestone.id,
                        status,
                      })
                    }
                    onEdit={(text) =>
                      void editor.review({
                        type: "edit",
                        milestoneId: card.milestone.id,
                        text,
                      })
                    }
                    onRevert={() =>
                      void editor.review({
                        type: "revert",
                        milestoneId: card.milestone.id,
                      })
                    }
                    onRefine={(mode, instruction) =>
                      void editor.refineMilestone(
                        card.milestone.id,
                        mode,
                        instruction,
                      )
                    }
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {!readOnly && (
            <>
              <RemovedMilestones
                removed={plan.removed}
                disabled={busy}
                onRestore={(milestoneId) =>
                  void editor.review({ type: "restoreRemoved", milestoneId })
                }
              />
              <RefineAllForm
                pending={pending?.kind === "refineAll"}
                disabled={busy}
                onSubmit={refineAll}
              />
              {notice && (
                <p role="status" className="text-muted-foreground text-sm">
                  {notice}
                </p>
              )}
              <PublishBar
                accepted={acceptedCount(plan)}
                total={cards.length}
                pendingReview={pendingReview}
                usage={plan.tokenUsage}
                publishing={pending?.kind === "publish"}
                disabled={busy}
                onPublish={() => void editor.publish()}
              />
            </>
          )}
        </section>
      </div>
    </MotionConfig>
  );
}
