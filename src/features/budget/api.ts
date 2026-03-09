import type { BudgetWeeksResponse, SpendingListResponse, WeeklySpendRecord, WeeklySummary } from './types'
import { createAuthorizedHeaders, getApiBaseUrl, loadStoredSession } from '../../auth/api'

const apiBaseUrl = getApiBaseUrl()

function getRequiredAccessToken() {
  const session = loadStoredSession()

  if (!session?.access_token) {
    throw new Error('로그인이 필요합니다.')
  }

  return session.access_token
}

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
