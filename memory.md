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
- Main page/state orchestration: `src/App.tsx`
- Budget domain: `src/features/budget/*`
- Main API layer: `src/features/budget/api.ts`
- Spend records page UI: `src/features/budget/components/SpendRecordsPage.tsx`
- Week key parsing/comparison: `src/features/budget/weekKey.ts`

## Behavior Conventions In Use
- Keep API fetch logic in `src/features/budget/api.ts`
- Cache loaded weekly summaries in-memory by `week_key`
- Cache loaded weekly spend records in-memory by `week_key`
- Week navigation is controlled via toolbar buttons (prev/next and current week refresh)
- Top floating navigation bar uses centered pill style (blur + translucent background + scroll shadow); current nav has one active item (`주간 예산`)
- API errors are surfaced in UI as a top error alert block
- `기록 수` 카드의 `더 보기` 버튼 클릭 시 소비 기록 전용 페이지로 이동
- 소비 기록 페이지는 `GET /budget/spending?week={week_key}`로 조회

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
