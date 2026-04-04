import { LoanConfig } from './loan'
import { CareerStage } from './career'
import { TaxConfig } from './tax'
import { AssetConfig, HousingConfig, LivingConfig, LifeEvent, PrepaymentStrategy } from './assets'

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
}
