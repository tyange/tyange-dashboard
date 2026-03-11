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
- Test: `bun run test`

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
- Top floating authenticated navigation bar uses centered pill style (blur + translucent background + scroll shadow) and exposes budget, spending records, budget setup, and API key management entries
- API errors are surfaced in UI as a top error alert block
- API key management uses `GET /api-keys`, `POST /api-keys`, and `DELETE /api-keys/:id` with JWT auth; plaintext keys are shown only immediately after creation and never reloaded from the list API
- 대시보드는 `GET /budget` 단일 응답으로 활성 기간 총예산을 표시하고, 404는 "활성 예산 없음" 상태로 처리한다
- 예산 설정 페이지는 `GET /budget`으로 활성 기간 예산을 확인하고, `POST /budget/plan` 또는 `PUT /budget`으로 명시적으로 저장한다
- 예산 설정 페이지는 엑셀 기반 예산 계산/업로드 UI를 노출하지 않고, 활성 기간 예산 생성·수정만 담당한다
- 소비 기록 페이지는 `GET /budget/spending` 응답의 `weeks[]` 그룹을 그대로 렌더링하고 `POST /budget/spending`, `PUT /budget/spending/:record_id`, `DELETE /budget/spending/:record_id` 후 `GET /budget` + `GET /budget/spending` 재조회로 요약과 목록을 동기화한다
- 소비 기록 페이지 초기 진입은 `GET /budget`을 먼저 확인하고, 그 응답이 성공한 뒤 `GET /budget/spending` 404가 오면 "기록 없음"으로 간주해 빈 목록 상태를 렌더링한다
- 소비 기록 페이지는 `POST /budget/spending/import-preview` -> 사용자 선택 -> `POST /budget/spending/import-commit` 흐름으로 신한카드 XLS 가져오기를 지원하며, 기본 선택은 `status=new` 행만 허용한다
- `tyange-cms-api` `6663a47` 이후 예산 총지출은 거래 원장에서 자동 계산되며, 예산 생성/수정 요청에 `total_spent`를 보내면 400으로 거절된다
- XLS import 반영 결과는 `period_total_spent_from_records`와 `remaining`을 반환하며, 대시보드/소비 기록 화면은 모두 동일한 원장 기준 합계를 사용한다
- Budget API requests require the raw access token in the `Authorization` header because `tyange-cms-api` `260308` protects all budget read/write routes with JWT auth
- 대시보드와 소비 기록 화면의 `weeks[]`는 표시용 그룹이며, 예산 계산 기준은 항상 활성 기간 전체 총액이다
- 예산/소비 관련 404는 기본적으로 "활성 기간 예산 없음" 또는 "기록 없음" 메시지로 처리하고 예산 설정 유도 화면을 노출한다
- 엑셀 계산 플로우는 업로드/계산, 버킷 검토, 활성 기간 예산 저장의 3단계를 명확히 분리한다
- 401은 세션 만료 메시지, 404는 활성 예산/기록 없음 메시지, 400 엑셀 계산 오류는 파일/입력값 오류 메시지로 매핑한다

## Data Contracts (Budget)
- `BudgetSummary`: `budget_id`, `total_budget`, `from_date`, `to_date`, `total_spent`, `remaining_budget`, `usage_rate`, `alert`, `alert_threshold`, optional `is_overspent`
- `SpendRecord`: `record_id`, `amount`, `merchant`, `transacted_at`, `created_at`
- `SpendingListResponse`: `budget_id`, `from_date`, `to_date`, `total_spent`, `remaining`, `weeks[]`
- `SpendingWeekGroup`: `week_key`, `weekly_total`, `record_count`, `records[]`

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
