import * as path from 'node:path';
import type { BuildConfig } from './types';

export const config: BuildConfig = {
  noteDir: path.resolve('../note'),
  distDir: path.resolve('../dist'),
  builderDir: path.resolve('.'),
};
