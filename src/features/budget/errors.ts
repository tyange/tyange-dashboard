export function getApiErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return null
  }

  const match = error.message.match(/^API\s+(\d+):/)
  if (!match) {
    return null
  }

  return Number(match[1])
}

export function isApiErrorStatus(error: unknown, status: number) {
  return getApiErrorStatus(error) === status
}

export function isBudgetNotConfiguredError(error: unknown) {
  return isApiErrorStatus(error, 404)
}

export function isUnauthorizedError(error: unknown) {
  return isApiErrorStatus(error, 401)
}
