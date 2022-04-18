import axios from 'axios';
import { exec as execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { argv, exit } from 'process';
import queryString from 'query-string';
import shell from 'shelljs';
import util from 'util';

const exec = util.promisify(execSync);

const ROOT = path.join(__dirname, '..');
const REPOSITORIES = path.join(ROOT, './repositories');

// FIXME: Revoke and replace hardcoded token with injectable value
const GITHUB_TOKEN = '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';

const getActionFromArguments = async (
  argv: string[],
): Promise<{ action: 'help' } | { action: 'init'; organization: string }> => {
  const params = [...argv.slice(2)];
  if (params[0] === 'init') {
    if (params[1].length > 0) {
      return { action: 'init', organization: params[1] };
    }
  }
  return { action: 'help' };
};

const getDirectoriesInPath = async (path: string) =>
  (await fs.promises.readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const Base64 = {
  encode: (str: string): string =>
    Buffer.from(str, 'binary').toString('base64'),
};

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

    const { data } = await axios.get<{ name: string; html_url: string }[]>(
      queryString.stringifyUrl({ url, query: { type: 'all' } }),
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      },
    );

    const organizations = data.map((v) => ({
      name: v.name,
      repositoryURL: v.html_url,
    }));
    await Promise.allSettled(
      organizations.map(async (repository) => {
        const clonePath = `./repositories/${repository.name}`;
        console.log(`Cloning \`${repository.name}\` Started`);
        await exec(`git clone ${repository.repositoryURL} ${clonePath}`);
        console.log(`Cloning \`${repository.name}\` Done`);
      }),
    );
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
