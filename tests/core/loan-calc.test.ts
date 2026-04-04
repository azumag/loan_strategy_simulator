import { describe, it, expect } from 'vitest'
import {
  calcEqualPaymentMonthly,
  calcEqualPrincipalMonthly,
  resolveRate,
  calcLoanYear,
} from '../../src/core/loan-calc'
import { LoanConfig } from '../../src/types'

// 元利均等返済: 3000万円, 35年, 年利1.0% → 月返済額 ≈ 84,686円
const STANDARD_LOAN: LoanConfig = {
  principal: 30_000_000,
  startAge: 35,
  loanTermYears: 35,
  repaymentType: 'equal_payment',
  rateSchedule: [{ fromYear: 1, rate: 0.01 }],
  bonusMonthlyEquivalent: 0,
}

describe('resolveRate', () => {
  it('単一金利スケジュールはどの年も同じ金利を返す', () => {
    const schedule = [{ fromYear: 1, rate: 0.01 }]
    expect(resolveRate(schedule, 1)).toBe(0.01)
    expect(resolveRate(schedule, 10)).toBe(0.01)
    expect(resolveRate(schedule, 35)).toBe(0.01)
  })

  it('複数スケジュール: 当該年の適用金利を返す', () => {
    const schedule = [
      { fromYear: 1, rate: 0.005 },
      { fromYear: 6, rate: 0.01 },
      { fromYear: 11, rate: 0.015 },
    ]
    expect(resolveRate(schedule, 1)).toBe(0.005)
    expect(resolveRate(schedule, 5)).toBe(0.005)
    expect(resolveRate(schedule, 6)).toBe(0.01)
    expect(resolveRate(schedule, 10)).toBe(0.01)
    expect(resolveRate(schedule, 11)).toBe(0.015)
    expect(resolveRate(schedule, 35)).toBe(0.015)
  })
})

describe('calcEqualPaymentMonthly', () => {
  it('3000万 35年 年利1.0% → 月返済額は約84,686円', () => {
    const monthly = calcEqualPaymentMonthly(30_000_000, 0.01, 35 * 12)
    expect(monthly).toBeCloseTo(84_685, -1) // 百円単位で一致
  })

  it('3000万 35年 年利0% → 月返済額は元金÷月数', () => {
    const monthly = calcEqualPaymentMonthly(30_000_000, 0, 35 * 12)
    expect(monthly).toBeCloseTo(30_000_000 / (35 * 12), 0)
  })

  it('残額に基づく月返済額計算', () => {
    const monthly = calcEqualPaymentMonthly(20_000_000, 0.02, 20 * 12)
    expect(monthly).toBeGreaterThan(0)
  })
})

describe('calcEqualPrincipalMonthly', () => {
  it('元金均等: 初回月返済額 = 元金/回数 + 残債×月利', () => {
    const principal = 30_000_000
    const monthlyRate = 0.01 / 12
    const months = 35 * 12
    const firstPayment = calcEqualPrincipalMonthly(principal, 0.01, months, 0)
    const expected = principal / months + principal * monthlyRate
    expect(firstPayment).toBeCloseTo(expected, 0)
  })

  it('元金均等: 返済が進むと月返済額が減少する', () => {
    const months = 35 * 12
    const first = calcEqualPrincipalMonthly(30_000_000, 0.01, months, 0)
    const later = calcEqualPrincipalMonthly(30_000_000, 0.01, months, 100)
    expect(later).toBeLessThan(first)
  })
})

describe('calcLoanYear', () => {
  it('年次返済額・残債を計算できる', () => {
    const result = calcLoanYear(STANDARD_LOAN, 1, 30_000_000)
    expect(result.annualPayment).toBeGreaterThan(0)
    expect(result.endingBalance).toBeLessThan(30_000_000)
    expect(result.endingBalance).toBeGreaterThan(0)
  })

  it('元利均等35年ローンは35年後に残債が0になる', () => {
    let balance = 30_000_000
    for (let year = 1; year <= 35; year++) {
      const r = calcLoanYear(STANDARD_LOAN, year, balance)
      balance = r.endingBalance
    }
    expect(balance).toBeCloseTo(0, -2) // 百円単位で0
  })

  it('金利スケジュール切り替え時に残債計算が正しい', () => {
    const loan: LoanConfig = {
      ...STANDARD_LOAN,
      rateSchedule: [
        { fromYear: 1, rate: 0.005 },
        { fromYear: 11, rate: 0.015 },
      ],
    }
    // 10年目まで低金利
    let balance = 30_000_000
    for (let year = 1; year <= 10; year++) {
      balance = calcLoanYear(loan, year, balance).endingBalance
    }
    const balanceAfter10 = balance

    // 11年目から高金利に切り替わる
    const yearResult = calcLoanYear(loan, 11, balanceAfter10)
    // 年利1.5%に上がるので利息負担が増える
    expect(yearResult.interestPaid).toBeGreaterThan(0)
    expect(yearResult.endingBalance).toBeLessThan(balanceAfter10)
  })

  it('残債がすでに0の場合は返済額0', () => {
    const result = calcLoanYear(STANDARD_LOAN, 1, 0)
    expect(result.annualPayment).toBe(0)
    expect(result.endingBalance).toBe(0)
  })
})
