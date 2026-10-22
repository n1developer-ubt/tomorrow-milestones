"use client";

import {
  Check,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  Pencil,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CardStatus, ReviewCard } from "@/lib/review/review-reducer";
import { cn } from "@/lib/utils";
import { fieldErrors, type FieldErrors } from "@/lib/validation/field-errors";
import {
  MILESTONE_LIMITS,
  MilestoneSchema,
  type Milestone,
} from "@/lib/validation/milestone";
import {
  INSTRUCTION_LIMITS,
  type RefineMode,
} from "@/lib/validation/refine-request";
import { Field } from "./field";

type MilestoneCardProps = {
  card: ReviewCard;
  index: number;
  refining: boolean;
  disabled: boolean;
  readOnly?: boolean;
  onStatus: (status: CardStatus) => void;
  onEdit: (text: Milestone) => void;
  onRevert: () => void;
  onRefine: (mode: RefineMode, instruction?: string) => void;
};

const STATUS_STYLES: Record<CardStatus, string> = {
  pending: "",
  accepted: "ring-2 ring-mint",
  rejected: "opacity-60",
};

const STATUS_BADGE_STYLES: Record<CardStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-transparent bg-indigo-dark text-white",
  rejected: "border-border bg-muted text-muted-foreground",
};

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold";

const LILAC_PILL = cn(PILL, "border-transparent bg-secondary text-violet");

export function MilestoneCard({
  card,
  index,
  refining,
  disabled,
  readOnly = false,
  onStatus,
  onEdit,
  onRevert,
  onRefine,
}: MilestoneCardProps) {
  const t = useTranslations("card");
  const tReview = useTranslations("review");
  const [editing, setEditing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const { milestone, status, change, edited, previous } = card;
  const titleId = `milestone-${milestone.id}-title`;

  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      className={cn(
        "gap-0 rounded-xl py-0 shadow-sm transition-all",
        STATUS_STYLES[status],
      )}
    >
      <CardHeader className="gap-2 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {tReview("step", { number: index + 1 })}
          </span>
          <span className={cn(PILL, STATUS_BADGE_STYLES[status])}>
            {status === "pending" && (
              <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            )}
            {t(`status.${status}`)}
          </span>
          {change && <span className={LILAC_PILL}>{t(`change.${change}`)}</span>}
          {edited && <span className={LILAC_PILL}>{t("change.edited")}</span>}
        </div>
        {!editing && (
          <>
            <CardTitle
              id={titleId}
              className={cn(
                "text-foreground font-semibold",
                status === "rejected" && "line-through",
              )}
            >
              {milestone.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              {milestone.description}
            </CardDescription>
          </>
        )}
      </CardHeader>

      {editing && (
        <CardContent>
          <EditForm
            milestone={milestone}
            onCancel={() => setEditing(false)}
            onSave={(text) => {
              onEdit(text);
              setEditing(false);
            }}
          />
        </CardContent>
      )}

      {previous && showPrevious && !editing && (
        <CardContent>
          <div className="bg-muted/60 rounded-md p-3 text-sm">
            <p className="font-medium">{previous.title}</p>
            <p className="text-muted-foreground mt-1">{previous.description}</p>
          </div>
        </CardContent>
      )}

      {asking && !editing && (
        <CardContent>
          <AskAiForm
            disabled={disabled}
            onCancel={() => setAsking(false)}
            onSubmit={(instruction) => {
              onRefine("custom", instruction);
              setAsking(false);
            }}
          />
        </CardContent>
      )}

      {!editing && !readOnly && (
        <CardFooter className="bg-muted/40 flex flex-wrap gap-2 rounded-b-xl border-t px-5 py-3">
          {status === "pending" ? (
            <>
              <Button
                size="sm"
                disabled={disabled}
                onClick={() => onStatus("accepted")}
              >
                <Check aria-hidden />
                {t("accept")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onStatus("rejected")}
              >
                <X aria-hidden />
                {t("reject")}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onStatus("pending")}
            >
              <Undo2 aria-hidden />
              {t("undo")}
            </Button>
          )}

          {status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => setEditing(true)}
              >
                <Pencil aria-hidden />
                {t("edit")}
              </Button>
              <RefineButtons
                refining={refining}
                disabled={disabled}
                onShorter={() => onRefine("shorter")}
                onLonger={() => onRefine("longer")}
                onAsk={() => setAsking((open) => !open)}
              />
            </>
          )}

          {previous && (
            <>
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={showPrevious}
                onClick={() => setShowPrevious((open) => !open)}
              >
                <History aria-hidden />
                {showPrevious ? t("hidePrevious") : t("showPrevious")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={onRevert}
              >
                <Undo2 aria-hidden />
                {t("revert")}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

type RefineButtonsProps = {
  refining: boolean;
  disabled: boolean;
  onShorter: () => void;
  onLonger: () => void;
  onAsk: () => void;
};

function RefineButtons({
  refining,
  disabled,
  onShorter,
  onLonger,
  onAsk,
}: RefineButtonsProps) {
  const t = useTranslations("card");

  if (refining) {
    return (
      <span
        role="status"
        className="text-muted-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("refining")}
      </span>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={disabled} onClick={onShorter}>
        <Minimize2 aria-hidden />
        {t("shorter")}
      </Button>
      <Button size="sm" variant="outline" disabled={disabled} onClick={onLonger}>
        <Maximize2 aria-hidden />
        {t("longer")}
      </Button>
      <Button size="sm" variant="outline" disabled={disabled} onClick={onAsk}>
        <Sparkles className="text-violet" aria-hidden />
        {t("askAi")}
      </Button>
    </>
  );
}

type EditFormProps = {
  milestone: Milestone;
  onSave: (text: Milestone) => void;
  onCancel: () => void;
};

function EditForm({ milestone, onSave, onCancel }: EditFormProps) {
  const t = useTranslations("card");
  const [values, setValues] = useState<Milestone>({
    title: milestone.title,
    description: milestone.description,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = MilestoneSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    onSave(result.data);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <Field
        id="edit-title"
        label={t("title")}
        length={values.title.length}
        max={MILESTONE_LIMITS.title.max}
        error={errors.title}
      >
        <Input
          id="edit-title"
          autoFocus
          value={values.title}
          aria-invalid={Boolean(errors.title)}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
        />
      </Field>
      <Field
        id="edit-description"
        label={t("description")}
        length={values.description.length}
        max={MILESTONE_LIMITS.description.max}
        error={errors.description}
      >
        <Textarea
          id="edit-description"
          rows={4}
          value={values.description}
          aria-invalid={Boolean(errors.description)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {t("save")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

type AskAiFormProps = {
  disabled: boolean;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
};

function AskAiForm({ disabled, onSubmit, onCancel }: AskAiFormProps) {
  const t = useTranslations("card");
  const [instruction, setInstruction] = useState("");
  const valid = instruction.trim().length >= INSTRUCTION_LIMITS.min;

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit(instruction.trim());
      }}
    >
      <Input
        autoFocus
        aria-label={t("askAi")}
        value={instruction}
        maxLength={INSTRUCTION_LIMITS.max}
        placeholder={t("askAiPlaceholder")}
        onChange={(event) => setInstruction(event.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={disabled || !valid}>
          {t("apply")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
