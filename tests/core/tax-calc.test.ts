import { describe, it, expect } from 'vitest'
import { calcSoleProprietorTax, calcEmployeeTax, calcRetiredTax } from '../../src/core/tax-calc'
import { TaxConfig, SelfEmployedStage, EmployeeStage, RetiredStage } from '../../src/types'

const BASE_TAX_CONFIG: TaxConfig = {
  mode: 'simple_auto',
  basicDeductionAnnual: 480_000,
  spouseDeductionAnnual: 0,
  dependentDeductionAnnual: 0,
  lifeInsuranceDeductionAnnual: 0,
  earthquakeInsuranceDeductionAnnual: 0,
  medicalDeductionAnnual: 0,
  otherDeductionAnnual: 0,
  housingLoanDeductionAnnual: 0,
  residentTaxLagEnabled: false,
}

const SELF_EMPLOYED_STAGE: SelfEmployedStage = {
  fromAge: 40,
  toAge: 49,
  workStyle: 'self_employed',
  grossRevenueAnnual: 10_000_000,
  businessExpenseAnnual: 2_000_000,
  bluePenaltyDeduction: 650_000,
  smallBusinessMutualAnnual: 840_000,
  sideIncomeAnnual: 0,
}

const EMPLOYEE_STAGE: EmployeeStage = {
  fromAge: 50,
  toAge: 60,
  workStyle: 'employee',
  salaryInputMode: 'gross',
  grossSalaryAnnual: 10_000_000,
  bonusAnnual: 0,
  sideIncomeAnnual: 0,
}

const RETIRED_STAGE: RetiredStage = {
  fromAge: 65,
  toAge: 90,
  workStyle: 'retired',
  retirementNationalPensionAnnual: 900_000,
  retirementEmployeesPensionAnnual: 1_200_000,
  retirementOtherIncomeAnnual: 0,
}

describe('calcSoleProprietorTax', () => {
  it('個人事業主の税・社保は収入の範囲内', () => {
    const result = calcSoleProprietorTax(SELF_EMPLOYED_STAGE, BASE_TAX_CONFIG)
    const grossIncome = SELF_EMPLOYED_STAGE.grossRevenueAnnual - SELF_EMPLOYED_STAGE.businessExpenseAnnual
    expect(result.totalTaxBurden).toBeGreaterThan(0)
    expect(result.totalTaxBurden).toBeLessThan(grossIncome)
  })

  it('所得税・住民税・社会保険がそれぞれ正の値', () => {
    const result = calcSoleProprietorTax(SELF_EMPLOYED_STAGE, BASE_TAX_CONFIG)
    expect(result.incomeTax).toBeGreaterThanOrEqual(0)
    expect(result.residentTax).toBeGreaterThan(0)
    expect(result.socialInsurance).toBeGreaterThan(0)
  })

  it('売上が少ない場合は税負担が小さい', () => {
    const lowIncome: SelfEmployedStage = {
      ...SELF_EMPLOYED_STAGE,
      grossRevenueAnnual: 3_000_000,
      businessExpenseAnnual: 500_000,
    }
    const highResult = calcSoleProprietorTax(SELF_EMPLOYED_STAGE, BASE_TAX_CONFIG)
    const lowResult = calcSoleProprietorTax(lowIncome, BASE_TAX_CONFIG)
    expect(lowResult.totalTaxBurden).toBeLessThan(highResult.totalTaxBurden)
  })

  it('小規模企業共済は課税所得から控除される', () => {
    const withoutMutual: SelfEmployedStage = {
      ...SELF_EMPLOYED_STAGE,
      smallBusinessMutualAnnual: 0,
    }
    const withMutual = SELF_EMPLOYED_STAGE
    const resultWithout = calcSoleProprietorTax(withoutMutual, BASE_TAX_CONFIG)
    const resultWith = calcSoleProprietorTax(withMutual, BASE_TAX_CONFIG)
    expect(resultWith.incomeTax).toBeLessThanOrEqual(resultWithout.incomeTax)
  })

  it('totalTaxBurden = incomeTax + residentTax + socialInsurance + pensionContribution', () => {
    const result = calcSoleProprietorTax(SELF_EMPLOYED_STAGE, BASE_TAX_CONFIG)
    const sum = result.incomeTax + result.residentTax + result.socialInsurance + result.pensionContribution
    expect(result.totalTaxBurden).toBeCloseTo(sum, 0)
  })
})

describe('calcEmployeeTax', () => {
  it('会社員の税・社保は収入の範囲内', () => {
    const result = calcEmployeeTax(EMPLOYEE_STAGE, BASE_TAX_CONFIG)
    const grossIncome = (EMPLOYEE_STAGE.grossSalaryAnnual ?? 0) + EMPLOYEE_STAGE.bonusAnnual
    expect(result.totalTaxBurden).toBeGreaterThan(0)
    expect(result.totalTaxBurden).toBeLessThan(grossIncome)
  })

  it('給与所得控除が適用される', () => {
    const result = calcEmployeeTax(EMPLOYEE_STAGE, BASE_TAX_CONFIG)
    expect(result.deductions).toBeGreaterThan(0)
  })

  it('年収が高いほど税負担が大きい', () => {
    const highIncome: EmployeeStage = { ...EMPLOYEE_STAGE, grossSalaryAnnual: 15_000_000 }
    const lowIncome: EmployeeStage = { ...EMPLOYEE_STAGE, grossSalaryAnnual: 5_000_000 }
    const highResult = calcEmployeeTax(highIncome, BASE_TAX_CONFIG)
    const lowResult = calcEmployeeTax(lowIncome, BASE_TAX_CONFIG)
    expect(highResult.totalTaxBurden).toBeGreaterThan(lowResult.totalTaxBurden)
  })

  it('手取り入力モードでも税負担が計算される', () => {
    const takehomeStage: EmployeeStage = {
      ...EMPLOYEE_STAGE,
      salaryInputMode: 'takehome',
      takehomeSalaryAnnual: 7_000_000,
    }
    const result = calcEmployeeTax(takehomeStage, BASE_TAX_CONFIG)
    expect(result.totalTaxBurden).toBeGreaterThanOrEqual(0)
  })

  it('totalTaxBurden = incomeTax + residentTax + socialInsurance', () => {
    const result = calcEmployeeTax(EMPLOYEE_STAGE, BASE_TAX_CONFIG)
    const sum = result.incomeTax + result.residentTax + result.socialInsurance
    expect(result.totalTaxBurden).toBeCloseTo(sum, 0)
  })
})

describe('calcRetiredTax', () => {
  it('退職後の税負担は年金収入の範囲内', () => {
    const result = calcRetiredTax(RETIRED_STAGE, BASE_TAX_CONFIG)
    const totalPension = RETIRED_STAGE.retirementNationalPensionAnnual +
      RETIRED_STAGE.retirementEmployeesPensionAnnual
    expect(result.totalTaxBurden).toBeGreaterThanOrEqual(0)
    expect(result.totalTaxBurden).toBeLessThan(totalPension)
  })

  it('年金収入が少ない場合は税負担が小さくなる', () => {
    const lowPension: RetiredStage = {
      ...RETIRED_STAGE,
      retirementNationalPensionAnnual: 780_000,
      retirementEmployeesPensionAnnual: 0,
    }
    const highPensionResult = calcRetiredTax(RETIRED_STAGE, BASE_TAX_CONFIG)
    const lowPensionResult = calcRetiredTax(lowPension, BASE_TAX_CONFIG)
    expect(lowPensionResult.totalTaxBurden).toBeLessThanOrEqual(highPensionResult.totalTaxBurden)
  })
})
