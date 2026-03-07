# Tyange Dashboard Memory

Last updated: 2026-03-07 (Asia/Seoul)

## Project Snapshot
- Frontend: SolidJS + TypeScript + Vite
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`)
- Package/runtime: Bun (`bun.lock` present)
- Deploy target: AWS Lightsail/EC2 static files + Nginx (see `README.md`)

## Core Commands
- Install: `bun install`
- Dev server: `bun run dev` (default local URL: `http://localhost:3001`)
- Build: `bun run build`
- Preview build: `bun run preview`

## Environment Notes
- Required runtime env var: `VITE_CMS_API_BASE_URL`
- Local fallback in code: `http://localhost:8080` (`src/features/budget/api.ts`)
- CI expectation: build should fail fast when `VITE_CMS_API_BASE_URL` is missing (README policy)

## Current Feature Structure
- Entry: `src/index.tsx`
- Main router entry: `src/App.tsx`
- Auth state/context: `src/auth/AuthProvider.tsx`
- Public pages: `src/pages/*`
- Authenticated layout: `src/components/AuthenticatedLayout.tsx`
- Budget domain: `src/features/budget/*`
- Main API layer: `src/features/budget/api.ts`
- Budget dashboard route UI: `src/features/budget/components/BudgetDashboardPage.tsx`
- Spend records route UI: `src/features/budget/components/SpendRecordsRoutePage.tsx`
- Week key parsing/comparison: `src/features/budget/weekKey.ts`

## Behavior Conventions In Use
- Keep API fetch logic in `src/features/budget/api.ts`
- Cache loaded weekly summaries in-memory by `week_key`
- Week navigation is controlled via toolbar buttons (prev/next and current week refresh)
- Public landing page lives at `/` and only introduces the app plus login guidance
- Login page lives at `/login`; this phase uses an in-memory placeholder auth flow without backend integration
- Protected pages live at `/dashboard` and `/records`; unauthenticated access redirects to `/login?next=...`
- Auth state uses `unknown | guest | authenticated` and does not persist across refreshes in this phase
- Top floating authenticated navigation bar uses centered pill style (blur + translucent background + scroll shadow) and only exposes the budget dashboard entry
- API errors are surfaced in UI as a top error alert block
- `기록 수` 카드의 `더 보기` 버튼 is the primary UI entry into `/records?week={week_key}`
- 소비 기록 페이지는 `week` query param을 공식 입력으로 받고 `GET /budget/spending?week={week_key}`로 조회

## Data Contracts (Budget)
- `WeeklySummary`: `week_key`, `weekly_limit`, `total_spent`, `remaining`, `usage_rate`, `alert`, `record_count`
- `BudgetWeeksResponse`: `weeks` plus optional `min_week`, `max_week`
- `WeeklySpendRecord`: `record_id`, `amount`, `merchant`, `transacted_at`, `created_at`

## Practical Working Rules
- Prefer minimal, targeted edits over broad refactors
- Preserve Korean UI labels/messages unless explicitly requested to change
- Keep week-key handling centralized in `weekKey.ts` to avoid duplicated date logic
- When adding API calls, keep consistent error pattern: `API ${status}: ${bodyText || fallbackMessage}`

## Update Checklist (When Task Ends)
- If conventions changed, update this file
- If scripts/paths changed, update "Core Commands" and "Feature Structure"
- If new env vars were introduced, document them under "Environment Notes"
