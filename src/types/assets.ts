export interface AssetConfig {
  initialCash: number
  initialLiquidAssets: number    // 課税口座（流動資産）
  initialNisaBalance: number     // NISA残高（非課税）
  initialSemiLiquidAssets: number
  initialRetirementAssets: number
  annualSavingsContribution: number  // 課税口座への年間積立
  annualNisaContribution: number     // NISAへの年間積立（上限360万/年、累計1800万）
  emergencyUsableRatio: number
}

export interface HousingConfig {
  fixedAssetTaxAnnual: number
  cityPlanningTaxAnnual: number
  homeInsuranceAnnual: number
  homeInsuranceDeductible: boolean
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
