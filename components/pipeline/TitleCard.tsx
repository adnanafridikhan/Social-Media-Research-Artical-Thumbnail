"use client";
import { cn, scoreBg } from "@/lib/utils";
import type { TitleSuggestion } from "@/types";

interface Props {
  title: TitleSuggestion;
  selected?: boolean;
  onClick?: () => void;
}

export function TitleCard({ title, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200",
        selected
          ? "border-brand-500 bg-brand-50 shadow-glow"
          : "border-gray-100 bg-white hover:border-brand-300 hover:shadow-card-hover shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm font-semibold leading-snug text-gray-900", selected && "text-brand-900")}>
          {title.title}
        </p>
        {title.ctr_score != null && (
          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", scoreBg(title.ctr_score))}>
            {Math.round(title.ctr_score)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {title.search_volume != null && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 border border-blue-100">
            {title.search_volume.toLocaleString()} searches/mo
          </span>
        )}
        {title.competition && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-xs border",
            title.competition === "low" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
            title.competition === "medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
            "bg-red-50 text-red-700 border-red-100"
          )}>
            {title.competition} competition
          </span>
        )}
        {(title.raw_data as { reasoning?: string })?.reasoning && (
          <p className="mt-1 w-full text-xs text-gray-500 leading-relaxed">
            {(title.raw_data as { reasoning?: string }).reasoning}
          </p>
        )}
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs font-semibold text-brand-600">Selected</span>
        </div>
      )}
    </button>
  );
}
