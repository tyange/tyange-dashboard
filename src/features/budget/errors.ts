export function isBudgetNotConfiguredError(error: unknown) {
  return error instanceof Error && error.message.startsWith('API 404:')
}
