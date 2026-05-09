# danholloran.me

Personal blog and portfolio for Dan Holloran — full-stack developer and photographer based in Reno, NV.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v24+ (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- [npm](https://www.npmjs.com/) v10+

### Getting Started

1. Clone the repository:

   ```sh
   git clone https://github.com/grimicorn/danholloran-me.git
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
