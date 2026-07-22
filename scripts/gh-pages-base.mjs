// Пост-обработка dist для деплоя на GitHub Pages под подпутём (project site).
// Проставляет префикс base ко всем корневым абсолютным путям в готовых файлах.
// Запускать РОВНО ОДИН РАЗ после `astro build` (не идемпотентно).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const dist = 'dist';
const base = (process.env.SITE_BASE || '/CleanPlanet').replace(/\/+$/, ''); // '/CleanPlanet'

const EXT = new Set(['.html', '.css', '.xml', '.js', '.txt', '.json']);

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (EXT.has(extname(e.name).toLowerCase())) await rewrite(p);
  }
}

async function rewrite(file) {
  let s = await readFile(file, 'utf8');

  // 1) Атрибуты со ссылками/ассетами: href/src/action/srcset/content/poster="/..."
  s = s.replace(/((?:href|src|action|srcset|content|poster)=)(["'])\/(?!\/)/g, `$1$2${base}/`);

  // 2) CSS url(/...)
  s = s.replace(/url\((["']?)\/(?!\/)/g, `url($1${base}/`);

  // 3) Пути-картинки/ассеты в JS-данных (define:vars) и прочих строках:
  //    "/images/…", "/logo…", "/favicon…", "/_astro/…", "/api/…"
  s = s.replace(/(["'])\/(images\/|logo|favicon|_astro\/|api\/)/g, `$1${base}/$2`);

  // 4) meta refresh редиректы: content="0;url=/..."
  s = s.replace(/(url=)\/(?!\/)/g, `$1${base}/`);

  await writeFile(file, s);
}

await walk(dist);
await writeFile(join(dist, '.nojekyll'), '');
console.log(`Rewrote dist paths with base "${base}" and wrote .nojekyll`);
