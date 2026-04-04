export type WorkStyle = 'self_employed' | 'employee' | 'retired'
export type SalaryInputMode = 'gross' | 'takehome'

interface BaseCareerStage {
  fromAge: number
  toAge: number
  workStyle: WorkStyle
  note?: string
}

export interface SelfEmployedStage extends BaseCareerStage {
  workStyle: 'self_employed'
  grossRevenueAnnual: number
  businessExpenseAnnual: number
  bluePenaltyDeduction: number
  smallBusinessMutualAnnual: number
  bankruptcyMutualAnnual: number
  sideIncomeAnnual: number
}

export interface EmployeeStage extends BaseCareerStage {
  workStyle: 'employee'
  salaryInputMode: SalaryInputMode
  grossSalaryAnnual?: number
  takehomeSalaryAnnual?: number
  bonusAnnual: number
  sideIncomeAnnual: number
}

export interface RetiredStage extends BaseCareerStage {
  workStyle: 'retired'
  retirementNationalPensionAnnual: number
  retirementEmployeesPensionAnnual: number
  retirementOtherIncomeAnnual: number
}

export type CareerStage = SelfEmployedStage | EmployeeStage | RetiredStage
