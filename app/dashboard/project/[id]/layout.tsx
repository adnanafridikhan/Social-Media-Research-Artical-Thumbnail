"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";
import { StepIndicator } from "@/components/pipeline/StepIndicator";
import type { VideoProject } from "@/types";

export default function ProjectLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const [project, setProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    fetch(`/api/project/${params.id}`)
      .then((r) => r.json())
      .then(setProject)
      .catch(console.error);
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gradient-canvas">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-brand">
                <Film className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">VidPipeline</span>
            </div>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {project?.seed_idea && (
            <p className="hidden text-xs text-gray-500 truncate max-w-[200px] sm:block">{project.seed_idea}</p>
          )}

          <div className="ml-auto">
            {project && (
              <StepIndicator projectId={params.id} currentStatus={project.status} />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
