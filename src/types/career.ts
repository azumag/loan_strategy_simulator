export type WorkStyle = 'self_employed' | 'employee' | 'retired' | 'micro_corporation'
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
  exemptFromBusinessTax?: boolean  // 個人事業税の対象外職種（弁護士・コンサル等）
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

/**
 * マイクロ法人ステージ
 * 個人事業（フリーランス等）と自分が役員の法人を併用する形態。
 * 社会保険料を役員報酬ベースで計算することで保険料を抑制できる。
 */
export interface MicroCorporationStage extends BaseCareerStage {
  workStyle: 'micro_corporation'
  // ── 個人事業部分 ──
  soloGrossRevenueAnnual: number    // 個人事業の年間売上
  soloBusinessExpenseAnnual: number // 個人事業の年間経費
  bluePenaltyDeduction: number      // 青色申告特別控除（個人事業分）
  // ── 法人部分 ──
  corporateRevenueAnnual: number    // 法人の年間売上
  corporateExpenseAnnual: number    // 法人の年間経費（役員報酬は除く）
  directorCompensationAnnual: number// 役員報酬（法人→個人への給与）※低く設定して社保削減
  // ── 共済（個人事業主として加入） ──
  smallBusinessMutualAnnual: number
  bankruptcyMutualAnnual: number
  exemptFromBusinessTax?: boolean  // 個人事業税の対象外職種
}

export type CareerStage = SelfEmployedStage | EmployeeStage | RetiredStage | MicroCorporationStage
