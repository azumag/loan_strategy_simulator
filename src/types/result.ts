import { WorkStyle } from './career'

export type RetirementFeasibility = 'safe' | 'warning' | 'danger'

export interface Summary {
  currentMonthlyPayment: number
  totalRepayment: number
  totalInterest: number
  balanceAt60: number
  balanceAt65: number
  payoffAge: number | null
  minimumCashBalance: number
  firstShortageAge: number | null
  retirementFeasibility: RetirementFeasibility
}

export interface AnnualRow {
  age: number
  workStyle: WorkStyle
  grossIncome: number
  businessExpenses: number
  deductions: number
  incomeTax: number
  residentTax: number
  socialInsurance: number
  pensionContribution: number
  smallBusinessMutual: number
  bankruptcyMutual: number
  /** 共済受取額（解約・廃業時の一括or分割入金、税引後） */
  mutualAidPayoutNet: number
  loanRepaymentAnnual: number
  housingTaxAnnual: number
  livingCostAnnual: number
  specialCashflow: number
  netCashflow: number
  endingCash: number
  endingAssets: number
  loanBalance: number
}

export interface SimulationResult {
  summary: Summary
  rows: AnnualRow[]
}
