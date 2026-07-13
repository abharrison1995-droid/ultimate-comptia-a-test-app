import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(root, '..', 'index.html');
const poolPath = join(root, 'millionaire-pool.js');

let html = readFileSync(htmlPath, 'utf8');
const pool = readFileSync(poolPath, 'utf8').trim();

const start = html.indexOf('const MILLIONAIRE_POOL');
const end = html.indexOf('const MILLIONAIRE_LADDER');
if (start < 0 || end < 0 || end <= start) throw new Error('MILLIONAIRE_POOL block not found');

html = html.slice(0, start) + pool + '\n' + html.slice(end);
writeFileSync(htmlPath, html);
console.log('Synced MILLIONAIRE_POOL into index.html');
