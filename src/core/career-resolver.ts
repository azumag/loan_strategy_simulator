import { CareerStage } from '../types'

export function resolveCareerStage(age: number, stages: CareerStage[]): CareerStage | null {
  return stages.find((s) => age >= s.fromAge && age <= s.toAge) ?? null
}

export function calcGrossIncome(stage: CareerStage): number {
  switch (stage.workStyle) {
    case 'self_employed':
      return stage.grossRevenueAnnual + stage.sideIncomeAnnual

    case 'employee':
      if (stage.salaryInputMode === 'takehome') {
        return (stage.takehomeSalaryAnnual ?? 0) + stage.bonusAnnual
      }
      return (stage.grossSalaryAnnual ?? 0) + stage.bonusAnnual + stage.sideIncomeAnnual

    case 'retired':
      return (
        stage.retirementNationalPensionAnnual +
        stage.retirementEmployeesPensionAnnual +
        stage.retirementOtherIncomeAnnual
      )

    case 'micro_corporation':
      return (
        stage.soloGrossRevenueAnnual +
        stage.directorCompensationAnnual +
        stage.corporateRevenueAnnual
      )
  }
}
