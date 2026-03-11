import { describe, expect, it } from 'vitest'
import { toApiDateTime, toDateTimeInputValue } from './utils'

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
