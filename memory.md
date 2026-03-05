# Tyange Dashboard Memory

Last updated: 2026-03-06 (Asia/Seoul)

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
- Week key parsing/comparison: `src/features/budget/weekKey.ts`

## Behavior Conventions In Use
- Keep API fetch logic in `src/features/budget/api.ts`
- Cache loaded weekly summaries in-memory by `week_key`
- Week navigation supports both button click and horizontal swipe
- API errors are surfaced in UI as a top error alert block

## Data Contracts (Budget)
- `WeeklySummary`: `week_key`, `weekly_limit`, `total_spent`, `remaining`, `usage_rate`, `alert`, `record_count`
- `BudgetWeeksResponse`: `weeks` plus optional `min_week`, `max_week`

## Practical Working Rules
- Prefer minimal, targeted edits over broad refactors
- Preserve Korean UI labels/messages unless explicitly requested to change
- Keep week-key handling centralized in `weekKey.ts` to avoid duplicated date logic
- When adding API calls, keep consistent error pattern: `API ${status}: ${bodyText || fallbackMessage}`

## Update Checklist (When Task Ends)
- If conventions changed, update this file
- If scripts/paths changed, update "Core Commands" and "Feature Structure"
- If new env vars were introduced, document them under "Environment Notes"

