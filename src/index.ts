import fs from 'fs';
import path from 'path';
import { exit } from 'process';

const ROOT = path.join(__dirname, '..');
const REPOSITORIES = path.join(ROOT, './repositories');

const getDirectoriesInPath = async (path: string) =>
  (await fs.promises.readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const main = async () => {
  const repositories = await getDirectoriesInPath(REPOSITORIES);
  console.log(repositories);
};

main()
  .then(() => exit())
  .catch((err) => {
    console.error(err);
    exit();
  });
