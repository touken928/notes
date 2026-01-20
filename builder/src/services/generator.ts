import * as fs from 'node:fs';
import * as path from 'node:path';
import { config } from '../config';
import type { Article } from '../types';

export class Generator {
  public static generateAll(articles: Article[], tagCounts: Record<string, number>): void {
    // Ensure dist directory exists
    if (!fs.existsSync(config.distDir)) {
      fs.mkdirSync(config.distDir, { recursive: true });
    }
    
    // Copy style.css
    const styleSrc = path.join(config.builderDir, 'src/templates/style.css');
    const styleDest = path.join(config.distDir, 'style.css');
    if (fs.existsSync(styleSrc)) {
        fs.copyFileSync(styleSrc, styleDest);
    }

    const articleDir = path.join(config.distDir, 'article');
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    const appJsPath = path.join(config.builderDir, 'src', 'app.js');
    const appJs = fs.readFileSync(appJsPath, 'utf-8');

    const indexHtml = this.renderIndex(articles, tagCounts, appJs);
    fs.writeFileSync(path.join(config.distDir, 'index.html'), indexHtml);

    for (const article of articles) {
      const articleHtml = this.renderArticle(article);
      const filePath = path.join(articleDir, `${article.id}.html`);
      fs.writeFileSync(filePath, articleHtml);
    }
  }

  private static loadTemplate(name: string): string {
    const templatePath = path.join(config.builderDir, 'src', 'templates', `${name}.html`);
    return fs.readFileSync(templatePath, 'utf-8');
  }

  private static render(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private static renderIndex(articles: Article[], tagCounts: Record<string, number>, appJs: string): string {
    const template = this.loadTemplate('index');

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) =>
        `<button class="tag-btn" data-tag="${tag}">${tag} <span class="text-xs opacity-50 ml-1">${count}</span></button>`
      )
      .join('');

    const data = {
      ARTICLES: JSON.stringify(
        articles.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          tags: a.tags,
          updatedAt: a.updatedAt,
        }))
      ),
      TAG_BUTTONS: sortedTags,
      ARTICLE_LIST: '',
      APP_JS: appJs,
      ARTICLE_COUNT: String(articles.length),
      TAG_COUNT: String(Object.keys(tagCounts).length),
    };

    return this.render(template, data);
  }

  private static renderArticle(article: Article): string {
    const template = this.loadTemplate('article');

    const tagsHtml = article.tags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join(' ');

    const data = {
      TITLE: article.title,
      TAGS: tagsHtml,
      CONTENT: article.html,
      UPDATED_AT: this.formatDate(article.updatedAt),
    };

    return this.render(template, data);
  }

  private static formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  }
}
