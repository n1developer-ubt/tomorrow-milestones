"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INSTRUCTION_LIMITS } from "@/lib/validation/refine-request";

type RefineAllFormProps = {
  pending: boolean;
  disabled: boolean;
  onSubmit: (instruction: string) => Promise<boolean>;
};

export function RefineAllForm({
  pending,
  disabled,
  onSubmit,
}: RefineAllFormProps) {
  const t = useTranslations("refineAll");
  const [instruction, setInstruction] = useState("");
  const valid = instruction.trim().length >= INSTRUCTION_LIMITS.min;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (valid && (await onSubmit(instruction.trim()))) setInstruction("");
      }}
    >
      <Label htmlFor="refine-all">{t("label")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="refine-all"
          value={instruction}
          maxLength={INSTRUCTION_LIMITS.max}
          placeholder={t("placeholder")}
          onChange={(event) => setInstruction(event.target.value)}
        />
        <Button type="submit" disabled={disabled || !valid}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Wand2 aria-hidden />
          )}
          {pending ? t("refining") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
