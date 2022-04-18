# Mirrors

## Dependencies

- `nodegit@0.28.0-alpha.11`: NodeGit. `alpha.11` with Apple Silicon support 👍

## Usage

Clone this repo.

```bash
git clone https://github.com/junhoyeo/mirrors
cd mirrors/
```

Remove `.git`

```bash
rm -rf .git
```

Clone your repositories in `repositories/*`.

```bash
git clone https://github.com/junhoyeo/some-repo-a ./repositories/some-repo-a
git clone https://github.com/junhoyeo/some-repo-b ./repositories/some-repo-b
```

Or init from organization.

```bash
yarn build
yarn mirrors init https://github.com/mirrors
```

```bash
yarn mirrors pull

# To be implemented later
yarn mirrors push
```
