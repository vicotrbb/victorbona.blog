# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js personal blog and portfolio site using the App Router, TypeScript, Tailwind CSS, and MDX.

- `app/`: application routes, layouts, API routes, components, hooks, and utility modules.
- `app/blog/posts/`: MDX blog posts. Filenames become slugs, for example `welcome.mdx`.
- `app/articles/` and `app/projects/`: typed data and pages for articles and project listings.
- `content/articles/`: reserved area for article assets or future imported content.
- `chart/`: Helm chart used for Kubernetes deployment.
- `.github/workflows/build.yml`: CI builds and pushes the Docker image and Helm chart on `main`.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Next.js development server.
- `npm run build`: create the production Next.js standalone build; this is the primary validation command.
- `npm run start`: run the production server after a successful build.
- `docker build -t victorbona-blog .`: validate the production container path locally.
- `helm lint chart/`: validate the deployment chart when editing `chart/`.

## Coding Style & Naming Conventions

Use TypeScript and React function components for UI code. Keep reusable components in `app/components/` with PascalCase filenames such as `ArticleCard.tsx`; hooks belong in `app/hooks/` and should use `useCamelCase` naming. Prefer existing Tailwind patterns and CSS variables in `app/global.css` for color, spacing, typography, and dark mode.

MDX posts must include frontmatter with `title`, `publishedAt`, `summary`, and `tags`. Use `YYYY-MM-DD` dates and comma-separated tags.

## Testing Guidelines

There is currently no test runner or `npm test` script. For now, run `npm run build` before submitting changes. If adding tests, place them near the code they cover with `*.test.ts` or `*.test.tsx` names and add the corresponding package script.

## Commit & Pull Request Guidelines

Recent history mixes short imperative commits with Conventional Commits such as `fix(dashboard): ...` and `ci: ...`. Prefer concise, imperative messages; use a scope when it clarifies the touched area, for example `fix(blog): correct post metadata`.

Pull requests should include a short summary, validation commands run, linked issue when applicable, and screenshots for visible UI changes. Mention deployment impact when touching `Dockerfile`, `.github/workflows/`, or `chart/`.

## Security & Configuration Tips

Do not commit secrets. Keep environment-specific values outside source control.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
