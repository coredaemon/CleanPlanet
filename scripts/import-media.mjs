import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceCollages = path.join(root, '01');
const sourcePairs = path.join(root, '02');
const targetRoot = path.join(root, 'public', 'images', 'projects');
const dataFile = path.join(root, 'src', 'data', 'projects.json');

const dirs = {
  collages: path.join(targetRoot, 'collages'),
  before: path.join(targetRoot, 'before'),
  after: path.join(targetRoot, 'after'),
  thumbnails: path.join(targetRoot, 'thumbnails'),
};

for (const dir of Object.values(dirs)) await mkdir(dir, { recursive: true });

async function toWebp(source, target, width) {
  await sharp(source)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target);
}

const manifest = { collages: [], pairs: [] };
const collageFiles = (await readdir(sourceCollages)).filter((file) => /\.jpe?g$/i.test(file));

for (const file of collageFiles) {
  const id = file.match(/^(\d+)/)?.[1] ?? path.basename(file, path.extname(file));
  const name = `project-${id}-before-after.webp`;
  const source = path.join(sourceCollages, file);
  await toWebp(source, path.join(dirs.collages, name), 1600);
  await toWebp(source, path.join(dirs.thumbnails, `project-${id}-thumb.webp`), 520);
  manifest.collages.push({
    id,
    src: `/images/projects/collages/${name}`,
    thumb: `/images/projects/thumbnails/project-${id}-thumb.webp`,
    alt: 'Результат уборки помещения до и после',
  });
}

const pairFiles = (await readdir(sourcePairs)).filter((file) => /\.jpe?g$/i.test(file));
const groups = new Map();

for (const file of pairFiles) {
  const match = file.match(/^(\d+)_0?([12])\.jpe?g$/i);
  if (!match) continue;
  const [, id, side] = match;
  const group = groups.get(id) ?? {};
  group[side === '1' ? 'before' : 'after'] = file;
  groups.set(id, group);
}

for (const [id, group] of [...groups.entries()].sort(([a], [b]) => Number(a) - Number(b))) {
  if (!group.before || !group.after) {
    console.warn(`Incomplete before/after pair: ${id}`);
    continue;
  }
  const beforeName = `project-${id}-before.webp`;
  const afterName = `project-${id}-after.webp`;
  await toWebp(path.join(sourcePairs, group.before), path.join(dirs.before, beforeName), 1400);
  await toWebp(path.join(sourcePairs, group.after), path.join(dirs.after, afterName), 1400);
  await toWebp(
    path.join(sourcePairs, group.after),
    path.join(dirs.thumbnails, `project-${id}-after-thumb.webp`),
    480,
  );
  manifest.pairs.push({
    id,
    before: `/images/projects/before/${beforeName}`,
    after: `/images/projects/after/${afterName}`,
    thumb: `/images/projects/thumbnails/project-${id}-after-thumb.webp`,
    beforeAlt: 'Помещение до уборки',
    afterAlt: 'Помещение после уборки',
  });
}

await writeFile(dataFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Imported ${manifest.collages.length} collages and ${manifest.pairs.length} pairs`);
