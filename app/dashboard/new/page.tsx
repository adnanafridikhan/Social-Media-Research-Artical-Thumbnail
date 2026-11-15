"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSteps } from "@/components/pipeline/LoadingSteps";

const EXAMPLES = [
  "How I went from 0 to 10K subscribers in 90 days",
  "5 AI tools that replaced half my team",
  "The exact system I use to make $5K/month freelancing",
  "Why most beginners fail at investing (and what to do instead)",
  "I built an app in 24 hours with no coding experience",
];

const LOADING_STEPS = [
  "Analyzing your idea",
  "Running VidIQ keyword research",
  "Finding viral outlier videos",
  "Generating 8 title options with AI",
  "Scoring each title",
];

export default function NewProjectPage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await fetch("/api/research/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedIdea: idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("8 title options generated!");
      router.push(`/dashboard/project/${data.projectId}/research`);
    } catch (err) {
      toast.error(String(err));
      setLoading(false);
      setStepIndex(-1);
    }
  }

  const steps = LOADING_STEPS.map((label, i) => ({
    label,
    done: i < stepIndex,
    active: i === stepIndex,
  }));

  return (
    <div className="min-h-screen bg-gradient-canvas flex flex-col">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {/* Back nav */}
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">What's your video idea?</h1>
          <p className="mt-2 text-gray-500">Describe your concept, niche, or rough title. AI does the rest.</p>
        </div>

        {loading ? (
          <div className="animate-fade-in">
            <LoadingSteps steps={steps} title="Building your research pipeline..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="relative">
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. How I made $10K from YouTube in 6 months as a beginner..."
                className="min-h-[140px] text-base leading-relaxed pr-4"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-300">
                {idea.length}/500
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!idea.trim()}>
              <Sparkles className="h-5 w-5" />
              Generate Titles
            </Button>
          </form>
        )}

        {/* Example chips */}
        {!loading && (
          <div className="mt-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Try an example</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setIdea(ex)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 shadow-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
