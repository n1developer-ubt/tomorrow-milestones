# Tomorrow Milestones

AI-assisted milestone drafting for learning challenges. Staff describe a challenge, the AI drafts milestones, staff review them (accept, reject, edit, refine), and only accepted milestones end up in the saved plan.

```
brief → prompt → structured output → validation → human review → save
```

## Live demo

**https://tomorrow-milestones.vercel.app/**

Use this if you don't want to run the source code. The demo is protected by basic auth; the username and password were sent to HR.

## Design decisions

### 1. Evals: promptfoo

| Option                 | Pros                                                                    | Cons                                                   |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| **promptfoo** (chosen) | TypeScript-friendly, YAML config, JS assertions, LLM rubric, web viewer | Fewer ready-made metrics than DeepEval                 |
| DeepEval               | Rich metrics (G-Eval, hallucination, faithfulness)                      | Python: a second language and toolchain in a TS repo   |
| Vitest + LLM judge     | No new tool                                                             | Rebuilds caching, reports and model comparison by hand |

**Why:** unit tests use a fake LLM, so they can't tell if the prompt is good. promptfoo runs the real model against the exact system prompt and Zod schema the app uses (`pnpm eval:prepare` exports them), and checks shape, duplicates, quality, language, prompt injection and refusal of unclear briefs.
**Trade-off:** fewer built-in metrics, but my checks don't need the advanced ones.

### 2. LLM integration: LangChain with strict structured output

| Option                 | Pros                                                                            | Cons                                             |
| ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| **LangChain** (chosen) | `withStructuredOutput` with Zod, provider-neutral, raw response for token usage | Heavier dependency, more abstraction             |
| Vercel AI SDK          | Great Next.js and streaming integration                                         | Ties the AI layer closer to the Vercel ecosystem |
| OpenAI SDK             | Smallest, full control                                                          | Changing provider means rewriting the AI layer   |

**Why:** the provider sits behind one switch (`LLM_PROVIDER`), so another model is a config and adapter change. Strict structured output, a second Zod validation on the server and one retry with the validation errors give reliable JSON even from a small, cheap model (`gpt-5-nano`).
**Trade-off:** more dependency weight than the plain SDK, and no streaming yet.

### 3. Persistence: MongoDB, one document per plan

| Option               | Pros                                                                     | Cons                                                  |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| **MongoDB** (chosen) | A plan with its milestones, review state and token usage is one document | Weaker for relational queries and reporting           |
| PostgreSQL           | Strong consistency, joins, mature tooling                                | Nested review cards need JSON columns or extra tables |
| JSON file / memory   | Zero setup                                                               | Lost on serverless deploys and restarts; not shared   |

**Why:** a plan is always read and written as a whole, so one document per plan is the simplest fit, and every review action is a single write. Storage is behind a `MilestonePlanRepository` interface, so the tests use an in-memory version and Postgres could be added without touching services.
**Trade-off:** with users, teams and cross-plan reporting, a relational database would fit better.

## Prompts & failure handling

```
input → Zod check → prompt → LLM (strict JSON) → Zod check → retry once → save draft
```

**Prompts** are files in `prompts/*.txt`, versioned by `PROMPT_VERSION`; each plan stores the version and model used.

**Two validation layers**: strict structured output from the model, then the app's Zod schema on the server (lengths, milestone count, locked milestones unchanged). If it fails, the errors are sent back for one retry.

**Injection-safe**: user text is wrapped in escaped tags and treated as data, never instructions.

| Where   | Failure                     | Response                                   |
| ------- | --------------------------- | ------------------------------------------ |
| Input   | Invalid title / brief       | 400 with field errors (same rules in form) |
| AI      | Bad output after retry      | 502 `invalid_output`                       |
| AI      | Timeout / rate limit / down | 504 / 429 / 502                            |
| AI      | Gibberish or off-topic      | 422 `brief_unclear`, nothing saved         |
| Plan    | Not found / already saved   | 404 / 409                                  |
| Plan    | Save with none accepted     | 422 `nothing_accepted`                     |
| Browser | Network error               | Toast + inline alert                       |

Provider errors are logged on the server and never shown to the user.

## Stack, structure & API

Next.js 15 + React 19 (TypeScript), LangChain + OpenAI `gpt-5-nano`, Zod 4 (one schema for form, API and LLM output), MongoDB, Tailwind + shadcn/ui, next-intl (all text in `messages/en.json`), Vitest + fishery, promptfoo.

```
src/lib/
├─ ai/          LLM client, prompts, generate/refine + output checks
├─ milestones/  Zod schemas, review reducer
├─ services/    use cases (create, refine, review, save)
├─ repository/  storage interface + MongoDB
├─ client/ api/ browser client, API envelope + error mapping
prompts/  tests/  evals/
```

Routes stay thin (validate → service → envelope); business rules live in services and the pure review reducer. All responses use one envelope:

```ts
{ success: true, data } | { success: false, error: { code, message, issues? } }
```

| Method | Route                                                     | Purpose                                           |
| ------ | --------------------------------------------------------- | ------------------------------------------------- |
| GET    | `/api/milestone-plans`                                    | List plans                                        |
| POST   | `/api/milestone-plans`                                    | Generate and store a draft                        |
| GET    | `/api/milestone-plans/:id`                                | One plan                                          |
| DELETE | `/api/milestone-plans/:id`                                | Delete a plan                                     |
| POST   | `/api/milestone-plans/:id/review`                         | Accept, reject, edit, revert, restore, accept all |
| POST   | `/api/milestone-plans/:id/refine`                         | Refine all unlocked milestones                    |
| POST   | `/api/milestone-plans/:id/milestones/:milestoneId/refine` | Shorter / longer / custom for one milestone       |
| POST   | `/api/milestone-plans/:id/publish`                        | Save (finalize) the plan                          |

## Persistence, auth & testing

Each plan is one MongoDB document (`milestone_plans`) holding the brief, review cards, token usage, prompt version and model. Generating creates a draft, every review action updates it, and **Save plan** makes it read-only. Basic auth in `middleware.ts` turns on when `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set, and refuses all requests in production if they are missing. Vitest covers schemas, the review logic, services, API routes and components in `tests/`, using an in-memory repository and a fake LLM so tests are fast and free; `e2e/` has one Playwright smoke test. Real model behavior is checked by `pnpm eval` (promptfoo with `gpt-5-nano`, graded by `gpt-5-mini`): valid shape, no duplicate titles, quality rubric, German briefs, prompt injection, and refusal of gibberish or off-topic briefs.

## Setup

```bash
nvm use
pnpm install
cp .env.example .env.local   # set OPENAI_API_KEY and MONGODB_URI
pnpm dev                     # dev server
pnpm lint && pnpm typecheck  # ESLint + TypeScript
pnpm test                    # unit, component and API tests (Vitest)
pnpm test:e2e                # one Playwright smoke test
pnpm eval                    # prompt evals (promptfoo, calls OpenAI)
```

Basic auth is off locally unless `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` are set.
