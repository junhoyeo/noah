import axios from 'axios';
import { exec as synchronizedExec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { argv, exit } from 'process';
import shell from 'shelljs';
import util from 'util';

const ROOT = path.join(__dirname, '..');
const REPOSITORIES = path.join(ROOT, './repositories');

const getActionFromArguments = async (
  argv: string[],
): Promise<{ action: 'help' } | { action: 'init'; organization: string }> => {
  const params = [...argv.slice(2)];
  if (params[0] === 'init') {
    if (params[1].length > 0) {
      return { action: 'init', organization: argv[1] };
    }
  }
  return { action: 'help' };
};

const getDirectoriesInPath = async (path: string) =>
  (await fs.promises.readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const main = async () => {
  if (!shell.which('git') || !shell.which('gh')) {
    console.log('🪞 Mirror requires `git` and `gh` to be installed.');
    return;
  }
  const given = await getActionFromArguments(argv);

  if (given.action === 'help') {
    console.log('🪞 Mirror: https://github.com/junhoyeo/mirrors');
    return;
  }

  if (given.action === 'init') {
    // FIXME: Replace hardcoded `page` with proper state
    const url = `https://api.github.com/orgs/${
      given.organization
    }/repos?page=${0}&per_page=100`;
    const { data } = await axios.get<{ html_url: string }[]>(url);
    const organizations = data.map((v) => v.html_url);
    console.log(organizations);
    return;
  }

  const repositories = await getDirectoriesInPath(REPOSITORIES);
  console.log(repositories);
};

main()
  .then(() => exit())
  .catch((err) => {
    console.error(err);
    exit();
  });
