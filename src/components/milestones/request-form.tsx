"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fieldErrors,
  withoutKey,
  type FieldErrors,
} from "@/lib/validation/field-errors";
import {
  GENERATION_REQUEST_LIMITS,
  GenerationRequestSchema,
  type GenerationRequest,
} from "@/lib/validation/generation-request";
import { Field } from "./field";

type RequestFormProps = {
  pending: boolean;
  onSubmit: (request: GenerationRequest) => void;
};

export function RequestForm({ pending, onSubmit }: RequestFormProps) {
  const t = useTranslations("requestForm");
  const [values, setValues] = useState<GenerationRequest>({
    title: "",
    brief: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = GenerationRequestSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  const change = (field: keyof GenerationRequest) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => withoutKey(current, field));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        id="title"
        label={t("title")}
        length={values.title.length}
        max={GENERATION_REQUEST_LIMITS.title.max}
        error={errors.title}
      >
        <Input
          id="title"
          value={values.title}
          placeholder={t("titlePlaceholder")}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          onChange={(event) => change("title")(event.target.value)}
        />
      </Field>
      <Field
        id="brief"
        label={t("brief")}
        length={values.brief.length}
        max={GENERATION_REQUEST_LIMITS.brief.max}
        error={errors.brief}
      >
        <Textarea
          id="brief"
          rows={10}
          className="min-h-56 resize-y"
          value={values.brief}
          placeholder={t("briefPlaceholder")}
          aria-invalid={Boolean(errors.brief)}
          aria-describedby={errors.brief ? "brief-error" : undefined}
          onChange={(event) => change("brief")(event.target.value)}
        />
      </Field>
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Sparkles aria-hidden />
          )}
          {pending ? t("generating") : t("generate")}
        </Button>
      </div>
    </form>
  );
}
