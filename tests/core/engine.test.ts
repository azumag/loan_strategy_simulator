import { describe, it, expect } from 'vitest'
import { simulate } from '../../src/core/engine'
import { Scenario } from '../../src/types'

// design.md セクション9 のサンプルデータ（一部簡略化）
const SAMPLE_SCENARIO: Scenario = {
  scenario: {
    name: 'テストシナリオ',
    startAge: 40,
    endAge: 90,
    minimumCashBuffer: 3_000_000,
    investmentReturnRate: 0.03,
    inflationRate: 0.01,
  },
  loan: {
    principal: 30_000_000,
    startAge: 40,
    loanTermYears: 35,
    repaymentType: 'equal_payment',
    rateSchedule: [{ fromYear: 1, rate: 0.01 }],
    bonusMonthlyEquivalent: 0,
  },
  careerStages: [
    {
      fromAge: 40,
      toAge: 49,
      workStyle: 'self_employed',
      grossRevenueAnnual: 10_000_000,
      businessExpenseAnnual: 2_000_000,
      bluePenaltyDeduction: 650_000,
      smallBusinessMutualAnnual: 840_000,
      sideIncomeAnnual: 0,
    },
    {
      fromAge: 50,
      toAge: 64,
      workStyle: 'employee',
      salaryInputMode: 'gross',
      grossSalaryAnnual: 8_000_000,
      bonusAnnual: 0,
      sideIncomeAnnual: 0,
    },
    {
      fromAge: 65,
      toAge: 90,
      workStyle: 'retired',
      retirementNationalPensionAnnual: 780_000,
      retirementEmployeesPensionAnnual: 1_200_000,
      retirementOtherIncomeAnnual: 0,
    },
  ],
  tax: {
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
  },
  housing: {
    fixedAssetTaxAnnual: 250_000,
    cityPlanningTaxAnnual: 80_000,
    homeInsuranceAnnual: 50_000,
    maintenanceAnnual: 200_000,
    otherHousingCostAnnual: 0,
  },
  living: {
    monthlyBaseCost: 200_000,
    educationCostAnnual: 0,
    carCostAnnual: 300_000,
    otherFixedCostAnnual: 0,
    monthlyRetirementCost: 180_000,
  },
  assets: {
    initialCash: 5_000_000,
    initialLiquidAssets: 2_000_000,
    initialSemiLiquidAssets: 0,
    initialRetirementAssets: 0,
    annualSavingsContribution: 0,
    emergencyUsableRatio: 0.7,
  },
  events: [],
  strategy: {
    prepayments: [],
    targetPayoffAge: 75,
    stopPrepaymentIfCashBelowBuffer: true,
  },
}

describe('simulate', () => {
  it('40〜90歳の51年分のAnnualRowが生成される', () => {
    const result = simulate(SAMPLE_SCENARIO)
    expect(result.rows.length).toBe(51)
    expect(result.rows[0].age).toBe(40)
    expect(result.rows[50].age).toBe(90)
  })

  it('各AnnualRowに必要なフィールドが含まれる', () => {
    const result = simulate(SAMPLE_SCENARIO)
    const row = result.rows[0]
    expect(row).toHaveProperty('age')
    expect(row).toHaveProperty('workStyle')
    expect(row).toHaveProperty('grossIncome')
    expect(row).toHaveProperty('loanRepaymentAnnual')
    expect(row).toHaveProperty('netCashflow')
    expect(row).toHaveProperty('endingCash')
    expect(row).toHaveProperty('loanBalance')
  })

  it('ローン残債は年々減少する（繰上返済なし）', () => {
    const result = simulate(SAMPLE_SCENARIO)
    // 最初の10年間は残債が減少すること
    for (let i = 0; i < 10; i++) {
      expect(result.rows[i + 1].loanBalance).toBeLessThanOrEqual(result.rows[i].loanBalance)
    }
  })

  it('サマリーに必要なフィールドが含まれる', () => {
    const result = simulate(SAMPLE_SCENARIO)
    expect(result.summary).toHaveProperty('currentMonthlyPayment')
    expect(result.summary).toHaveProperty('totalRepayment')
    expect(result.summary).toHaveProperty('totalInterest')
    expect(result.summary).toHaveProperty('balanceAt60')
    expect(result.summary).toHaveProperty('balanceAt65')
    expect(result.summary).toHaveProperty('payoffAge')
    expect(result.summary).toHaveProperty('firstShortageAge')
    expect(result.summary).toHaveProperty('retirementFeasibility')
  })

  it('月次返済額は正の値', () => {
    const result = simulate(SAMPLE_SCENARIO)
    expect(result.summary.currentMonthlyPayment).toBeGreaterThan(0)
  })

  it('繰上返済により指定年齢時点の残債が減少する', () => {
    const withPrepayment: Scenario = {
      ...SAMPLE_SCENARIO,
      strategy: {
        prepayments: [{ age: 50, amount: 15_000_000, source: 'cash', mode: 'one_time' }],
        targetPayoffAge: 65,
        stopPrepaymentIfCashBelowBuffer: false,
      },
      assets: {
        ...SAMPLE_SCENARIO.assets,
        initialCash: 20_000_000,
      },
    }
    const withoutPrepayment = simulate(SAMPLE_SCENARIO)
    const withPre = simulate(withPrepayment)

    // 繰上返済後は60歳時点の残債が大幅に減少
    const balance60Without = withoutPrepayment.summary.balanceAt60
    const balance60With = withPre.summary.balanceAt60
    expect(balance60With).toBeLessThan(balance60Without)
  })

  it('資金ショート検出: 初期現金が極端に少ない場合', () => {
    const shortScenario: Scenario = {
      ...SAMPLE_SCENARIO,
      assets: {
        ...SAMPLE_SCENARIO.assets,
        initialCash: 100_000, // 非常に少ない初期現金
      },
      living: {
        ...SAMPLE_SCENARIO.living,
        monthlyBaseCost: 500_000, // 高い生活費
      },
    }
    const result = simulate(shortScenario)
    expect(result.summary.firstShortageAge).not.toBeNull()
  })

  it('老後移行判定: 現金が潤沢な場合はsafe', () => {
    const richScenario: Scenario = {
      ...SAMPLE_SCENARIO,
      assets: {
        ...SAMPLE_SCENARIO.assets,
        initialCash: 100_000_000, // 十分な初期現金
      },
    }
    const result = simulate(richScenario)
    expect(result.summary.retirementFeasibility).toBe('safe')
  })

  it('インフレ率が適用されると生活費が年々増加', () => {
    const inflationScenario: Scenario = {
      ...SAMPLE_SCENARIO,
      scenario: {
        ...SAMPLE_SCENARIO.scenario,
        inflationRate: 0.02,
      },
    }
    const result = simulate(inflationScenario)
    const livingCost40 = result.rows[0].livingCostAnnual
    const livingCost60 = result.rows[20].livingCostAnnual
    expect(livingCost60).toBeGreaterThan(livingCost40)
  })
})
