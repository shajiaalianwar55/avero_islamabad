import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[100px] w-full rounded-md border border-[var(--avero-line)] bg-white px-3 py-2 text-sm text-[var(--avero-ink)] placeholder:text-[var(--avero-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--avero-teal)] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
