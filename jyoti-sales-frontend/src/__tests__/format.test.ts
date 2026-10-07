import { describe, it, expect } from 'vitest'
import { formatINR, estimateEmi } from '../lib/format'

describe('formatINR', () => {
  it('formats a number as Indian Rupee currency', () => {
    expect(formatINR(46990)).toContain('46,990')
  })
})

describe('estimateEmi', () => {
  it('returns a positive monthly estimate less than the total for a 9-month term', () => {
    const emi = estimateEmi(27000, 9)
    expect(emi).toBeGreaterThan(0)
    expect(emi * 9).toBeGreaterThan(27000) // includes illustrative interest
  })
})
