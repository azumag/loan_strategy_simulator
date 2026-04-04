import { describe, it, expect } from 'vitest'
import { validateScenario } from '../../src/core/validators'
import { Scenario } from '../../src/types'

const VALID_SCENARIO: Scenario = {
  scenario: {
    name: 'テスト',
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
    initialLiquidAssets: 0,
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

describe('validateScenario', () => {
  it('有効なシナリオはエラーなし', () => {
    const errors = validateScenario(VALID_SCENARIO)
    expect(errors).toHaveLength(0)
  })

  it('startAge > endAge はエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      scenario: { ...VALID_SCENARIO.scenario, startAge: 90, endAge: 40 },
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('Age'))).toBe(true)
  })

  it('元本が0以下はエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      loan: { ...VALID_SCENARIO.loan, principal: -1 },
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('principal'))).toBe(true)
  })

  it('キャリアステージの年齢帯が重複するとエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      careerStages: [
        {
          fromAge: 40,
          toAge: 60,
          workStyle: 'employee',
          salaryInputMode: 'gross',
          grossSalaryAnnual: 8_000_000,
          bonusAnnual: 0,
          sideIncomeAnnual: 0,
        },
        {
          fromAge: 55, // 重複
          toAge: 90,
          workStyle: 'retired',
          retirementNationalPensionAnnual: 780_000,
          retirementEmployeesPensionAnnual: 0,
          retirementOtherIncomeAnnual: 0,
        },
      ],
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('careerStages'))).toBe(true)
  })

  it('金利スケジュールがfromYear昇順でないとエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      loan: {
        ...VALID_SCENARIO.loan,
        rateSchedule: [
          { fromYear: 11, rate: 0.02 },
          { fromYear: 1, rate: 0.01 }, // 逆順
        ],
      },
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('rateSchedule'))).toBe(true)
  })

  it('繰上返済年齢がシミュレーション範囲外はエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      strategy: {
        ...VALID_SCENARIO.strategy,
        prepayments: [{ age: 100, amount: 1_000_000, source: 'cash', mode: 'one_time' }],
      },
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('prepayment'))).toBe(true)
  })

  it('salaryInputMode=grossでgrossSalaryAnnual未設定はエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      careerStages: [
        {
          fromAge: 40,
          toAge: 90,
          workStyle: 'employee',
          salaryInputMode: 'gross',
          // grossSalaryAnnual を省略
          bonusAnnual: 0,
          sideIncomeAnnual: 0,
        },
      ],
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('grossSalaryAnnual'))).toBe(true)
  })

  it('金利スケジュールが空はエラー', () => {
    const invalid: Scenario = {
      ...VALID_SCENARIO,
      loan: { ...VALID_SCENARIO.loan, rateSchedule: [] },
    }
    const errors = validateScenario(invalid)
    expect(errors.some((e) => e.field.includes('rateSchedule'))).toBe(true)
  })
})
