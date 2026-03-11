import type {
  ApiStatusResponse,
  BudgetPlanPayload,
  BudgetSummary,
  BudgetUpsertPayload,
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
  payload: BudgetPlanPayload,
): Promise<ApiStatusResponse<BudgetSummary>> {
  const response = await fetch(`${apiBaseUrl}/budget/plan`, {
    method: 'POST',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 생성 실패'}`)
  }

  return response.json()
}

export async function updateBudget(
  payload: BudgetUpsertPayload,
): Promise<ApiStatusResponse<BudgetSummary>> {
  const response = await fetch(`${apiBaseUrl}/budget`, {
    method: 'PUT',
    headers: createAuthorizedHeaders(getRequiredAccessToken(), {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '예산 수정 실패'}`)
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
