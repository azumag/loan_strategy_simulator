export type TaxMode = 'simple_auto' | 'manual_override'
export type HousingLoanDeductionMode = 'auto' | 'manual'
/** 2024年現行制度の住宅種別 */
export type HousingLoanScheme = 'long_term' | 'zeh' | 'eco' | 'general'

export interface TaxConfig {
  mode: TaxMode
  basicDeductionAnnual: number
  spouseDeductionAnnual: number
  dependentDeductionAnnual: number
  lifeInsuranceDeductionAnnual: number
  earthquakeInsuranceDeductionAnnual: number
  medicalDeductionAnnual: number
  otherDeductionAnnual: number
  housingLoanDeductionAnnual: number
  housingLoanDeductionMode: HousingLoanDeductionMode
  housingLoanScheme: HousingLoanScheme
  residentTaxLagEnabled: boolean
}
