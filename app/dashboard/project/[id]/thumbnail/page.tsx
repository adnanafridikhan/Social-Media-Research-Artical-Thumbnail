"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Wand2, RefreshCw, ArrowRight, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { scoreBg } from "@/lib/utils";
import type { VideoProject, Thumbnail } from "@/types";

export default function ThumbnailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [brief, setBrief] = useState("");
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [engine] = useState<"openai" | "vidiq">("openai");
  const [variations, setVariations] = useState<1 | 2 | 3 | 4>(2);
  const [generating, setGenerating] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/project/${params.id}`)
      .then((r) => r.json())
      .then((data: VideoProject) => {
        setProject(data);
        const p = data.video_packages?.[0];
        if (p?.thumbnail_brief) setBrief(p.thumbnail_brief);
        const thumbs = data.thumbnails ?? [];
        setThumbnails(thumbs);
        const sel = thumbs.find((t) => t.selected);
        if (sel) setSelected(sel.id);
      });
  }, [params.id]);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/thumbnail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, engine, brief, variations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThumbnails((prev) => [...data.thumbnails, ...prev]);
      toast.success(`${variations} thumbnail${variations > 1 ? "s" : ""} generated!`);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function selectThumbnail(id: string) {
    setSelected(id);
    try {
      await fetch(`/api/project/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch { /* non-critical */ }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thumbnail Generator</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate AI-powered thumbnails and pick your winner.</p>
        </div>
      </div>

      {/* Brief + config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thumbnail Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="min-h-[100px] text-sm"
            placeholder="Describe the thumbnail you want to generate..."
          />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Variations:</span>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setVariations(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all ${
                      variations === n
                        ? "bg-gradient-brand text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Engine:</span>
              <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-700">OpenAI gpt-image-2</span>
            </div>
          </div>
          <Button onClick={generate} disabled={generating || !brief} className="w-full">
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating {variations} thumbnail{variations > 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate {variations} Thumbnail{variations > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Thumbnails grid */}
      {thumbnails.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Generated Thumbnails</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {thumbnails.map((thumb, i) => (
              <div
                key={thumb.id}
                className={`group relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-200 animate-fade-in ${
                  selected === thumb.id
                    ? "border-brand-500 shadow-glow"
                    : "border-transparent hover:border-brand-300 shadow-card"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => selectThumbnail(thumb.id)}
              >
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={thumb.image_url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    {selected === thumb.id && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                        Selected
                      </span>
                    )}
                    {thumb.ctr_score != null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreBg(thumb.ctr_score)}`}>
                        CTR {Math.round(thumb.ctr_score)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={thumb.image_url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                    {selected === thumb.id && <Check className="h-4 w-4 text-brand-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {thumbnails.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="lg"
            disabled={!selected || proceeding}
            onClick={() => {
              setProceeding(true);
              router.push(`/dashboard/project/${params.id}/export`);
            }}
          >
            Proceed to Export
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
