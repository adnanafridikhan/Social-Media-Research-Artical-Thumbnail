"use client";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  done: boolean;
  active: boolean;
}

interface Props {
  steps: Step[];
  title?: string;
}

export function LoadingSteps({ steps, title }: Props) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
      {title && <p className="mb-4 text-sm font-semibold text-brand-700">{title}</p>}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
              step.done ? "bg-brand-500 text-white" :
              step.active ? "bg-white border-2 border-brand-400 text-brand-500" :
              "bg-gray-100 text-gray-400"
            )}>
              {step.done ? "✓" : i + 1}
            </div>
            <span className={cn(
              "text-sm transition-all duration-300",
              step.done ? "text-brand-700 font-medium" :
              step.active ? "text-gray-900 font-medium animate-pulse" :
              "text-gray-400"
            )}>
              {step.label}
            </span>
            {step.active && (
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: `${j * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
