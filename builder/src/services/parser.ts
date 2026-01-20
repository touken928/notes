import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
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
      
      let updatedAt: string;
      try {
        // Try to get the last commit date from git
        const gitDate = execSync(`git log -1 --format=%ai "${filePath}"`, {
          cwd: path.dirname(filePath),
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid console noise
        }).trim();

        if (gitDate) {
          updatedAt = new Date(gitDate).toISOString();
        } else {
          updatedAt = fs.statSync(filePath).mtime.toISOString();
        }
      } catch (e) {
        // Fallback to file system stats if git fails (e.g. not a git repo, file not tracked)
        updatedAt = fs.statSync(filePath).mtime.toISOString();
      }

      const article: Article = {
        id: this.generateId(relativePath),
        title,
        content: markdownContent,
        html,
        tags: data.tags || [],
        description: data.description || '',
        updatedAt,
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
