// Copies the app's lesson and guide files into the website, so both always say the same thing.
// Run after any change to lessons.json or care.json in the app:  npm run sync
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appContent = process.env.APP_CONTENT_DIR
  ?? resolve(root, '../Dementia_app_project/RememberTogether/RememberTogether/Resources/Content');
const target = join(root, 'src/content/app');
const files = ['lessons.json', 'care.json'];

if (!existsSync(appContent)) {
  console.error(`App content folder not found: ${appContent}\nSet APP_CONTENT_DIR to the app's Resources/Content folder.`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });
for (const file of files) {
  copyFileSync(join(appContent, file), join(target, file));
  console.log(`Synced ${file}`);
}
