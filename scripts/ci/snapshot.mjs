import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Code + build/check inputs only. Never collect environment files, credentials,
// local browser state or unrelated design-owner documents.
const inputs = ['src', 'public', 'scripts', '.github/workflows', 'package.json',
  'package-lock.json', 'index.html', 'jsconfig.json', 'vite.config.js', 'vercel.json',
  'tailwind.config.js', 'postcss.config.js', 'eslint.config.js',
  'docs/business-turks-2026/catalog-expansion-03.json'];
const paths = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others',
  '--exclude-standard', '--', ...inputs], { encoding: 'utf8' }).split('\0').filter(Boolean))].sort();
const files = paths.map(file => {
  const bytes = readFileSync(file);
  const text = isUtf8(bytes) && !bytes.includes(0);
  const content = text ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes;
  return { path: file, encoding: text ? 'utf8-lf' : 'binary', sha256: createHash('sha256').update(content).digest('hex') };
});
const report = {
  schemaVersion: 1,
  gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  eventSha: process.env.GITHUB_SHA || null,
  digestPolicy: 'UTF-8 text normalised to LF; binary files hashed byte-for-byte',
  sourceDigest: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
  files,
};
const target = process.argv[2] || 'output/ci/source-snapshot.json';
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
console.log(`Source snapshot: ${report.sourceDigest} (${files.length} files), HEAD ${report.gitHead}`);
