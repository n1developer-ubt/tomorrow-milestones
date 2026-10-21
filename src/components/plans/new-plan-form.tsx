"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorAlert } from "@/components/milestones/error-alert";
import { RequestForm } from "@/components/milestones/request-form";
import type { ClientError } from "@/lib/api/client";
import { planClient } from "@/lib/plans/plan-client";
import type { GenerationRequest } from "@/lib/validation/generation-request";

export function NewPlanForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ClientError | null>(null);

  const create = async (request: GenerationRequest) => {
    setPending(true);
    setError(null);
    const result = await planClient.create(request);
    if (!result.success) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/plans/${result.data.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
      <RequestForm pending={pending} onSubmit={create} />
    </div>
  );
}
