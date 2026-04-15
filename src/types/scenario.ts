import { LoanConfig } from './loan'
import { CareerStage } from './career'
import { TaxConfig } from './tax'
import { AssetConfig, HousingConfig, LivingConfig, LifeEvent, PrepaymentStrategy } from './assets'

export type SmallBusinessMutualPayoutMethod = 'lump_sum' | 'annuity'

export interface MutualAidConfig {
  /** 小規模企業共済の受け取り方法 */
  smallBusinessMutualPayoutMethod: SmallBusinessMutualPayoutMethod
  /** 分割受取の年数（10〜20年） */
  smallBusinessMutualAnnuityYears: number
}

export interface ScenarioConfig {
  name: string
  startAge: number
  endAge: number
  minimumCashBuffer: number
  investmentReturnRate: number
  inflationRate: number
  macroEconomicSlideRate: number
  incomeInflationRate: number
  comparePrepayment: boolean
}

export interface HomeOfficeExpenseConfig {
  /** 事業使用面積割合 (0〜1) — 住宅費系（固定資産税・火災保険・修繕費・ローン利息・減価償却費）に共通適用 */
  businessSpaceRatio: number
  /** 光熱費の按分率 (0〜1) — 使用時間等で面積とは別に設定可 */
  utilityRatio: number
  /** 建物取得価額（円）— 減価償却費の算出に使用。土地は含まない */
  buildingPrice: number
  /** 建物の耐用年数 — 木造22年、軽量鉄骨27年、RC47年など */
  buildingUsefulLife: number
}

export interface Scenario {
  scenario: ScenarioConfig
  loan: LoanConfig
  careerStages: CareerStage[]
  spouseCareerStages: CareerStage[]
  tax: TaxConfig
  housing: HousingConfig
  living: LivingConfig
  assets: AssetConfig
  events: LifeEvent[]
  strategy: PrepaymentStrategy
  mutualAid: MutualAidConfig
  homeOfficeExpense: HomeOfficeExpenseConfig
}
