import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const [template, name, ...extra] = process.argv.slice(2);
const templates = ['react-site', 'phaser-game', 'wxt-extension'];
if (
  !templates.includes(template) ||
  !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name ?? '') ||
  extra.length
) {
  console.error(
    '用法：pnpm new <react-site|phaser-game|wxt-extension> <小写项目名>',
  );
  process.exit(1);
}
const target = path.join(root, 'apps', name);
try {
  await access(target);
  console.error(`项目已存在：${name}`);
  process.exit(1);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(target, { recursive: false });
await cp(path.join(root, 'templates', template), target, {
  recursive: true,
  filter: (source) =>
    !['node_modules', 'dist', '.wxt', '.output'].includes(
      path.basename(source),
    ),
});
const manifest = JSON.parse(
  await readFile(path.join(target, 'package.json'), 'utf8'),
);
manifest.name = name;
await writeFile(
  path.join(target, 'package.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
await writeFile(
  path.join(target, 'README.md'),
  `# ${name}\n\n基于 ${template} 模板创建。\n\n开发：\`pnpm --filter ${name} dev\`\n\n构建：\`pnpm --filter ${name} build\`\n`,
);
console.log(
  `已创建 apps/${name}。接下来运行：\npnpm install\npnpm --filter ${name} dev`,
);
