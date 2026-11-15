"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Clock, CheckCircle2, Film, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VideoProject, ProjectStatus } from "@/types";

const STATUS_META: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "outline" }> = {
  research: { label: "Researching", variant: "secondary" },
  titles_generated: { label: "Pick a Title", variant: "warning" },
  package_ready: { label: "Build Thumbnail", variant: "default" },
  thumbnail_ready: { label: "Ready to Export", variant: "success" },
  exported: { label: "Exported", variant: "outline" },
};

const STATUS_HREF: Record<ProjectStatus, string> = {
  research: "research",
  titles_generated: "research",
  package_ready: "package",
  thumbnail_ready: "thumbnail",
  exported: "export",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/dashboard/new");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-md">
                <Film className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VidPipeline</h1>
            </div>
            <p className="text-sm text-gray-500">From idea to upload-ready package</p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/new">
              <Plus className="h-5 w-5" />
              New Project
              <kbd className="ml-1 hidden rounded-md border border-white/30 bg-white/20 px-1.5 py-0.5 text-[10px] font-mono sm:block">
                ⌘K
              </kbd>
            </Link>
          </Button>
        </div>

        {/* Stats bar */}
        {projects.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[
              { icon: Film, label: "Total Projects", value: projects.length, color: "text-brand-600 bg-brand-50" },
              { icon: Sparkles, label: "In Progress", value: projects.filter((p) => p.status !== "exported").length, color: "text-amber-600 bg-amber-50" },
              { icon: CheckCircle2, label: "Exported", value: projects.filter((p) => p.status === "exported").length, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Project grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-brand shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Start your first project</h2>
            <p className="mb-8 max-w-sm text-gray-500">Turn any YouTube idea into a complete upload package with AI-powered research.</p>
            <Button asChild size="lg">
              <Link href="/dashboard/new">
                <Plus className="h-5 w-5" />
                New Video Project
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const meta = STATUS_META[p.status];
              const href = `/dashboard/project/${p.id}/${STATUS_HREF[p.status]}`;
              return (
                <Link
                  key={p.id}
                  href={href}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 card-shine">
                    <div className="h-1.5 w-full bg-gradient-brand opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {timeAgo(p.updated_at)}
                        </div>
                      </div>
                      <p className="mb-2 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{p.seed_idea}</p>
                      {p.current_title && (
                        <p className="text-xs text-brand-600 font-medium line-clamp-1 mt-1">{p.current_title}</p>
                      )}
                      <div className="mt-4 flex items-center justify-end text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                        Continue <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
