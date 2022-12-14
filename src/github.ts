import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const REPOSITORIES = path.join(ROOT, './repositories');

const getDirectoriesInPath = async (path: string) =>
  (await fs.promises.readdir(path, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

export const getRepositories = async () => {
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
  return repositories;
};
