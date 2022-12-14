import axios from 'axios';
import { exec as execSync } from 'child_process';
import 'dotenv/config';
import { argv, exit } from 'process';
import queryString from 'query-string';
import shell from 'shelljs';
import util from 'util';

import { getRepositories } from './github';

const exec = util.promisify(execSync);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME || 'junhoyeo';

const getActionFromArguments = async (
  argv: string[],
): Promise<
  | { action: 'help' | 'pull' | 'push' | 'prune' }
  | { action: 'watch'; organization: string }
> => {
  const [command, ...params] = [...argv.slice(2)];
  if (command === 'watch') {
    if (params[0].length > 0) {
      let organization: string = params[0];
      if (organization.includes('github.com')) {
        organization = organization.split('github.com/')[1].split('/')[0];
      }
      return { action: 'watch', organization };
    }
  }
  if (command === 'pull') {
    return { action: 'pull' };
  }
  if (command === 'push') {
    return { action: 'push' };
  }
  if (command === 'prune') {
    return { action: 'prune' };
  }
  return { action: 'help' };
};

const main = async () => {
  if (!shell.which('git') || !shell.which('gh')) {
    console.log('🪞 Mirror requires `git` and `gh` to be installed.');
    return;
  }
  const given = await getActionFromArguments(argv);

  if (given.action === 'watch') {
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

    const repos = data.map((v) => ({
      name: v.name,
      repositoryURL: v.html_url,
    }));

    const TOTAL_NUMBER_OF_REPOS = repos.length;
    let REPO_COUNT = 0;
    console.log('Found repos:', TOTAL_NUMBER_OF_REPOS);

    await Promise.allSettled(
      repos.map(async (repository) => {
        const clonePath = `./repositories/${given.organization}/${repository.name}`;
        console.log(`Cloning \`${repository.name}\` Started`);
        await exec(
          `git clone ${repository.repositoryURL.replace(
            'https://github.com',
            `https://${USERNAME}@github.com`,
          )} ${clonePath}`,
        );
        REPO_COUNT += 1;
        console.log(
          `Cloning \`${repository.name}\` Done (${REPO_COUNT}/${TOTAL_NUMBER_OF_REPOS})`,
        );
      }),
    );
    return;
  }

  if (given.action === 'pull') {
    const repositories = await getRepositories();

    await Promise.allSettled(
      repositories.map(async (repository) => {
        try {
          console.log(repository, 'running...');
          let { stdout: pwd } = await exec(`pwd`).catch(() => ({
            stdout: '.',
          }));
          let { stdout, stderr } = await exec(
            `cd ./repositories/${repository} && git pull`,
          );
          if (
            stderr.includes(
              'error: Pulling is not possible because you have unmerged',
            )
          ) {
            const countQuery = `git log --branches --not --remotes  --count  |  grep -c 'commit'`;
            await exec(`cd ${pwd} && cd ./repositories/${repository}`);

            const { stdout: countOut } = await exec(`${countQuery}`);
            const count = parseInt(countOut);
            console.log({ count });

            const res = await exec(
              `git reset --soft HEAD~${count} && git stash -u && git pull && git stash clear`,
            );
            stdout = res.stdout;
            stderr = res.stderr;
          }
          console.log({ stdout, stderr, repository });
        } catch (err) {
          console.error(err);
        }
      }),
    );
    return;
  }

  if (given.action === 'prune') {
    const removeBranchesNotInRemote = `git fetch -p ; git branch -r | awk '{print $1}' | egrep -v -f /dev/fd/0 <(git branch -vv | grep origin) | awk '{print $1}' | xargs git branch -d`;
    const repositories = await getRepositories();

    await Promise.allSettled(
      repositories.map(async (repository) => {
        try {
          const { stdout, stderr } = await exec(
            `cd ./repositories/${repository}; ${removeBranchesNotInRemote}`,
            { shell: '/bin/bash' },
          );
          console.log({ stdout, stderr, repository });
        } catch (err) {
          console.error(err);
        }
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
