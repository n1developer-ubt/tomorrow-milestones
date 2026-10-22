import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import messages from "../../messages/en.json";
import { useErrorToast } from "@/components/milestones/use-error-toast";
import { DEFAULT_LOCALE } from "@/i18n/locale";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useErrorToast", () => {
  it("shows the server message", () => {
    const { result } = renderHook(useErrorToast, { wrapper });

    result.current({ code: "timeout", message: "Too slow." });

    expect(toast.error).toHaveBeenCalledWith("Too slow.");
  });

  it("falls back to the network message", () => {
    const { result } = renderHook(useErrorToast, { wrapper });

    result.current({ code: "network" });

    expect(toast.error).toHaveBeenCalledWith(
      "Could not reach the server. Check your connection and try again.",
    );
  });
});
