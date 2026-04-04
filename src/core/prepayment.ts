import { PrepaymentStrategy } from '../types'

export interface PrepaymentInput {
  age: number
  loanBalance: number
  cash: number
  liquidAssets: number
  minimumCashBuffer: number
  strategy: PrepaymentStrategy
}

export interface PrepaymentResult {
  prepaymentAmount: number
  newLoanBalance: number
  newCash: number
  newLiquidAssets: number
}

export function applyPrepayments(input: PrepaymentInput): PrepaymentResult {
  const { age, loanBalance, cash, liquidAssets, minimumCashBuffer, strategy } = input

  let newLoanBalance = loanBalance
  let newCash = cash
  let newLiquidAssets = liquidAssets
  let totalPrepayment = 0

  for (const entry of strategy.prepayments) {
    if (entry.mode === 'one_time' && entry.age !== age) continue

    const targetAmount = Math.min(entry.amount, newLoanBalance)
    if (targetAmount <= 0) continue

    if (entry.source === 'cash') {
      let available: number
      if (strategy.stopPrepaymentIfCashBelowBuffer) {
        // バッファ制約あり: 支払い後にバッファを下回るなら中止（部分払いなし）
        if (newCash - targetAmount < minimumCashBuffer) continue
        available = targetAmount
      } else {
        available = newCash
      }
      const actual = Math.min(targetAmount, available)
      if (actual <= 0) continue

      newCash -= actual
      newLoanBalance -= actual
      totalPrepayment += actual
    } else if (entry.source === 'liquid_assets') {
      const available = newLiquidAssets
      const actual = Math.min(targetAmount, available)
      if (actual <= 0) continue

      newLiquidAssets -= actual
      newLoanBalance -= actual
      totalPrepayment += actual
    }
  }

  return {
    prepaymentAmount: totalPrepayment,
    newLoanBalance: Math.max(0, newLoanBalance),
    newCash,
    newLiquidAssets,
  }
}
