import { TaxConfig, SelfEmployedStage, EmployeeStage, RetiredStage } from '../types'

export interface TaxResult {
  grossIncome: number
  businessExpenses: number
  deductions: number
  incomeTax: number
  residentTax: number
  socialInsurance: number
  pensionContribution: number
  smallBusinessMutual: number
  totalTaxBurden: number
}

/**
 * 所得税速算表（2024年基準）
 */
function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  const brackets = [
    { limit: 1_950_000, rate: 0.05, deduction: 0 },
    { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
    { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
    { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
    { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
  ]
  const bracket = brackets.find((b) => taxableIncome <= b.limit)!
  return Math.max(0, taxableIncome * bracket.rate - bracket.deduction)
}

/**
 * 給与所得控除額計算
 */
function calcEmploymentIncomeDeduction(grossSalary: number): number {
  if (grossSalary <= 1_625_000) return 550_000
  if (grossSalary <= 1_800_000) return grossSalary * 0.4 - 100_000
  if (grossSalary <= 3_600_000) return grossSalary * 0.3 + 80_000
  if (grossSalary <= 6_600_000) return grossSalary * 0.2 + 440_000
  if (grossSalary <= 8_500_000) return grossSalary * 0.1 + 1_100_000
  return 1_950_000
}

/**
 * 個人事業主の税・社会保険概算計算
 */
export function calcSoleProprietorTax(stage: SelfEmployedStage, tax: TaxConfig): TaxResult {
  const grossIncome = stage.grossRevenueAnnual - stage.businessExpenseAnnual + stage.sideIncomeAnnual
  const businessExpenses = stage.businessExpenseAnnual

  // 国民健康保険: 事業所得の約10%を概算（所得割+均等割、上限考慮）
  const nationalHealthInsurance = Math.min(
    Math.max(0, (stage.grossRevenueAnnual - stage.businessExpenseAnnual) * 0.1),
    1_020_000, // 上限概算
  )
  // 国民年金
  const nationalPension = 199_320 // 2024年度

  const socialInsurance = nationalHealthInsurance + nationalPension

  // 課税所得計算
  const totalDeductions =
    tax.basicDeductionAnnual +
    stage.bluePenaltyDeduction +
    stage.smallBusinessMutualAnnual +
    socialInsurance +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.lifeInsuranceDeductionAnnual +
    tax.earthquakeInsuranceDeductionAnnual +
    tax.medicalDeductionAnnual +
    tax.otherDeductionAnnual

  const taxableIncome = Math.max(0, grossIncome - totalDeductions)
  const incomeTax = Math.max(0, calcIncomeTax(taxableIncome) - tax.housingLoanDeductionAnnual)
  const residentTax = Math.max(0, taxableIncome * 0.1 + 5_000) // 均等割概算含む

  // 個人事業税: 事業所得290万超の部分×5%概算
  const businessTaxBase = Math.max(0, stage.grossRevenueAnnual - stage.businessExpenseAnnual - 2_900_000)
  const businessTax = businessTaxBase * 0.05

  const totalTaxBurden =
    incomeTax + residentTax + socialInsurance + businessTax

  return {
    grossIncome,
    businessExpenses,
    deductions: totalDeductions,
    incomeTax,
    residentTax: residentTax + businessTax,
    socialInsurance: nationalHealthInsurance,
    pensionContribution: nationalPension,
    smallBusinessMutual: stage.smallBusinessMutualAnnual,
    totalTaxBurden,
  }
}

/**
 * 会社員の税・社会保険概算計算
 */
export function calcEmployeeTax(stage: EmployeeStage, tax: TaxConfig): TaxResult {
  let grossSalary: number
  let isTakehome = false

  if (stage.salaryInputMode === 'takehome') {
    grossSalary = (stage.takehomeSalaryAnnual ?? 0) + stage.bonusAnnual
    isTakehome = true
  } else {
    grossSalary = (stage.grossSalaryAnnual ?? 0) + stage.bonusAnnual + stage.sideIncomeAnnual
  }

  if (isTakehome) {
    // 手取り入力: 税・社保は0として扱う（手取りがそのまま可処分所得）
    return {
      grossIncome: grossSalary,
      businessExpenses: 0,
      deductions: 0,
      incomeTax: 0,
      residentTax: 0,
      socialInsurance: 0,
      pensionContribution: 0,
      smallBusinessMutual: 0,
      totalTaxBurden: 0,
    }
  }

  // 社会保険概算: 額面×15%（健康保険+厚生年金+雇用保険）
  const socialInsuranceRate = 0.15
  const socialInsurance = Math.min(grossSalary * socialInsuranceRate, 1_500_000)

  // 給与所得控除
  const employmentDeduction = calcEmploymentIncomeDeduction(grossSalary)

  const totalDeductions =
    employmentDeduction +
    socialInsurance +
    tax.basicDeductionAnnual +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.lifeInsuranceDeductionAnnual +
    tax.earthquakeInsuranceDeductionAnnual +
    tax.medicalDeductionAnnual +
    tax.otherDeductionAnnual

  const taxableIncome = Math.max(0, grossSalary - totalDeductions)
  const incomeTax = Math.max(0, calcIncomeTax(taxableIncome) - tax.housingLoanDeductionAnnual)
  const residentTax = Math.max(0, taxableIncome * 0.1 + 5_000)

  const totalTaxBurden = incomeTax + residentTax + socialInsurance

  return {
    grossIncome: grossSalary,
    businessExpenses: 0,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    socialInsurance,
    pensionContribution: 0,
    smallBusinessMutual: 0,
    totalTaxBurden,
  }
}

/**
 * 退職後の税・社会保険概算計算
 */
export function calcRetiredTax(stage: RetiredStage, tax: TaxConfig): TaxResult {
  const totalPension =
    stage.retirementNationalPensionAnnual +
    stage.retirementEmployeesPensionAnnual +
    stage.retirementOtherIncomeAnnual

  // 公的年金等控除（65歳以上概算）
  let pensionDeduction: number
  if (totalPension <= 3_300_000) {
    pensionDeduction = Math.max(1_100_000, totalPension * 0.25)
  } else if (totalPension <= 4_100_000) {
    pensionDeduction = 275_000 + totalPension * 0.15 + 550_000
  } else {
    pensionDeduction = 685_000 + totalPension * 0.05 + 550_000
  }

  const totalDeductions =
    pensionDeduction +
    tax.basicDeductionAnnual +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.otherDeductionAnnual

  const taxableIncome = Math.max(0, totalPension - totalDeductions)
  const incomeTax = Math.max(0, calcIncomeTax(taxableIncome) - tax.housingLoanDeductionAnnual)
  const residentTax = Math.max(0, taxableIncome * 0.1)

  // 後期高齢者医療保険: 年金収入の概算5%
  const healthInsurance = totalPension * 0.05

  const totalTaxBurden = incomeTax + residentTax + healthInsurance

  return {
    grossIncome: totalPension,
    businessExpenses: 0,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    socialInsurance: healthInsurance,
    pensionContribution: 0,
    smallBusinessMutual: 0,
    totalTaxBurden,
  }
}
