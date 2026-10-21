"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const valid = instruction.trim().length >= INSTRUCTION_LIMITS.min;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            size="lg"
            className="shadow-primary/30 from-primary to-violet hover:from-indigo-bright bg-gradient-to-r text-white shadow-md transition-shadow hover:shadow-lg"
          />
        }
      >
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <Wand2 aria-hidden />
        )}
        {pending ? t("refining") : t("submit")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <form
          className="flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!valid) return;
            setOpen(false);
            if (await onSubmit(instruction.trim())) setInstruction("");
          }}
        >
          <PopoverHeader>
            <PopoverTitle>{t("label")}</PopoverTitle>
            <PopoverDescription>{t("hint")}</PopoverDescription>
          </PopoverHeader>
          <Textarea
            autoFocus
            aria-label={t("label")}
            rows={4}
            value={instruction}
            maxLength={INSTRUCTION_LIMITS.max}
            placeholder={t("placeholder")}
            onChange={(event) => setInstruction(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={disabled || !valid}>
              <Wand2 aria-hidden />
              {t("submit")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
