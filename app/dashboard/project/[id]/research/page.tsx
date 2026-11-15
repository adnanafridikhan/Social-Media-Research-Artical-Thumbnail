"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, ArrowRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TitleCard } from "@/components/pipeline/TitleCard";
import { LoadingSteps } from "@/components/pipeline/LoadingSteps";
import type { VideoProject, TitleSuggestion } from "@/types";

const LOADING_STEPS = [
  "Fetching keyword data",
  "Finding viral outliers",
  "Generating title options with AI",
  "Scoring all titles",
];

export default function ResearchPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [titles, setTitles] = useState<TitleSuggestion[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(-1);
  const [proceeding, setProceeding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/project/${params.id}`)
      .then((r) => r.json())
      .then((data: VideoProject) => {
        setProject(data);
        const suggestions = data.title_suggestions ?? [];
        setTitles(suggestions);
        const sel = suggestions.find((t) => t.selected);
        if (sel) setSelected(sel.id);
      });
  }, [params.id]);

  async function regenerate() {
    if (!project) return;
    setLoading(true);
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }
    try {
      const res = await fetch("/api/research/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIdea: project.seed_idea, projectId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTitles(data.titles);
      setSelected(null);
      toast.success("New titles generated!");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
      setLoadStep(-1);
    }
  }

  async function proceed() {
    if (!selected) return;
    setProceeding(true);
    try {
      const res = await fetch("/api/package/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, titleId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Package generated!");
      router.push(`/dashboard/project/${params.id}/package`);
    } catch (err) {
      toast.error(String(err));
      setProceeding(false);
    }
  }

  const steps = LOADING_STEPS.map((label, i) => ({ label, done: i < loadStep, active: i === loadStep }));

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-fade-in">
        <LoadingSteps steps={steps} title="Regenerating titles..." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h1 className="text-xl font-bold text-gray-900">Choose Your Title</h1>
          </div>
          <p className="text-sm text-gray-500">
            {titles.length} AI-generated options, scored by CTR potential. Pick the best one.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={regenerate}>
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {titles.length === 0 ? (
        <div className="py-20 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-500">No titles yet. Generate them first.</p>
          <Button className="mt-4" onClick={regenerate}>
            <Sparkles className="h-4 w-4" />
            Generate Titles
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {titles
              .sort((a, b) => (b.ctr_score ?? 0) - (a.ctr_score ?? 0))
              .map((title, i) => (
                <div key={title.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <TitleCard
                    title={title}
                    selected={selected === title.id}
                    onClick={() => setSelected(selected === title.id ? null : title.id)}
                  />
                </div>
              ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              disabled={!selected || proceeding}
              onClick={proceed}
            >
              {proceeding ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating Package...
                </>
              ) : (
                <>
                  Build Package
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
