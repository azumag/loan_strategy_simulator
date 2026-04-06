import { describe, it, expect } from 'vitest'
import { resolveCareerStage, calcGrossIncome } from '../../src/core/career-resolver'
import { CareerStage } from '../../src/types'

const STAGES: CareerStage[] = [
  {
    fromAge: 40,
    toAge: 49,
    workStyle: 'self_employed',
    grossRevenueAnnual: 10_000_000,
    businessExpenseAnnual: 2_000_000,
    bluePenaltyDeduction: 650_000,
    smallBusinessMutualAnnual: 840_000,
    sideIncomeAnnual: 500_000,
  },
  {
    fromAge: 50,
    toAge: 64,
    workStyle: 'employee',
    salaryInputMode: 'gross',
    grossSalaryAnnual: 8_000_000,
    bonusAnnual: 1_000_000,
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
]

describe('resolveCareerStage', () => {
  it('40歳は個人事業主ステージを返す', () => {
    const stage = resolveCareerStage(40, STAGES)
    expect(stage?.workStyle).toBe('self_employed')
  })

  it('49歳は個人事業主ステージを返す', () => {
    const stage = resolveCareerStage(49, STAGES)
    expect(stage?.workStyle).toBe('self_employed')
  })

  it('50歳は会社員ステージを返す', () => {
    const stage = resolveCareerStage(50, STAGES)
    expect(stage?.workStyle).toBe('employee')
  })

  it('65歳は退職ステージを返す', () => {
    const stage = resolveCareerStage(65, STAGES)
    expect(stage?.workStyle).toBe('retired')
  })

  it('90歳は退職ステージを返す', () => {
    const stage = resolveCareerStage(90, STAGES)
    expect(stage?.workStyle).toBe('retired')
  })

  it('ステージ範囲外の年齢はnullを返す', () => {
    const stage = resolveCareerStage(39, STAGES)
    expect(stage).toBeNull()
  })
})

describe('calcGrossIncome', () => {
  it('個人事業主: 売上 + 副収入（経費は別途 businessExpenses として追跡）', () => {
    const stage = resolveCareerStage(40, STAGES)!
    const income = calcGrossIncome(stage)
    // 10,000,000 + 500,000
    expect(income).toBe(10_500_000)
  })

  it('会社員(gross): 額面年収 + 賞与 + 副収入', () => {
    const stage = resolveCareerStage(50, STAGES)!
    const income = calcGrossIncome(stage)
    // 8,000,000 + 1,000,000 + 0
    expect(income).toBe(9_000_000)
  })

  it('会社員(takehome): 手取り年収を返す', () => {
    const takehomeStage: CareerStage = {
      fromAge: 50,
      toAge: 60,
      workStyle: 'employee',
      salaryInputMode: 'takehome',
      takehomeSalaryAnnual: 6_000_000,
      bonusAnnual: 0,
      sideIncomeAnnual: 0,
    }
    const income = calcGrossIncome(takehomeStage)
    expect(income).toBe(6_000_000)
  })

  it('退職後: 国民年金 + 厚生年金 + その他', () => {
    const stage = resolveCareerStage(65, STAGES)!
    const income = calcGrossIncome(stage)
    // 780,000 + 1,200,000 + 0
    expect(income).toBe(1_980_000)
  })
})
