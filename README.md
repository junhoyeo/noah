# Noah (Mirrors)

## Usage

Clone this repo or create a new one using this as an template.

```bash
git clone https://github.com/junhoyeo/mirrors
cd mirrors/
yarn
```

Clone your repositories in `repositories/*`.

```bash
git clone https://github.com/mirrorland/some-repo-a ./repositories/some-repo-a
git clone https://github.com/mirrorland/some-repo-b ./repositories/some-repo-b
```

Or init by cloning all repos from organization.

```bash
yarn build
yarn mirrors watch mirrorland
```

```bash
# Update repos
yarn mirrors pull

# Remove branches that are no longer in remote
yarn mirrors prune

# To be implemented later
yarn mirrors push
```

TODO: Archive repository details by creating `noah.json` in root

```ts
{
  "[org]/[repo]": {
    org: '',
    name: '',
    description: '',
    date?
  }
}
```
