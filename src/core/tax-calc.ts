import { TaxConfig, SelfEmployedStage, EmployeeStage, RetiredStage, MicroCorporationStage } from '../types'

export interface TaxResult {
  grossIncome: number
  businessExpenses: number
  deductions: number
  incomeTax: number
  residentTax: number
  businessTax: number        // 個人事業税（住民税とは別途）
  socialInsurance: number
  pensionContribution: number
  smallBusinessMutual: number
  bankruptcyMutual: number
  totalTaxBurden: number
  // 社会保険内訳（任意）
  socialInsuranceBreakdown?: {
    healthInsurance: number   // 健康保険 or 国民健康保険
    pension: number           // 厚生年金 or 国民年金
    employmentInsurance: number // 雇用保険（自営業は0）
    standardMonthlyRemuneration?: number  // employee/micro_corp: 標準報酬月額
    annualSalaryBase?: number            // employee/micro_corp: 社保基準年収（雇用保険用）
    netBusinessIncomeForNHI?: number     // self-employed: NHI算定の事業所得
  }
  // 控除内訳（任意）
  deductionBreakdown?: {
    taxableIncome: number         // 課税所得
    incomeTaxBeforeCredit: number // ローン控除前の所得税
    employment?: number           // 給与所得控除
    bluePenalty?: number          // 青色申告特別控除
    socialInsuranceDeduction: number // 社会保険料控除
    basic: number                 // 基礎控除
    spouse?: number               // 配偶者控除
    dependent?: number            // 扶養控除
    lifeInsurance?: number        // 生命保険料控除
    earthquake?: number           // 地震保険料控除
    medical?: number              // 医療費控除
    smallBizMutual?: number       // 小規模企業共済等掛金控除
    housingLoanCredit?: number    // 住宅ローン控除（税額控除）
    other?: number                // その他控除
  }
}

// ---------------------------------------------------------------------------
// 社会保険料計算ヘルパー
// ---------------------------------------------------------------------------

/**
 * 標準報酬月額テーブル（健康保険・協会けんぽ 50等級、2024年度）
 * 各エントリ: [標準報酬月額, 報酬月額の下限]
 */
const STANDARD_MONTHLY_REMUNERATION_TABLE: [number, number][] = [
  [58_000, 0],       [68_000, 63_000],  [78_000, 73_000],  [88_000, 83_000],
  [98_000, 93_000],  [104_000, 101_000],[110_000, 107_000],[118_000, 114_000],
  [126_000, 122_000],[134_000, 130_000],[142_000, 138_000],[150_000, 146_000],
  [160_000, 155_000],[170_000, 165_000],[180_000, 175_000],[190_000, 185_000],
  [200_000, 195_000],[220_000, 210_000],[240_000, 230_000],[260_000, 250_000],
  [280_000, 270_000],[300_000, 290_000],[320_000, 310_000],[340_000, 330_000],
  [360_000, 350_000],[380_000, 370_000],[410_000, 395_000],[440_000, 425_000],
  [470_000, 455_000],[500_000, 485_000],[530_000, 515_000],[560_000, 545_000],
  [590_000, 575_000],[620_000, 605_000],[650_000, 635_000],[680_000, 665_000],
  [710_000, 695_000],[750_000, 730_000],[830_000, 790_000],[910_000, 870_000],
  [1_000_000, 950_000],[1_090_000, 1_045_000],[1_190_000, 1_135_000],[1_390_000, 1_240_000],
]
// 厚生年金の上限等級: 標準報酬月額 650,000円
const KOSEI_NENKIN_CAP_GRADE = 650_000

/**
 * 月額報酬から標準報酬月額を返す
 */
function getStandardMonthlyRemuneration(monthlySalary: number): number {
  for (let i = STANDARD_MONTHLY_REMUNERATION_TABLE.length - 1; i >= 0; i--) {
    if (monthlySalary >= STANDARD_MONTHLY_REMUNERATION_TABLE[i][1]) {
      return STANDARD_MONTHLY_REMUNERATION_TABLE[i][0]
    }
  }
  return STANDARD_MONTHLY_REMUNERATION_TABLE[0][0]
}

