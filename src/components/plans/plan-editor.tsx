"use client";

import { CheckCheck } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ErrorAlert } from "@/components/milestones/error-alert";
import { MilestoneCard } from "@/components/milestones/milestone-card";
import { RefineAllForm } from "@/components/milestones/refine-all-form";
import { RemovedMilestones } from "@/components/milestones/removed-milestones";
import { useErrorToast } from "@/components/milestones/use-error-toast";
import { Button } from "@/components/ui/button";
import {
  acceptedCount,
  type MilestonePlanDto,
} from "@/lib/repository/repository";
import { PlanStatusBadge } from "./plan-status-badge";
import { PublishBar } from "./publish-bar";
import { usePlanEditor } from "./use-plan-editor";

type PlanEditorProps = { initialPlan: MilestonePlanDto };

export function PlanEditor({ initialPlan }: PlanEditorProps) {
  const t = useTranslations("review");
  const tRefine = useTranslations("refineAll");
  const tPublish = useTranslations("publish");
  const format = useFormatter();
  const showErrorToast = useErrorToast();
  const editor = usePlanEditor(initialPlan, showErrorToast);
  const { plan, pending, error } = editor;
  const busy = pending !== null;
  const readOnly = plan.status === "published";
  const cards = plan.milestones;
  const pendingReview = cards.filter(
    (card) => card.status === "pending",
  ).length;

  const refineAll = async (instruction: string) => {
    const result = await editor.refineAll(instruction);
    if (!result) return false;
    const unchanged = result.changes.every((c) => c.kind === "unchanged");
    if (unchanged) toast.info(tRefine("noChanges"));
    else toast.success(tRefine("done"));
    return true;
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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2
                id="review-heading"
                className="text-foreground text-lg font-semibold"
              >
                {t("heading")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {readOnly ? t("publishedHint") : t("hint")}
              </p>
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-card shadow-sm [&_svg]:text-emerald-600"
                  disabled={busy || pendingReview === 0}
                  onClick={() => void editor.review({ type: "acceptAll" })}
                >
                  <CheckCheck aria-hidden />
                  {t("acceptAll")}
                </Button>
                <RefineAllForm
                  pending={pending?.kind === "refineAll"}
                  disabled={busy}
                  onSubmit={refineAll}
                />
              </div>
            )}
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
