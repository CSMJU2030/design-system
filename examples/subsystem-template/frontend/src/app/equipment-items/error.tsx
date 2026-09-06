"use client";
import { ErrorState } from "@csmju2030/design-system";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
