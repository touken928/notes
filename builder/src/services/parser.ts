import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import type { Highlighter } from 'shiki';
import { config } from '../config';
import type { Article } from '../types';

export class ArticleParser {
  private md: MarkdownIt;

  constructor(highlighter: Highlighter) {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (code, lang) => {
        try {
          return highlighter.codeToHtml(code, {
            lang: lang || 'text',
            theme: 'min-light', // Clean white theme
            defaultColor: false,
          });
        } catch (e) {
          return `<pre><code>${this.md.utils.escapeHtml(code)}</code></pre>`;
        }
      },
    });

    this.md.use(anchor, {
      permalink: anchor.permalink.headerLink({ safariReaderFix: true }),
    });
  }

  parse(filePath: string): { article: Article | null; error?: string } {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);

      if (data.blog !== true) {
        return { article: null };
      }

      const relativePath = path.relative(config.noteDir, filePath);
      const title = path.basename(filePath, '.md');
      const html = this.md.render(markdownContent);
      const stats = fs.statSync(filePath);

      const article: Article = {
        id: this.generateId(relativePath),
        title,
        content: markdownContent,
        html,
        tags: data.tags || [],
        description: data.description || '',
        updatedAt: stats.mtime.toISOString(),
        relativePath,
      };

      return { article };
    } catch (error) {
      return { article: null, error: `Failed to parse ${filePath}: ${error}` };
    }
  }

  private generateId(relativePath: string): string {
    return relativePath.replace(/\.md$/, '').replace(/[\/\\]/g, '_');
  }
}
