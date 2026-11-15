"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Download, CheckCircle2, Rocket, Tag, FileText, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoreBg } from "@/lib/utils";
import type { VideoProject } from "@/types";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `${label} copied!` : "Copied!");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      {label}
    </Button>
  );
}

export default function ExportPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`/api/project/${params.id}`)
      .then((r) => r.json())
      .then(setProject);
  }, [params.id]);

  async function markPublished() {
    setMarking(true);
    try {
      const res = await fetch(`/api/project/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "exported" }),
      });
      const data = await res.json();
      setProject(data);
      toast.success("Marked as published!");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setMarking(false);
    }
  }

  function copyAll() {
    if (!project) return;
    const pkg = project.video_packages?.[0];
    const thumb = project.thumbnails?.find((t) => t.selected) ?? project.thumbnails?.[0];
    const md = [
      `# ${project.current_title ?? project.seed_idea}`,
      "",
      `**CTR Score:** ${pkg?.title_score ?? "N/A"}`,
      "",
      "## Description",
      pkg?.description ?? "",
      "",
      "## Tags",
      (pkg?.tags ?? []).map((t) => `- ${t}`).join("\n"),
      "",
      thumb ? `## Thumbnail\n${thumb.image_url}` : "",
    ].join("\n");
    navigator.clipboard.writeText(md);
    toast.success("Full package copied as Markdown!");
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const pkg = project.video_packages?.[0];
  const selectedThumb = project.thumbnails?.find((t) => t.selected) ?? project.thumbnails?.[0];
  const selectedTitle = project.title_suggestions?.find((t) => t.selected);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-5 w-5 text-brand-600" />
            <h1 className="text-xl font-bold text-gray-900">Export Package</h1>
          </div>
          <p className="text-sm text-gray-500">Your complete upload-ready YouTube package.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyAll}>
            <Copy className="h-4 w-4" />
            Copy as Markdown
          </Button>
          {project.status !== "exported" && (
            <Button variant="success" onClick={markPublished} disabled={marking}>
              {marking ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark Published
            </Button>
          )}
        </div>
      </div>

      {project.status === "exported" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">Published! This project is complete.</p>
        </div>
      )}

      {/* Thumbnail hero */}
      {selectedThumb && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video w-full bg-gray-100">
            <Image
              src={selectedThumb.image_url}
              alt="Selected thumbnail"
              fill
              className="object-cover"
              unoptimized
            />
            {selectedThumb.ctr_score != null && (
              <div className="absolute top-3 right-3">
                <span className={`rounded-full px-3 py-1 text-sm font-bold shadow-md ${scoreBg(selectedThumb.ctr_score)}`}>
                  CTR Score: {Math.round(selectedThumb.ctr_score)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-500">Selected thumbnail</span>
            <a
              href={selectedThumb.image_url}
              download="thumbnail.png"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </a>
          </div>
        </Card>
      )}

      {/* Title + score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Title</CardTitle>
            </div>
            <CopyButton text={project.current_title ?? ""} label="Copy title" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-gray-900">{project.current_title ?? project.seed_idea}</p>
          {selectedTitle?.ctr_score != null && (
            <div className="mt-2 inline-flex items-center gap-1.5">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreBg(selectedTitle.ctr_score)}`}>
                CTR Score: {Math.round(selectedTitle.ctr_score)}/100
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {pkg?.description && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-500" />
                <CardTitle className="text-base">Description</CardTitle>
              </div>
              <CopyButton text={pkg.description} label="Copy description" />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{pkg.description}</pre>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {pkg?.tags && pkg.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-500" />
                <CardTitle className="text-base">Tags ({pkg.tags.length})</CardTitle>
              </div>
              <CopyButton text={pkg.tags.join(", ")} label="Copy all tags" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pkg.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
