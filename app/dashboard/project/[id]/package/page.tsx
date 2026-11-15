"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, ArrowRight, FileText, Tag, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { VideoProject, VideoPackage } from "@/types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="sm" onClick={copy}>
      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PackagePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [pkg, setPkg] = useState<VideoPackage | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const [newTag, setNewTag] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const debDescription = useDebounce(description, 1000);
  const debBrief = useDebounce(brief, 1000);
  const savedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/project/${params.id}`)
      .then((r) => r.json())
      .then((data: VideoProject) => {
        setProject(data);
        const p = data.video_packages?.[0];
        if (p) {
          setPkg(p);
          setDescription(p.description ?? "");
          setTags(p.tags ?? []);
          setBrief(p.thumbnail_brief ?? "");
        }
      });
  }, [params.id]);

  useEffect(() => {
    if (!pkg || !debDescription || savedRef.current) return;
    fetch(`/api/project/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, [debDescription, debBrief, params.id, pkg]);

  async function regenerate() {
    if (!project) return;
    const sel = project.title_suggestions?.find((t) => t.selected);
    if (!sel) { toast.error("No title selected"); return; }
    setRegenerating(true);
    try {
      const res = await fetch("/api/package/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, titleId: sel.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDescription(data.description);
      setTags(data.tags);
      setBrief(data.thumbnailBrief);
      toast.success("Package regenerated!");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRegenerating(false);
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  }

  if (!pkg && !regenerating) {
    return (
      <div className="py-20 text-center animate-fade-in">
        <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500 mb-4">No package yet.</p>
        <Button onClick={regenerate}>Generate Package</Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Your Video Package</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit any section. Changes auto-save.</p>
        </div>
        <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
          {regenerating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Regenerate All
        </Button>
      </div>

      {project?.current_title && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-3">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-0.5">Selected Title</p>
          <p className="font-semibold text-brand-900">{project.current_title}</p>
        </div>
      )}

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              <CardTitle className="text-base">Description</CardTitle>
            </div>
            <CopyButton text={description} />
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[220px] text-sm font-mono leading-relaxed"
            placeholder="Description will appear here..."
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-500" />
              <CardTitle className="text-base">Tags ({tags.length}/15)</CardTitle>
            </div>
            <CopyButton text={tags.join(", ")} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="group flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 cursor-default"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-brand-300 hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="Add a tag..."
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Brief */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-brand-500" />
            <CardTitle className="text-base">Thumbnail Brief</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="min-h-[120px] text-sm leading-relaxed"
            placeholder="Thumbnail brief will appear here..."
          />
          <p className="mt-2 text-xs text-gray-400">This is the prompt that will be sent to the image AI in the next step.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={proceeding || !brief}
          onClick={() => {
            setProceeding(true);
            router.push(`/dashboard/project/${params.id}/thumbnail`);
          }}
        >
          Generate Thumbnails
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
