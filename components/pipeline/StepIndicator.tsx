"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const STEPS = [
  { label: "Research", path: "research", status: "research" },
  { label: "Titles", path: "research", status: "titles_generated" },
  { label: "Package", path: "package", status: "package_ready" },
  { label: "Thumbnail", path: "thumbnail", status: "thumbnail_ready" },
  { label: "Export", path: "export", status: "exported" },
] as const;

const ORDER: ProjectStatus[] = ["research", "titles_generated", "package_ready", "thumbnail_ready", "exported"];

interface Props {
  projectId: string;
  currentStatus: ProjectStatus;
}

export function StepIndicator({ projectId, currentStatus }: Props) {
  const pathname = usePathname();
  const currentIdx = ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = pathname.includes(step.path) && !isDone;
        const isAccessible = i <= currentIdx + 1;

        return (
          <div key={step.label} className="flex items-center">
            {i > 0 && (
              <div className={cn("h-0.5 w-6 sm:w-12 mx-1 rounded-full transition-all duration-300", isDone ? "bg-brand-500" : "bg-gray-200")} />
            )}
            <Link
              href={isAccessible ? `/dashboard/project/${projectId}/${step.path}` : "#"}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                isDone && "bg-brand-100 text-brand-700",
                isCurrent && "bg-gradient-brand text-white shadow-md",
                !isDone && !isCurrent && "text-gray-400 cursor-default"
              )}
            >
              {isDone ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                  isCurrent ? "bg-white/20" : "bg-gray-200 text-gray-500"
                )}>{i + 1}</span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
