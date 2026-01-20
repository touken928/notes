import { createHighlighter } from 'shiki';
import { FileScanner } from './services/scanner';
import { ArticleParser } from './services/parser';
import { Generator } from './services/generator';
import { config } from './config';
import type { Article } from './types';

async function build(): Promise<void> {
  console.log('Building blog...');

  const highlighter = await createHighlighter({
    themes: ['min-light'],
    langs: ['javascript', 'typescript', 'json', 'bash', 'markdown', 'html', 'css', 'python', 'yaml'],
  });

  const files = FileScanner.scanMarkdownFiles(config.noteDir);
  console.log(`Found ${files.length} markdown files`);

  const parser = new ArticleParser(highlighter);
  const articles: Article[] = [];
  
  for (const file of files) {
    const { article, error } = parser.parse(file);
    if (error) {
      console.error(error);
      continue;
    }
    if (article) {
      articles.push(article);
      console.log(`  - ${article.title}`);
    }
  }

  console.log(`Found ${articles.length} blog articles`);

  const tagCounts: Record<string, number> = {};
  for (const article of articles) {
    for (const tag of article.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  Generator.generateAll(articles, tagCounts);
  console.log('Build complete!');
}

build();
