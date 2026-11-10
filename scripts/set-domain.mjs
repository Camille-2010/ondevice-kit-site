#!/usr/bin/env node
/**
 * 绑定自己的域名时，把仓库里的 YOUR_DOMAIN 占位符一次性替换掉。
 * 用法: node scripts/set-domain.mjs ondevice.example.com
 * 会改 index.html / sitemap.xml / robots.txt，并生成 CNAME（GitHub Pages 用）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
  console.error('用法: node scripts/set-domain.mjs 你的域名');
  console.error('示例: node scripts/set-domain.mjs ondevice.example.com');
  process.exit(1);
}
const domain = input
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '')
  .replace(/^www\./i, '')
  .toLowerCase();
if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
  console.error('域名格式不对: ' + input);
  process.exit(1);
}

const targets = ['index.html', 'sitemap.xml', 'robots.txt'];
const patterns = [/https:\/\/YOUR_DOMAIN/g, /https:\/\/ondevice-kit\.app\.workbuddy\.host/g];
let total = 0;
for (const rel of targets) {
  const p = join(root, rel);
  let s = readFileSync(p, 'utf8');
  let n = 0;
  for (const re of patterns) {
    s = s.replace(re, () => { n++; return 'https://' + domain; });
  }
  if (n) writeFileSync(p, s.replace(/\r\n/g, '\n'), 'utf8');
  total += n;
  console.log(`  ${rel}: 替换 ${n} 处`);
}
writeFileSync(join(root, 'CNAME'), domain + '\n', 'utf8');
console.log(`完成：共 ${total} 处，站点域名已设为 https://${domain}`);
console.log('CNAME 已生成（GitHub Pages 用；其他平台在控制台绑域名即可）。');
console.log('接下来：git add -A && git commit -m "set domain" && git push');
