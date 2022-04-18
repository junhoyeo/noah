# Mirrors

## Usage

Clone this repo.

```bash
git clone https://github.com/junhoyeo/mirrors
cd mirrors/
```

Clone your repositories in `repositories/*`.

```bash
git clone https://github.com/mirrors/some-repo-a ./repositories/some-repo-a
git clone https://github.com/mirrors/some-repo-b ./repositories/some-repo-b
```

Or init by cloning all repos from organization.

```bash
yarn build
yarn mirrors init https://github.com/mirrors
```

```bash
yarn mirrors pull

# To be implemented later
yarn mirrors push
```
