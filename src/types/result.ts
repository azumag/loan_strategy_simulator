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
  isTakehome?: boolean
  socialInsuranceBreakdown?: {
    healthInsurance: number
    pension: number
    employmentInsurance: number
    standardMonthlyRemuneration?: number  // employee/micro_corp: 標準報酬月額
    annualSalaryBase?: number            // employee/micro_corp: 社保基準年収（雇用保険用）
    netBusinessIncomeForNHI?: number     // self-employed: NHI算定の事業所得
  }
  smallBusinessMutual: number
  bankruptcyMutual: number
  smallBusinessMutualAccumulated: number
  bankruptcyMutualAccumulated: number
  /** 共済受取額（解約・廃業時の一括or分割入金、税引後） */
  mutualAidPayoutNet: number
  loanRepaymentAnnual: number
  housingTaxAnnual: number
  housingCostBreakdown?: {
    fixedAssetTax: number
    cityPlanningTax: number
    homeInsurance: number
    maintenance: number
    other: number
  }
  livingCostAnnual: number
  livingCostBreakdown?: {
    base: number
    utility: number
    education: number
    car: number
    other: number
  }
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
  homeOfficeExpenseTotal: number  // 家事按分経費合計（光熱費按分+ローン利息按分）
  homeOfficeExpenseBreakdown?: { housing: number; interest: number; depreciation: number; utility: number }
  deductionBreakdown?: {
    taxableIncome: number
    incomeTaxBeforeCredit: number
    employment?: number
    bluePenalty?: number
    socialInsuranceDeduction: number
    basic: number
    spouse?: number
    dependent?: number
    lifeInsurance?: number
    earthquake?: number
    medical?: number
    smallBizMutual?: number
    housingLoanCredit?: number
    other?: number
  }
}

export interface BreakevenMetrics {
  payoffAgeWithoutPrepayment: number | null
  totalInterestWithoutPrepayment: number
  payoffAgeWithPrepayment: number | null
  totalInterestWithPrepayment: number
  interestSavings: number
  cumulativeInterestSavingsByAge: Array<{ age: number; savings: number }>
  cashVsLoanBalanceByAge: Array<{
    age: number
    cashWithPrepayment: number
    cashWithoutPrepayment: number
    loanBalanceWithPrepayment: number
    loanBalanceWithoutPrepayment: number
  }>
}

export interface SimulationResult {
  summary: Summary
  rows: AnnualRow[]
  breakeven?: BreakevenMetrics
}
