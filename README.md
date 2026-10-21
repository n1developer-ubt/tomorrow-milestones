# Tomorrow Milestones

AI-assisted milestone drafting for learning challenges. The AI drafts, a human reviews, and only accepted milestones are saved.

```
prompt → structured output → validation → human review → save
```

## Setup

```bash
nvm use
pnpm install
cp .env.example .env.local
pnpm dev
```

Set `OPENAI_API_KEY` and `MONGODB_URI` in `.env.local`.

## Scripts

| Script              | Purpose                         |
| ------------------- | ------------------------------- |
| `pnpm dev`          | Dev server                      |
| `pnpm lint`         | ESLint                          |
| `pnpm typecheck`    | TypeScript                      |
| `pnpm format:check` | Prettier                        |
| `pnpm test`         | Unit + component tests (Vitest) |
| `pnpm test:e2e`     | Playwright happy path           |
| `pnpm eval`         | Prompt evals (promptfoo, paid)  |

## Stack

TODO

## Prompt & schema

TODO

## Failure handling

TODO

## Persistence

TODO

## Auth

TODO

## What I'd do next

TODO
