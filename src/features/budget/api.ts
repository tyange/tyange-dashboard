import type {
  ApiStatusResponse,
  BudgetPlanResponse,
  BudgetRebalanceResponse,
  BudgetSummary,
  CreateSpendingResponse,
  SpendRecord,
  SpendingListResponse,
} from './types'
import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'

const apiBaseUrl = getApiBaseUrl()

export async function fetchBudgetSummary(): Promise<BudgetSummary> {
  const response = await fetch(`${apiBaseUrl}/budget`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 요약 조회 실패'}`)
  }

  return response.json()
}

export async function createBudgetPlan(
  totalBudget: number,
  fromDate: string,
  toDate: string,
  alertThreshold?: number,
): Promise<ApiStatusResponse<BudgetPlanResponse>> {
  const response = await fetch(`${apiBaseUrl}/budget/plan`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      total_budget: totalBudget,
      from_date: fromDate,
      to_date: toDate,
      alert_threshold: alertThreshold,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 생성 실패'}`)
  }

  return response.json()
}

export async function rebalanceBudget(
  totalBudget: number,
  fromDate: string,
  toDate: string,
  asOfDate: string,
  alertThreshold?: number,
  spentSoFar?: number,
): Promise<ApiStatusResponse<BudgetRebalanceResponse>> {
  const response = await fetch(`${apiBaseUrl}/budget/rebalance`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      total_budget: totalBudget,
      from_date: fromDate,
      to_date: toDate,
      as_of_date: asOfDate,
      spent_so_far: spentSoFar,
      alert_threshold: alertThreshold,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 재계산 실패'}`)
  }

  return response.json()
}

export async function fetchSpendingGroups(): Promise<SpendingListResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/spending`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '소비 기록 조회 실패'}`)
  }

  return response.json()
}

export async function createSpendRecord(amount: number, merchant: string | null, transactedAt: string): Promise<CreateSpendingResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/spending`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      amount,
      merchant,
      transacted_at: transactedAt,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '소비 기록 저장 실패'}`)
  }

  return response.json()
}

export async function updateSpendRecord(
  recordId: number,
  amount: number,
  merchant: string | null,
  transactedAt: string,
): Promise<SpendRecord> {
  const response = await fetch(`${apiBaseUrl}/budget/spending/${recordId}`, {
    method: 'PUT',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      amount,
      merchant,
      transacted_at: transactedAt,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '소비 기록 수정 실패'}`)
  }

  return response.json()
}

export async function deleteSpendRecord(recordId: number): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/budget/spending/${recordId}`, {
    method: 'DELETE',
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '소비 기록 삭제 실패'}`)
  }
}
