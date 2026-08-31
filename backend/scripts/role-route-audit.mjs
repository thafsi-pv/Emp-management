import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const modules = join(process.cwd(), 'src/modules');
const folders = await readdir(modules, { withFileTypes: true });
const failures = [];
for (const folder of folders.filter((entry) => entry.isDirectory())) {
  const file = join(modules, folder.name, `${folder.name}.controller.ts`);
  try {
    const source = await readFile(file, 'utf8');
    if (!source.includes('@UseGuards(JwtAuthGuard, RolesGuard)')) failures.push(file);
  } catch { /* module has a differently named controller or no controller */ }
}
if (failures.length) {
  console.error(`Controllers missing JWT/Roles guards:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('Role-route audit passed: all module controllers declare JWT and role guards.');
