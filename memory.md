# Tyange Dashboard Memory

Last updated: 2026-03-09 (Asia/Seoul)

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
- Budget setup route UI: `src/features/budget/components/BudgetSetupPage.tsx`
- Week key parsing/comparison: `src/features/budget/weekKey.ts`

## Behavior Conventions In Use
- Keep API fetch logic in `src/features/budget/api.ts`
- Cache loaded weekly summaries in-memory by `week_key`
- Week navigation is controlled via toolbar buttons (prev/next and current week refresh)
- Public landing page lives at `/` and only introduces the app plus login guidance
- Login page lives at `/login` and calls the CMS API `/login` endpoint with `user_id` + `password`
- Signup page lives at `/signup` and calls the CMS API `/signup` endpoint with `email` + `password`, then auto-logs in via `/login`
- Protected pages live at `/dashboard` and `/records`; unauthenticated access redirects to `/login?next=...`
- Auth state uses `unknown | guest | authenticated` and restores persisted JWT session from `localStorage`
- Top floating authenticated navigation bar uses centered pill style (blur + translucent background + scroll shadow) and only exposes the budget dashboard entry
- API errors are surfaced in UI as a top error alert block
- `기록 수` 카드의 `더 보기` 버튼 is the primary UI entry into `/records?week={week_key}`
- 소비 기록 페이지는 `week` query param을 공식 입력으로 받고 `GET /budget/spending?week={week_key}`로 조회
- Budget API requests require the raw access token in the `Authorization` header because `tyange-cms-api` `260308` protects all budget read/write routes with JWT auth
- Budget dashboard and records routes treat `API 404` from budget endpoints as "예산 미등록" state and show a dedicated setup-required page instead of a generic error alert
- Budget setup uses `GET /budget/weekly-config` to load the current week's config row and `POST /budget/set` to save current-week `weekly_limit` and `alert_threshold`

## Data Contracts (Budget)
- `WeeklySummary`: `week_key`, `weekly_limit`, `total_spent`, `remaining`, `usage_rate`, `alert`, `record_count`
- `BudgetWeeksResponse`: `weeks` plus optional `min_week`, `max_week`
- `WeeklySpendRecord`: `record_id`, `amount`, `merchant`, `transacted_at`, `created_at`

## Practical Working Rules
- Prefer minimal, targeted edits over broad refactors
- Preserve Korean UI labels/messages unless explicitly requested to change
- Keep week-key handling centralized in `weekKey.ts` to avoid duplicated date logic
- When adding API calls, keep consistent error pattern: `API ${status}: ${bodyText || fallbackMessage}`

## Outstanding TODOs
- Revisit refresh-token handling when access token expiry UX becomes relevant
- Revisit `/records` direct-access behavior once expired-session recovery UX is defined

## Update Checklist (When Task Ends)
- If conventions changed, update this file
- If scripts/paths changed, update "Core Commands" and "Feature Structure"
- If new env vars were introduced, document them under "Environment Notes"
