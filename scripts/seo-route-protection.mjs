import { readFileSync } from 'node:fs';

const protectedPaths = readFileSync(new URL('./seo-protected-paths.txt', import.meta.url), 'utf8')
  .trim().split(/\r?\n/);

export function assertProtectedSeoPaths(paths) {
  if (protectedPaths[0] !== '/' || new Set(protectedPaths).size !== protectedPaths.length) {
    throw new Error('Invalid protected sitemap path list in scripts/seo-protected-paths.txt');
  }
  const emitted = new Set(paths);
  const missing = protectedPaths.filter(path => !emitted.has(path));
  if (missing.length) {
    throw new Error(`Release would drop ${missing.length} published URL(s):\n${missing.join('\n')}\n`
      + 'Restore the routes or review the intentional removals in scripts/seo-protected-paths.txt.');
  }
}
