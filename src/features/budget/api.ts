import type {
  ApiStatusResponse,
  BudgetRebalanceResponse,
  BudgetWeeksResponse,
  SpendingListResponse,
  WeeklyConfig,
  WeeklySpendRecord,
  WeeklySummary,
} from './types'
import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'

const apiBaseUrl = getApiBaseUrl()

export async function fetchWeeklySummary(): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

export async function fetchWeeklySummaryByWeekKey(weekKey: string): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly/${weekKey}`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

export async function fetchBudgetWeeks(): Promise<BudgetWeeksResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/weeks`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주차 목록 조회 실패'}`)
  }

  return response.json()
}

export async function fetchWeeklySpendRecords(weekKey: string): Promise<WeeklySpendRecord[]> {
  const response = await fetch(`${apiBaseUrl}/budget/spending?week=${encodeURIComponent(weekKey)}`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 소비 기록 조회 실패'}`)
  }

  const payload = (await response.json()) as SpendingListResponse
  return payload.records ?? []
}

export async function fetchWeeklyConfig(): Promise<WeeklyConfig> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly-config`, {
    headers: createAuthorizedHeaders(getRequiredAccessToken()),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 설정 조회 실패'}`)
  }

  return response.json()
}

export async function saveWeeklyBudgetConfig(weeklyLimit: number, alertThreshold: number): Promise<ApiStatusResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/set`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      weekly_limit: weeklyLimit,
      alert_threshold: alertThreshold,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 저장 실패'}`)
  }

  return response.json()
}

export async function rebalanceBudget(
  totalBudget: number,
  fromDate: string,
  toDate: string,
  asOfDate: string,
  alertThreshold: number,
  spentSoFar?: number,
): Promise<ApiStatusResponse<BudgetRebalanceResponse>> {
  const response = await fetch(`${apiBaseUrl}/budget/rebalance`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      total_budget: totalBudget,
      spent_so_far: spentSoFar,
      from_date: fromDate,
      to_date: toDate,
      as_of_date: asOfDate,
      alert_threshold: alertThreshold,
    }),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 재설정 실패'}`)
  }

  return response.json()
}
