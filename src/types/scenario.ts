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
}

export interface Scenario {
  scenario: ScenarioConfig
  loan: LoanConfig
  careerStages: CareerStage[]
  tax: TaxConfig
  housing: HousingConfig
  living: LivingConfig
  assets: AssetConfig
  events: LifeEvent[]
  strategy: PrepaymentStrategy
  mutualAid: MutualAidConfig
}
