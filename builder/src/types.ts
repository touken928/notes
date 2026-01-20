export interface ArticleMeta {
  tags?: string[];
  blog?: boolean;
  description?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  html: string;
  tags: string[];
  description?: string;
  updatedAt: string;
  relativePath: string;
}

export interface SearchIndex {
  tagCounts: Record<string, number>;
}

export interface BuildConfig {
  noteDir: string;
  distDir: string;
  builderDir: string;
}
