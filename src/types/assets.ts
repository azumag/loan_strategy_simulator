export interface AssetConfig {
  initialCash: number
  initialLiquidAssets: number
  initialSemiLiquidAssets: number
  initialRetirementAssets: number
  annualSavingsContribution: number
  emergencyUsableRatio: number
}

export interface HousingConfig {
  fixedAssetTaxAnnual: number
  cityPlanningTaxAnnual: number
  homeInsuranceAnnual: number
  maintenanceAnnual: number
  otherHousingCostAnnual: number
}

export interface LivingConfig {
  monthlyBaseCost: number
  educationCostAnnual: number
  carCostAnnual: number
  otherFixedCostAnnual: number
  monthlyRetirementCost: number
}

export type LifeEventType = 'income' | 'expense'

export interface LifeEvent {
  age: number
  type: LifeEventType
  label: string
  amount: number
  note?: string
}

export type PrepaymentSource = 'cash' | 'liquid_assets'
export type PrepaymentMode = 'one_time' | 'annual'

export interface PrepaymentEntry {
  age: number
  amount: number
  source: PrepaymentSource
  mode: PrepaymentMode
  note?: string
}

export interface PrepaymentStrategy {
  prepayments: PrepaymentEntry[]
  targetPayoffAge: number
  stopPrepaymentIfCashBelowBuffer: boolean
}
