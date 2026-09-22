# danholloran.me

Personal blog and portfolio for Dan Holloran — full-stack developer and photographer based in Reno, NV.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v24+ (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- [npm](https://www.npmjs.com/) v10+

### Getting Started

1. Clone the repository:

   ```sh
   git clone https://github.com/neonpixels-studio/danholloran.git
   cd danholloran-me
   ```

2. Install the correct Node version:

   ```sh
   nvm use
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

4. Start the development server:

   ```sh
   npm run dev
   ```

### Responsive post images

Post cover images under `public/images/posts/` (`.jpg`/`.jpeg`/`.png`, directly
in that directory — see `isVariantEligible` in `responsiveImage.ts`) are served
through a shared `ResponsiveImage.vue` component that renders a `<picture>`
with avif/webp variants sized for their context (small list/card thumbnails
vs. the larger single-post hero). A cover image outside that set (a different
format/location) renders as a plain `<img>` instead — a `<picture>`'s
`<source>` does not fall back to the next one on a 404, so `ResponsiveImage`
only ever points one at variant urls it's sure were generated.

The variant files themselves aren't committed — they're generated on the fly
by [`sharp`](https://sharp.pixelplumbing.com/) via `generateImageVariants.ts`,
which runs automatically at the top of `.vitepress/config.ts` before every
`npm run dev` and `npm run build`. Output goes to the gitignored
`public/images/posts/variants/` directory; regeneration is skipped per-file
once its variants are newer than its source, so a repeat run only
(re-)processes new/changed post images — a clean checkout still (re-)encodes
every post image the first time, which takes real time (the avif encoder
especially); caching that directory between CI runs is a possible follow-up
if that first-run cost becomes a problem. A failed encode fails the whole
`dev`/`build` run rather than silently shipping a page with a missing
variant.

Generation only runs once, when `.vitepress/config.ts` loads — adding a new
post (and its cover image) while `npm run dev` is already running needs a
dev-server restart before that post's `<picture>` has real variants; `npm run
build` always regenerates fresh since it's a new process.

### Available Commands

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start the development server      |
| `npm run build`    | Build for production              |
| `npm run test`     | Run tests in watch mode           |
| `npm run test:ui`  | Run tests with Vitest UI          |
| `npm run test:ci`  | Run tests once (CI mode)          |
| `npm run lint`     | Check formatting and linting      |
| `npm run lint:fix` | Fix formatting and linting issues |