/**
 * 会社員の社会保険料計算（標準報酬月額テーブル基準）
 * @param annualSalary 年間額面給与（ボーナス込み）
 * @returns { healthInsurance, pension, employmentInsurance, total }
 */
export function calcEmployeeSocialInsurance(annualSalary: number): {
  healthInsurance: number
  pension: number
  employmentInsurance: number
  total: number
  standardMonthlyRemuneration: number
} {
  // 月額報酬（ボーナス込みで年額→月額換算）
  const monthlySalary = annualSalary / 12
  const stdMonthly = getStandardMonthlyRemuneration(monthlySalary)

  // 健康保険: 協会けんぽ（東京都2024年度）被保険者負担率 4.985%
  const healthInsuranceMonthly = Math.floor(stdMonthly * 0.04985)
  const healthInsurance = healthInsuranceMonthly * 12

  // 厚生年金: 被保険者負担率 9.15%、上限650,000円
  const pensionStdMonthly = Math.min(stdMonthly, KOSEI_NENKIN_CAP_GRADE)
  const pensionMonthly = Math.floor(pensionStdMonthly * 0.0915)
  const pension = pensionMonthly * 12

  // 雇用保険: 0.6%（実際の給与ベース）
  const employmentInsurance = Math.floor(annualSalary * 0.006)

  const total = healthInsurance + pension + employmentInsurance
  return { healthInsurance, pension, employmentInsurance, total, standardMonthlyRemuneration: stdMonthly }
}

/**
 * 個人事業主の社会保険料計算
 * @param netBusinessIncome 事業所得（売上 - 経費）
 * @returns { healthInsurance, pension, total }
 */
export function calcSelfEmployedSocialInsurance(netBusinessIncome: number): {
  healthInsurance: number
  pension: number
  total: number
} {
  // 国民健康保険（全国平均的な計算）
  // 所得割: (所得 - 基礎控除430,000) × 8.5% 程度
  // 均等割: 50,000円 程度（世帯1人）
  // 上限: 1,020,000円（2024年度）
  const nhiBase = Math.max(0, netBusinessIncome - 430_000)
  const nhiIncomeLevy = Math.floor(nhiBase * 0.085)
  const nhiPerCapita = 50_000
  const healthInsurance = Math.min(nhiIncomeLevy + nhiPerCapita, 1_020_000)

  // 国民年金: 月額16,980円（2024年度）× 12ヶ月
  const pension = 16_980 * 12 // 203,760円

  const total = healthInsurance + pension
  return { healthInsurance, pension, total }
}

