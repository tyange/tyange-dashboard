import { describe, expect, it } from 'vitest'
import { pickRecommendedWeeklyLimit, toApiDateTime, toDateTimeInputValue } from './utils'

describe('toDateTimeInputValue', () => {
  it('normalizes API datetime values for datetime-local inputs', () => {
    expect(toDateTimeInputValue('2026-03-03T12:20:00')).toBe('2026-03-03T12:20')
    expect(toDateTimeInputValue('2026-03-03 12:20:00')).toBe('2026-03-03T12:20')
  })
})

describe('toApiDateTime', () => {
  it('adds seconds when the input came from datetime-local', () => {
    expect(toApiDateTime('2026-03-03T12:20')).toBe('2026-03-03T12:20:00')
  })
})

describe('pickRecommendedWeeklyLimit', () => {
  const result = {
    total_budget: 2400000,
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    as_of_date: '2026-03-11',
    spent_net: 1200000,
    remaining_budget: 1200000,
    remaining_days: 20,
    is_overspent: false,
    buckets: [
      {
        bucket_index: 1,
        from_date: '2026-03-01',
        to_date: '2026-03-07',
        days: 7,
        amount: 350000,
      },
      {
        bucket_index: 2,
        from_date: '2026-03-08',
        to_date: '2026-03-14',
        days: 7,
        amount: 420000,
      },
    ],
  }

  it('prefers the bucket containing today', () => {
    expect(pickRecommendedWeeklyLimit(result, '2026-03-11')).toBe(420000)
  })

  it('falls back to the first bucket when today is outside every bucket', () => {
    expect(pickRecommendedWeeklyLimit(result, '2026-04-01')).toBe(350000)
  })
})
