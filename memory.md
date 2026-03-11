# Tyange Dashboard Memory

Last updated: 2026-03-11 (Asia/Seoul)

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
- API key management UI: `src/features/api-keys/*`
- Budget domain: `src/features/budget/*`
- Main API layer: `src/features/budget/api.ts`
- Budget dashboard route UI: `src/features/budget/components/BudgetDashboardPage.tsx`
- Spend records route UI: `src/features/budget/components/SpendRecordsRoutePage.tsx`
- Budget setup route UI: `src/features/budget/components/BudgetSetupPage.tsx`

## Behavior Conventions In Use
- Keep API fetch logic in `src/features/budget/api.ts`
- Public landing page lives at `/` and only introduces the app plus login guidance
- Login page lives at `/login` and calls the CMS API `/login` endpoint with `user_id` + `password`
- Signup page lives at `/signup` and calls the CMS API `/signup` endpoint with `email` + `password`, then auto-logs in via `/login`
- Protected pages live at `/dashboard` and `/records`; unauthenticated access redirects to `/login?next=...`
- Protected API key management page lives at `/api-keys` and manages only the currently logged-in user's keys
- Auth state uses `unknown | guest | authenticated` and restores persisted JWT session from `localStorage`
- Top floating authenticated navigation bar uses centered pill style (blur + translucent background + scroll shadow) and exposes budget, budget setup, and API key management entries
- API errors are surfaced in UI as a top error alert block
- API key management uses `GET /api-keys`, `POST /api-keys`, and `DELETE /api-keys/:id` with JWT auth; plaintext keys are shown only immediately after creation and never reloaded from the list API
- 대시보드는 `GET /budget` 단일 응답으로 활성 기간 총예산을 표시하고, 404는 "활성 예산 없음" 상태로 처리한다
- 소비 기록 페이지는 `GET /budget/spending` 응답의 `weeks[]` 그룹을 그대로 렌더링하고 `POST /budget/spending`, `PUT /budget/spending/:record_id`, `DELETE /budget/spending/:record_id` 후 `GET /budget` + `GET /budget/spending` 재조회로 요약과 목록을 동기화한다
- Budget API requests require the raw access token in the `Authorization` header because `tyange-cms-api` `260308` protects all budget read/write routes with JWT auth
- Budget dashboard and records routes treat `API 404` from budget endpoints as "활성 예산 없음" state and show a dedicated setup-required page instead of a generic error alert
- Budget setup uses `GET /budget` to load the active period summary, `POST /budget/plan` to create a new period budget, and `PUT /budget` to update the active period total budget, optional `total_spent` snapshot, and alert threshold
- 대시보드와 소비 기록 화면의 `weeks[]`는 표시용 그룹이며, 예산 계산 기준은 항상 활성 기간 전체 총액이다
- `as_of_date`, rebalance, 남은 주차 재분배 개념은 대시보드 UI에서 제거되었다
- overspent 표시는 `is_overspent`가 있으면 우선 사용하고, 없으면 `remaining_budget < 0`로 보조 판정한다

## Data Contracts (Budget)
- `BudgetSummary`: `budget_id`, `total_budget`, `from_date`, `to_date`, `total_spent`, `remaining_budget`, `usage_rate`, `alert`, `alert_threshold`, optional `is_overspent`
- `SpendingListResponse`: `budget_id`, `from_date`, `to_date`, `total_spent`, `remaining_budget`, `weeks[]`
- `SpendingWeekGroup`: `week_key`, `weekly_total`, `record_count`, `records[]`
- `SpendRecord`: `record_id`, `amount`, `merchant`, `transacted_at`, `created_at`
- `POST /budget/plan`, `PUT /budget`, `GET /budget` all use the same budget summary fields: `budget_id`, `total_budget`, `from_date`, `to_date`, `total_spent`, `remaining_budget`, `usage_rate`, `alert`, `alert_threshold`, optional `is_overspent`

## Practical Working Rules
- Prefer minimal, targeted edits over broad refactors
- Preserve Korean UI labels/messages unless explicitly requested to change
- When adding API calls, keep consistent error pattern: `API ${status}: ${bodyText || fallbackMessage}`

## Outstanding TODOs
- Revisit refresh-token handling when access token expiry UX becomes relevant
- Revisit `/records` direct-access behavior once expired-session recovery UX is defined

## Update Checklist (When Task Ends)
- If conventions changed, update this file
- If scripts/paths changed, update "Core Commands" and "Feature Structure"
- If new env vars were introduced, document them under "Environment Notes"
