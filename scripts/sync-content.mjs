import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'Тексты для сайта');
const targetDir = path.join(root, 'src', 'content', 'pages');

function slugFromFrontmatter(markdown) {
  const match = markdown.match(/^---\s*[\s\S]*?\nslug:\s*"?([^"\n]+)"?\s*[\s\S]*?\n---/);
  const raw = match?.[1]?.trim();
  if (raw === '/') return 'home';
  return raw?.replaceAll('/', '') || `page-${Date.now()}`;
}

function cleanMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const cleaned = [];
  let skipDirectiveList = false;
  let frontmatterClosed = false;
  let firstHeadingRemoved = false;
  let skipSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '---') {
      cleaned.push(line);
      if (cleaned.length > 1) frontmatterClosed = true;
      continue;
    }
    if (frontmatterClosed && !firstHeadingRemoved && /^#\s+/.test(trimmed)) {
      firstHeadingRemoved = true;
      continue;
    }
    // Пропускаем разделы, дублирующие компоненты макета (связанные услуги,
    // финальная форма, примеры работ — их отдают ServiceCards/LeadForm/галерея).
    const sectionHeading = trimmed.match(/^##\s+(.+)$/);
    if (sectionHeading) {
      skipSection =
        /^(другие услуги|связанные услуги|заказать|примеры выполненных работ|примеры работ)/i.test(
          sectionHeading[1].trim(),
        );
    }
    if (skipSection) continue;
    const directive = /^\*\*(Кнопки|Кнопка|Поля формы):\*\*/i.test(trimmed);
    const editorNote =
      /^>\s*\[(УТОЧНИТЬ|ДОБАВИТЬ|ПОЛНОЕ НАИМЕНОВАНИЕ ИП|ИНН|ОГРНИП|АДРЕС|EMAIL)[^\]]*\]\s*$/i.test(
        trimmed,
      ) ||
      /^\[(ДОБАВИТЬ|ПОЛНОЕ НАИМЕНОВАНИЕ ИП|ИНН|ОГРНИП|АДРЕС РЕГИСТРАЦИИ|EMAIL)[^\]]*\]\s*$/i.test(
        trimmed,
      );

    if (directive) {
      skipDirectiveList = true;
      continue;
    }

    if (skipDirectiveList) {
      if (/^\s*-\s+/.test(line) || trimmed === '') continue;
      skipDirectiveList = false;
    }

    if (editorNote) continue;

    cleaned.push(
      line
        .replace(/\[УТОЧНИТЬ ЦЕНУ[^\]]*\]/gi, 'по запросу')
        .replace(/\[УТОЧНИТЬ[^\]]*\]/gi, 'уточняется')
        .replace(/\[ДОБАВИТЬ[^\]]*\]/gi, ''),
    );
  }

  return cleaned.join('\n').replace(/\n{4,}/g, '\n\n\n');
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => file.endsWith('.md'));

for (const file of files) {
  const markdown = await readFile(path.join(sourceDir, file), 'utf8');
  const slug = slugFromFrontmatter(markdown) || path.basename(file, '.md');
  const fileName = slug === '' ? 'home' : slug.replaceAll('/', '') || 'home';
  await writeFile(path.join(targetDir, `${fileName}.md`), cleanMarkdown(markdown), 'utf8');
}

console.log(`Synced ${files.length} markdown files to src/content/pages`);
