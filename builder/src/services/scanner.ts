import * as fs from 'node:fs';
import * as path from 'node:path';

export class FileScanner {
  static scanMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    this.scanDirectory(dir, files);
    return files;
  }

  private static scanDirectory(dir: string, files: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.scanDirectory(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
}
