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
  businessTax: number
  socialInsurance: number
  pensionContribution: number
  socialInsuranceBreakdown?: {
    healthInsurance: number
    pension: number
    employmentInsurance: number
  }
  smallBusinessMutual: number
  bankruptcyMutual: number
  smallBusinessMutualAccumulated: number
  bankruptcyMutualAccumulated: number
  /** 共済受取額（解約・廃業時の一括or分割入金、税引後） */
  mutualAidPayoutNet: number
  loanRepaymentAnnual: number
  housingTaxAnnual: number
  livingCostAnnual: number
  specialCashflow: number
  spouseNetIncome: number          // 配偶者手取り収入
  netCashflow: number
  investmentContribution: number  // 年間投資積立額（現金→投資口座への移動合計）
  retirementDrawdown: number      // 年間取り崩し額（NISA+課税口座→現金）
  dividendIncome: number          // 配当収入合計（税引後）
  endingCash: number
  endingNisaBalance: number
  endingLiquidAssets: number
  endingAssets: number
  loanBalance: number
}

export interface SimulationResult {
  summary: Summary
  rows: AnnualRow[]
}
