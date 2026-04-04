export type RepaymentType = 'equal_payment' | 'equal_principal'

export interface RateScheduleEntry {
  fromYear: number
  rate: number
}

export interface LoanConfig {
  principal: number
  startAge: number
  loanTermYears: number
  repaymentType: RepaymentType
  rateSchedule: RateScheduleEntry[]
  bonusMonthlyEquivalent: number
}
