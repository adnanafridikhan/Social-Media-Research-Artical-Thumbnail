export type ProjectStatus =
  | "research"
  | "titles_generated"
  | "package_ready"
  | "thumbnail_ready"
  | "exported";

export interface VideoProject {
  id: string;
  user_id: string;
  seed_idea: string;
  status: ProjectStatus;
  current_title: string | null;
  created_at: string;
  updated_at: string;
  title_suggestions?: TitleSuggestion[];
  video_packages?: VideoPackage[];
  thumbnails?: Thumbnail[];
}

export interface TitleSuggestion {
  id: string;
  project_id: string;
  title: string;
  ctr_score: number | null;
  search_volume: number | null;
  competition: string | null;
  raw_data: Record<string, unknown> | null;
  selected: boolean;
  created_at: string;
}

export interface VideoPackage {
  id: string;
  project_id: string;
  description: string | null;
  tags: string[] | null;
  thumbnail_brief: string | null;
  title_score: number | null;
  created_at: string;
}

export interface Thumbnail {
  id: string;
  project_id: string;
  image_url: string;
  engine: "openai" | "vidiq";
  prompt_used: string | null;
  ctr_score: number | null;
  selected: boolean;
  created_at: string;
}

export interface GenerateTitlesRequest {
  seedIdea: string;
  projectId?: string;
}

export interface GenerateTitlesResponse {
  projectId: string;
  titles: TitleSuggestion[];
}

export interface GeneratePackageRequest {
  projectId: string;
  titleId: string;
}

export interface GeneratePackageResponse {
  description: string;
  tags: string[];
  thumbnailBrief: string;
}

export interface GenerateThumbnailRequest {
  projectId: string;
  engine: "openai" | "vidiq";
  brief: string;
  variations: 1 | 2 | 3 | 4;
}

export interface GenerateThumbnailResponse {
  thumbnails: Thumbnail[];
}
