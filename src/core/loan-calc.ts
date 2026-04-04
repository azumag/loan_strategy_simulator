import { LoanConfig, RateScheduleEntry } from '../types'

export function resolveRate(schedule: RateScheduleEntry[], year: number): number {
  const sorted = [...schedule].sort((a, b) => b.fromYear - a.fromYear)
  const entry = sorted.find((e) => e.fromYear <= year)
  return entry ? entry.rate : schedule[0].rate
}

/**
 * 元利均等返済の月次返済額
 * @param balance 現在の残債
 * @param annualRate 年利(例: 0.01 = 1%)
 * @param remainingMonths 残り返済月数
 */
export function calcEqualPaymentMonthly(
  balance: number,
  annualRate: number,
  remainingMonths: number,
): number {
  if (balance <= 0) return 0
  if (annualRate === 0) return balance / remainingMonths
  const r = annualRate / 12
  return (balance * r * Math.pow(1 + r, remainingMonths)) / (Math.pow(1 + r, remainingMonths) - 1)
}

/**
 * 元金均等返済の月次返済額
 * @param originalPrincipal 借入元金
 * @param annualRate 年利
 * @param totalMonths 総返済月数
 * @param paidMonths 返済済み月数
 */
export function calcEqualPrincipalMonthly(
  originalPrincipal: number,
  annualRate: number,
  totalMonths: number,
  paidMonths: number,
): number {
  const principalPerMonth = originalPrincipal / totalMonths
  const remainingBalance = originalPrincipal - principalPerMonth * paidMonths
  const monthlyInterest = remainingBalance * (annualRate / 12)
  return principalPerMonth + monthlyInterest
}

export interface LoanYearResult {
  annualPayment: number
  principalPaid: number
  interestPaid: number
  endingBalance: number
}

/**
 * 指定年のローン年間返済額・残債を計算
 * @param loan ローン設定
 * @param year ローン開始からの経過年数(1始まり)
 * @param startingBalance 年初残債
 */
export function calcLoanYear(
  loan: LoanConfig,
  year: number,
  startingBalance: number,
): LoanYearResult {
  if (startingBalance <= 0) {
    return { annualPayment: 0, principalPaid: 0, interestPaid: 0, endingBalance: 0 }
  }

  const annualRate = resolveRate(loan.rateSchedule, year)
  const totalMonths = loan.loanTermYears * 12
  const paidMonths = (year - 1) * 12

  let balance = startingBalance
  let totalPayment = 0
  let totalInterest = 0
  let totalPrincipal = 0

  for (let m = 0; m < 12; m++) {
    if (balance <= 0) break

    const remainingMonths = totalMonths - paidMonths - m

    let payment: number
    if (loan.repaymentType === 'equal_payment') {
      payment = calcEqualPaymentMonthly(balance, annualRate, remainingMonths)
    } else {
      payment = calcEqualPrincipalMonthly(loan.principal, annualRate, totalMonths, paidMonths + m)
    }

    const interest = balance * (annualRate / 12)
    const principal = Math.min(payment - interest, balance)
    payment = principal + interest

    totalPayment += payment
    totalInterest += interest
    totalPrincipal += principal
    balance = Math.max(0, balance - principal)
  }

  return {
    annualPayment: totalPayment,
    principalPaid: totalPrincipal,
    interestPaid: totalInterest,
    endingBalance: balance,
  }
}
