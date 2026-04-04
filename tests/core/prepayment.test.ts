import { describe, it, expect } from 'vitest'
import { applyPrepayments } from '../../src/core/prepayment'
import { PrepaymentStrategy } from '../../src/types'

const BASE_STRATEGY: PrepaymentStrategy = {
  prepayments: [],
  targetPayoffAge: 65,
  stopPrepaymentIfCashBelowBuffer: true,
}

describe('applyPrepayments', () => {
  it('繰上返済なしの場合は残債・現金に変化なし', () => {
    const result = applyPrepayments({
      age: 50,
      loanBalance: 20_000_000,
      cash: 5_000_000,
      liquidAssets: 2_000_000,
      minimumCashBuffer: 3_000_000,
      strategy: BASE_STRATEGY,
    })
    expect(result.newLoanBalance).toBe(20_000_000)
    expect(result.newCash).toBe(5_000_000)
    expect(result.prepaymentAmount).toBe(0)
  })

  it('one_time: 指定年齢に繰上返済を実行', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      prepayments: [{ age: 50, amount: 5_000_000, source: 'cash', mode: 'one_time' }],
    }
    const result = applyPrepayments({
      age: 50,
      loanBalance: 20_000_000,
      cash: 10_000_000,
      liquidAssets: 0,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(5_000_000)
    expect(result.newLoanBalance).toBe(15_000_000)
    expect(result.newCash).toBe(5_000_000)
  })

  it('one_time: 年齢が一致しない場合は実行しない', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      prepayments: [{ age: 50, amount: 5_000_000, source: 'cash', mode: 'one_time' }],
    }
    const result = applyPrepayments({
      age: 51,
      loanBalance: 20_000_000,
      cash: 10_000_000,
      liquidAssets: 0,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(0)
  })

  it('バッファ制約: 現金がバッファを下回る場合は繰上返済中止', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      stopPrepaymentIfCashBelowBuffer: true,
      prepayments: [{ age: 50, amount: 5_000_000, source: 'cash', mode: 'one_time' }],
    }
    // 現金4,000,000 - 5,000,000 = -1,000,000 < バッファ3,000,000
    const result = applyPrepayments({
      age: 50,
      loanBalance: 20_000_000,
      cash: 4_000_000,
      liquidAssets: 0,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(0)
    expect(result.newCash).toBe(4_000_000)
  })

  it('バッファ制約OFF: バッファ以下でも実行', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      stopPrepaymentIfCashBelowBuffer: false,
      prepayments: [{ age: 50, amount: 5_000_000, source: 'cash', mode: 'one_time' }],
    }
    const result = applyPrepayments({
      age: 50,
      loanBalance: 20_000_000,
      cash: 4_000_000,
      liquidAssets: 0,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(4_000_000) // 現金全額まで
  })

  it('原資がliquid_assetsの場合は流動資産から引き落とし', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      prepayments: [{ age: 50, amount: 3_000_000, source: 'liquid_assets', mode: 'one_time' }],
    }
    const result = applyPrepayments({
      age: 50,
      loanBalance: 10_000_000,
      cash: 5_000_000,
      liquidAssets: 5_000_000,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(3_000_000)
    expect(result.newCash).toBe(5_000_000) // 現金は変わらない
    expect(result.newLiquidAssets).toBe(2_000_000)
  })

  it('繰上返済額が残債を超える場合は残債を上限とする', () => {
    const strategy: PrepaymentStrategy = {
      ...BASE_STRATEGY,
      prepayments: [{ age: 50, amount: 20_000_000, source: 'cash', mode: 'one_time' }],
    }
    const result = applyPrepayments({
      age: 50,
      loanBalance: 5_000_000,
      cash: 30_000_000,
      liquidAssets: 0,
      minimumCashBuffer: 3_000_000,
      strategy,
    })
    expect(result.prepaymentAmount).toBe(5_000_000) // 残債上限
    expect(result.newLoanBalance).toBe(0)
  })
})
