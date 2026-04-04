export type TaxMode = 'simple_auto' | 'manual_override'

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
  residentTaxLagEnabled: boolean
}