/**
 * 所得税速算表（2024年基準）
 */
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  const brackets = [
    { limit: 1_950_000, rate: 0.05, deduction: 0 },
    { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
    { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
    { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
    { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
  ]
  const bracket = brackets.find((b) => taxableIncome <= b.limit)!
  return Math.max(0, taxableIncome * bracket.rate - bracket.deduction)
}

/**
 * 給与所得控除額計算
 */
function calcEmploymentIncomeDeduction(grossSalary: number): number {
  if (grossSalary <= 1_625_000) return 550_000
  if (grossSalary <= 1_800_000) return grossSalary * 0.4 - 100_000
  if (grossSalary <= 3_600_000) return grossSalary * 0.3 + 80_000
  if (grossSalary <= 6_600_000) return grossSalary * 0.2 + 440_000
  if (grossSalary <= 8_500_000) return grossSalary * 0.1 + 1_100_000
  return 1_950_000
}

/**
 * 個人事業主の税・社会保険概算計算
 */
export function calcSoleProprietorTax(stage: SelfEmployedStage, tax: TaxConfig): TaxResult {
  const grossIncome = stage.grossRevenueAnnual - stage.businessExpenseAnnual + stage.sideIncomeAnnual
  const businessExpenses = stage.businessExpenseAnnual

  const netBusinessIncome = stage.grossRevenueAnnual - stage.businessExpenseAnnual
  // 国保の算定基礎は事業所得＋副収入（雑所得）
  const { healthInsurance: nationalHealthInsurance, pension: nationalPension, total: socialInsurance } =
    calcSelfEmployedSocialInsurance(netBusinessIncome + stage.sideIncomeAnnual)

  // 課税所得計算
  const totalDeductions =
    tax.basicDeductionAnnual +
    stage.bluePenaltyDeduction +
    stage.smallBusinessMutualAnnual +
    Math.min(stage.bankruptcyMutualAnnual, 2_400_000) +
    socialInsurance +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.lifeInsuranceDeductionAnnual +
    tax.earthquakeInsuranceDeductionAnnual +
    tax.medicalDeductionAnnual +
    tax.otherDeductionAnnual

  const taxableIncome = Math.max(0, grossIncome - totalDeductions)
  const incomeTaxBeforeCredit = calcIncomeTax(taxableIncome)
  const housingLoanCredit = Math.min(incomeTaxBeforeCredit, tax.housingLoanDeductionAnnual)
  const incomeTax = Math.max(0, incomeTaxBeforeCredit - housingLoanCredit)
  const residentTax = Math.max(0, taxableIncome * 0.1 + 5_000) // 均等割概算含む

  // 個人事業税: 対象外職種の場合はゼロ、それ以外は事業所得290万超の部分×5%概算
  const businessTaxBase = stage.exemptFromBusinessTax
    ? 0
    : Math.max(0, stage.grossRevenueAnnual - stage.businessExpenseAnnual - 2_900_000)
  const businessTax = businessTaxBase * 0.05

  const totalTaxBurden =
    incomeTax + residentTax + businessTax + socialInsurance

  return {
    grossIncome,
    businessExpenses,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    businessTax,
    socialInsurance: nationalHealthInsurance,
    pensionContribution: nationalPension,
    smallBusinessMutual: stage.smallBusinessMutualAnnual,
    bankruptcyMutual: stage.bankruptcyMutualAnnual,
    totalTaxBurden,
    socialInsuranceBreakdown: {
      healthInsurance: nationalHealthInsurance,
      pension: nationalPension,
      employmentInsurance: 0,
      netBusinessIncomeForNHI: netBusinessIncome + stage.sideIncomeAnnual,
    },
    deductionBreakdown: {
      taxableIncome,
      incomeTaxBeforeCredit,
      bluePenalty: stage.bluePenaltyDeduction || undefined,
      socialInsuranceDeduction: socialInsurance,
      basic: tax.basicDeductionAnnual,
      spouse: tax.spouseDeductionAnnual || undefined,
      dependent: tax.dependentDeductionAnnual || undefined,
      lifeInsurance: tax.lifeInsuranceDeductionAnnual || undefined,
      earthquake: tax.earthquakeInsuranceDeductionAnnual || undefined,
      medical: tax.medicalDeductionAnnual || undefined,
      smallBizMutual: (stage.smallBusinessMutualAnnual + Math.min(stage.bankruptcyMutualAnnual, 2_400_000)) || undefined,
      housingLoanCredit: housingLoanCredit || undefined,
      other: tax.otherDeductionAnnual || undefined,
    },
  }
}

/**
 * 会社員の税・社会保険概算計算
 */
export function calcEmployeeTax(stage: EmployeeStage, tax: TaxConfig): TaxResult {
  let grossSalary: number
  let isTakehome = false

  if (stage.salaryInputMode === 'takehome') {
    grossSalary = (stage.takehomeSalaryAnnual ?? 0) + stage.bonusAnnual
    isTakehome = true
  } else {
    grossSalary = (stage.grossSalaryAnnual ?? 0) + stage.bonusAnnual + stage.sideIncomeAnnual
  }

  if (isTakehome) {
    // 手取り入力: 税・社保は0として扱う（手取りがそのまま可処分所得）
    return {
      grossIncome: grossSalary,
      businessExpenses: 0,
      deductions: 0,
      incomeTax: 0,
      residentTax: 0,
      businessTax: 0,
      socialInsurance: 0,
      pensionContribution: 0,
      smallBusinessMutual: 0,
      bankruptcyMutual: 0,
      totalTaxBurden: 0,
    }
  }

  // 社会保険: 給与・ボーナスのみ基準（副収入は社保対象外）
  const salaryBase = (stage.grossSalaryAnnual ?? 0) + stage.bonusAnnual
  const siBreakdown = calcEmployeeSocialInsurance(salaryBase)
  const socialInsurance = siBreakdown.total

  // 給与所得控除: 給与・ボーナスのみに適用（副収入＝雑所得は控除なし）
  const employmentDeduction = calcEmploymentIncomeDeduction(salaryBase)

  const totalDeductions =
    employmentDeduction +
    socialInsurance +
    tax.basicDeductionAnnual +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.lifeInsuranceDeductionAnnual +
    tax.earthquakeInsuranceDeductionAnnual +
    tax.medicalDeductionAnnual +
    tax.otherDeductionAnnual

  // 課税所得 = 給与所得 + 副収入（雑所得）- 所得控除
  const taxableIncome = Math.max(0, grossSalary - totalDeductions)
  const incomeTaxBeforeCredit = calcIncomeTax(taxableIncome)
  const housingLoanCredit = Math.min(incomeTaxBeforeCredit, tax.housingLoanDeductionAnnual)
  const incomeTax = Math.max(0, incomeTaxBeforeCredit - housingLoanCredit)
  const residentTax = Math.max(0, taxableIncome * 0.1 + 5_000)

  const totalTaxBurden = incomeTax + residentTax + socialInsurance

  return {
    grossIncome: grossSalary,
    businessExpenses: 0,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    businessTax: 0,
    socialInsurance,
    pensionContribution: 0,
    smallBusinessMutual: 0,
    bankruptcyMutual: 0,
    totalTaxBurden,
    socialInsuranceBreakdown: {
      healthInsurance: siBreakdown.healthInsurance,
      pension: siBreakdown.pension,
      employmentInsurance: siBreakdown.employmentInsurance,
      standardMonthlyRemuneration: siBreakdown.standardMonthlyRemuneration,
      annualSalaryBase: salaryBase,
    },
    deductionBreakdown: {
      taxableIncome,
      incomeTaxBeforeCredit,
      employment: employmentDeduction || undefined,
      socialInsuranceDeduction: socialInsurance,
      basic: tax.basicDeductionAnnual,
      spouse: tax.spouseDeductionAnnual || undefined,
      dependent: tax.dependentDeductionAnnual || undefined,
      lifeInsurance: tax.lifeInsuranceDeductionAnnual || undefined,
      earthquake: tax.earthquakeInsuranceDeductionAnnual || undefined,
      medical: tax.medicalDeductionAnnual || undefined,
      housingLoanCredit: housingLoanCredit || undefined,
      other: tax.otherDeductionAnnual || undefined,
    },
  }
}

/**
 * 退職後の税・社会保険概算計算
 */
export function calcRetiredTax(stage: RetiredStage, tax: TaxConfig): TaxResult {
  const totalPension =
    stage.retirementNationalPensionAnnual +
    stage.retirementEmployeesPensionAnnual +
    stage.retirementOtherIncomeAnnual

  // 公的年金等控除（65歳以上概算）
  let pensionDeduction: number
  if (totalPension <= 3_300_000) {
    pensionDeduction = Math.max(1_100_000, totalPension * 0.25)
  } else if (totalPension <= 4_100_000) {
    pensionDeduction = 275_000 + totalPension * 0.15 + 550_000
  } else {
    pensionDeduction = 685_000 + totalPension * 0.05 + 550_000
  }

  const totalDeductions =
    pensionDeduction +
    tax.basicDeductionAnnual +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.otherDeductionAnnual

  const taxableIncome = Math.max(0, totalPension - totalDeductions)
  const incomeTaxBeforeCredit = calcIncomeTax(taxableIncome)
  const housingLoanCredit = Math.min(incomeTaxBeforeCredit, tax.housingLoanDeductionAnnual)
  const incomeTax = Math.max(0, incomeTaxBeforeCredit - housingLoanCredit)
  const residentTax = Math.max(0, taxableIncome * 0.1)

  // 後期高齢者医療保険: 年金収入の概算5%
  const healthInsurance = totalPension * 0.05

  const totalTaxBurden = incomeTax + residentTax + healthInsurance

  return {
    grossIncome: totalPension,
    businessExpenses: 0,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    businessTax: 0,
    socialInsurance: healthInsurance,
    pensionContribution: 0,
    smallBusinessMutual: 0,
    bankruptcyMutual: 0,
    totalTaxBurden,
    deductionBreakdown: {
      taxableIncome,
      incomeTaxBeforeCredit,
      socialInsuranceDeduction: 0,
      basic: tax.basicDeductionAnnual,
      spouse: tax.spouseDeductionAnnual || undefined,
      dependent: tax.dependentDeductionAnnual || undefined,
      housingLoanCredit: housingLoanCredit || undefined,
      other: tax.otherDeductionAnnual || undefined,
    },
  }
}

// ---------------------------------------------------------------------------
// 法人税計算ヘルパー
// ---------------------------------------------------------------------------

/**
 * 法人税等の実効税率（中小企業 簡易版）
 * 所得 800万円以下: ~21%（法人税15% + 地方税等）
 * 所得 800万円超:  ~34%（法人税23.2% + 地方税等）
 */
export function calcCorporateTax(corporateIncome: number): number {
  if (corporateIncome <= 0) return 0
  const LOW_RATE_THRESHOLD = 8_000_000
  if (corporateIncome <= LOW_RATE_THRESHOLD) {
    return Math.floor(corporateIncome * 0.21)
  }
  return Math.floor(LOW_RATE_THRESHOLD * 0.21 + (corporateIncome - LOW_RATE_THRESHOLD) * 0.34)
}

/**
 * マイクロ法人（個人事業 + 自己法人役員）の税・社会保険計算
 *
 * ポイント:
 * - 社会保険料は役員報酬ベースの標準報酬月額で計算（大幅削減可能）
 * - 個人所得 = 個人事業所得 + 役員報酬（給与所得控除適用）
 * - 法人所得 = 法人売上 - 法人経費 - 役員報酬 → 法人税適用
 * - 法人税後の法人利益は留保（シミュレーション上は個人収入に加算して扱う）
 */
export function calcMicroCorporationTax(stage: MicroCorporationStage, tax: TaxConfig): TaxResult & { corporateTax: number; corporateRetainedEarnings: number } {
  // ── 個人事業所得 ──
  const soloNetIncome = stage.soloGrossRevenueAnnual - stage.soloBusinessExpenseAnnual

  // ── 役員報酬（給与所得控除を適用） ──
  const directorCompensation = stage.directorCompensationAnnual
  const employmentDeduction = calcEmploymentIncomeDeduction(directorCompensation)
  const directorNetIncome = Math.max(0, directorCompensation - employmentDeduction)

  // ── 社会保険: 役員報酬ベースの標準報酬月額で計算（節約の核心） ──
  const siBreakdown = calcEmployeeSocialInsurance(directorCompensation)
  const socialInsurance = siBreakdown.total

  // ── 法人側 ──
  const corporateProfit = stage.corporateRevenueAnnual - stage.corporateExpenseAnnual - directorCompensation
  const corporateTax = calcCorporateTax(Math.max(0, corporateProfit))
  const corporateRetainedEarnings = Math.max(0, corporateProfit) - corporateTax

  // ── 個人所得控除の合計 ──
  const totalDeductions =
    tax.basicDeductionAnnual +
    stage.bluePenaltyDeduction +
    stage.smallBusinessMutualAnnual +
    Math.min(stage.bankruptcyMutualAnnual, 2_400_000) +
    socialInsurance +
    tax.spouseDeductionAnnual +
    tax.dependentDeductionAnnual +
    tax.lifeInsuranceDeductionAnnual +
    tax.earthquakeInsuranceDeductionAnnual +
    tax.medicalDeductionAnnual +
    tax.otherDeductionAnnual

  // 課税所得 = 個人事業所得 + 役員報酬(給与所得控除後) - 所得控除
  const taxableIncome = Math.max(0, soloNetIncome + directorNetIncome - totalDeductions)
  const incomeTaxBeforeCredit = calcIncomeTax(taxableIncome)
  const housingLoanCredit = Math.min(incomeTaxBeforeCredit, tax.housingLoanDeductionAnnual)
  const incomeTax = Math.max(0, incomeTaxBeforeCredit - housingLoanCredit)
  const residentTax = Math.max(0, taxableIncome * 0.1 + 5_000)

  // 個人事業税（対象外職種の場合はゼロ、それ以外は個人事業所得290万超の部分×5%）
  const businessTaxBase = stage.exemptFromBusinessTax
    ? 0
    : Math.max(0, soloNetIncome - 2_900_000)
  const businessTax = businessTaxBase * 0.05

  const grossIncome = soloNetIncome + directorCompensation + corporateRetainedEarnings
  const totalTaxBurden = incomeTax + residentTax + businessTax + socialInsurance + corporateTax

  return {
    grossIncome,
    businessExpenses: stage.soloBusinessExpenseAnnual + stage.corporateExpenseAnnual,
    deductions: totalDeductions,
    incomeTax,
    residentTax,
    businessTax,
    socialInsurance: siBreakdown.healthInsurance,
    pensionContribution: siBreakdown.pension,
    smallBusinessMutual: stage.smallBusinessMutualAnnual,
    bankruptcyMutual: stage.bankruptcyMutualAnnual,
    totalTaxBurden,
    socialInsuranceBreakdown: {
      healthInsurance: siBreakdown.healthInsurance,
      pension: siBreakdown.pension,
      employmentInsurance: siBreakdown.employmentInsurance,
      standardMonthlyRemuneration: siBreakdown.standardMonthlyRemuneration,
      annualSalaryBase: directorCompensation,
    },
    deductionBreakdown: {
      taxableIncome,
      incomeTaxBeforeCredit,
      employment: employmentDeduction || undefined,
      bluePenalty: stage.bluePenaltyDeduction || undefined,
      socialInsuranceDeduction: socialInsurance,
      basic: tax.basicDeductionAnnual,
      spouse: tax.spouseDeductionAnnual || undefined,
      dependent: tax.dependentDeductionAnnual || undefined,
      lifeInsurance: tax.lifeInsuranceDeductionAnnual || undefined,
      earthquake: tax.earthquakeInsuranceDeductionAnnual || undefined,
      medical: tax.medicalDeductionAnnual || undefined,
      smallBizMutual: (stage.smallBusinessMutualAnnual + Math.min(stage.bankruptcyMutualAnnual, 2_400_000)) || undefined,
      housingLoanCredit: housingLoanCredit || undefined,
      other: tax.otherDeductionAnnual || undefined,
    },
    corporateTax,
    corporateRetainedEarnings,
  }
}

/**
 * 小規模企業共済の一括受取（退職所得）の税引後手取り額を計算
 * @param accumulated 積立総額
 * @param years 加入年数（掛金払込年数の近似）
 */
export function calcSmallBusinessMutualLumpSumNet(accumulated: number, years: number): number {
  if (accumulated <= 0) return 0
  const deduction = years <= 20
    ? Math.max(800_000, years * 400_000)
    : 8_000_000 + (years - 20) * 700_000
  const taxableRetirementIncome = Math.max(0, accumulated - deduction) / 2
  const incomeTax = calcIncomeTax(taxableRetirementIncome)
  const residentTax = Math.floor(taxableRetirementIncome * 0.1)
  return Math.max(0, accumulated - incomeTax - residentTax)
}

/**
 * 倒産防止共済の解約手当金の税引後手取り額を計算
 * 掛金は経費算入済みのため受取額は雑所得として全額課税。
 * 退職後（年金所得のみ）での受取を想定し実効税率20%で概算。
 */
export function calcBankruptcyMutualNet(accumulated: number): number {
  if (accumulated <= 0) return 0
  return Math.floor(accumulated * 0.80) // 実効税率20%概算
}
