import { compareAsc, differenceInCalendarWeeks, isValid, parse } from 'date-fns'

export function weekKeyToDate(weekKey: string): Date | null {
  const parsed = parse(`${weekKey}-1`, "RRRR-'W'II-i", new Date())
  if (!isValid(parsed)) return null
  return parsed
}

export function compareWeekKey(a: string, b: string): number {
  const left = weekKeyToDate(a)
  const right = weekKeyToDate(b)
  if (!left || !right) return 0
  return compareAsc(left, right)
}

export function getWeekTabLabel(
  viewedWeekKey?: string | null,
  anchorWeekKey?: string | null,
): string {
  if (!viewedWeekKey || !anchorWeekKey) return '조회 중'
  const viewedDate = weekKeyToDate(viewedWeekKey)
  const anchorDate = weekKeyToDate(anchorWeekKey)
  if (!viewedDate || !anchorDate) return '조회 중'
  const diffWeeks = differenceInCalendarWeeks(viewedDate, anchorDate, { weekStartsOn: 1 })
  if (diffWeeks === 0) return '이번 주'
  if (diffWeeks > 0) return `+${diffWeeks}주`
  return `${diffWeeks}주`
}
