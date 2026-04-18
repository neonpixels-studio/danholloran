# danholloran.me

Personal blog and portfolio for Dan Holloran — full-stack developer and photographer based in Reno, NV.

Built with [VitePress](https://vitepress.dev) and [Tailwind CSS](https://tailwindcss.com).

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts a local dev server at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs a static site to `.vitepress/dist/`.

## Preview

```bash
npm run preview
```

Serves the production build locally for testing before deploy.

## Project Structure

```
.vitepress/
  config.mts          # VitePress configuration
  content/
    posts/            # Blog posts (Markdown)
    resume.ts         # Resume data
  theme/
    components/       # Vue components
public/               # Static assets
```
