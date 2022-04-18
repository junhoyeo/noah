import axios from 'axios';
import { exec as execSync } from 'child_process';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { argv, exit } from 'process';
import queryString from 'query-string';
import shell from 'shelljs';
import util from 'util';

const exec = util.promisify(execSync);

const ROOT = path.join(__dirname, '..');
const REPOSITORIES = path.join(ROOT, './repositories');

// NOTE: Old hardcoded token have been revoked
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const getActionFromArguments = async (
  argv: string[],
): Promise<
  | { action: 'help' | 'pull' | 'push' }
  | { action: 'init'; organization: string }
> => {
  const [command, ...params] = [...argv.slice(2)];
  if (command === 'init') {
    if (params[0].length > 0) {
      return { action: 'init', organization: params[0] };
    }
  }
  if (command === 'pull') {
    return { action: 'pull' };
  }
  if (command === 'push') {
    return { action: 'push' };
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

  if (given.action === 'init') {
    const url = queryString.stringifyUrl({
      url: `https://api.github.com/orgs/${given.organization}/repos`,
      query: {
        // FIXME: Replace hardcoded `page` with proper state
        page: 0,
        per_page: 100,
      },
    });

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
        const clonePath = `./repositories/${given.organization}/${repository.name}`;
        console.log(`Cloning \`${repository.name}\` Started`);
        await exec(`git clone ${repository.repositoryURL} ${clonePath}`);
        console.log(`Cloning \`${repository.name}\` Done`);
      }),
    );
    return;
  }

  if (given.action === 'pull') {
    const organizations = await getDirectoriesInPath(REPOSITORIES);

    const repositoriesByOrgs = await Promise.all(
      organizations.flatMap(async (organizationName) => {
        const _repositories = await getDirectoriesInPath(
          path.join(REPOSITORIES, organizationName),
        );
        return _repositories.map(
          (repositoryName) => `${organizationName}/${repositoryName}`,
        );
      }),
    );
    const repositories = repositoriesByOrgs.flat();

    await Promise.allSettled(
      repositories.map(async (repository) => {
        const { stdout, stderr } = await exec(
          `cd ./repositories/${repository} && git pull`,
        );
        console.log({ stdout, stderr, repository });
      }),
    );

    return;
  }

  if (given.action === 'push') {
    console.log(
      '🛸 `mirror push` is to be implemented in the near future. Please open an issue at https://github.com/junhoyeo/mirrors',
    );
    return;
  }

  if (given.action === 'help') {
    console.log('🪞 Mirror: https://github.com/junhoyeo/mirrors');
    return;
  }
};

main()
  .then(() => exit())
  .catch((err) => {
    console.error(err);
    exit();
  });
