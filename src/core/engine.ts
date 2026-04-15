import { Scenario, SimulationResult, AnnualRow, Summary, HousingLoanScheme, BreakevenMetrics } from '../types'
import { calcLoanYear, calcEqualPaymentMonthly, resolveRate } from './loan-calc'
import {
  calcSoleProprietorTax, calcEmployeeTax, calcRetiredTax,
  calcMicroCorporationTax,
  calcSmallBusinessMutualLumpSumNet, calcBankruptcyMutualNet,
} from './tax-calc'
import { resolveCareerStage } from './career-resolver'
import { applyPrepayments, PrepaymentResult } from './prepayment'

/** 2024年現行制度の住宅ローン控除パラメータ */
export const HOUSING_LOAN_SCHEMES: Record<HousingLoanScheme, { name: string; limit: number; rate: number; years: number }> = {
  long_term: { name: '認定長期優良住宅・低炭素住宅', limit: 45_000_000, rate: 0.007, years: 13 },
  zeh:       { name: 'ZEH水準省エネ住宅',           limit: 35_000_000, rate: 0.007, years: 13 },
  eco:       { name: '省エネ基準適合住宅',           limit: 30_000_000, rate: 0.007, years: 13 },
  general:   { name: 'その他の住宅（一般）',         limit: 20_000_000, rate: 0.007, years: 10 },
}

// 倒産防止共済の年間掛金上限と累計上限
const BANKRUPTCY_MUTUAL_ANNUAL_MAX = 2_400_000   // 月20万×12
const BANKRUPTCY_MUTUAL_TOTAL_MAX  = 8_000_000   // 累計800万円
// 小規模企業共済の年間掛金上限
const SMALL_BUSINESS_MUTUAL_ANNUAL_MAX = 840_000  // 月7万×12

/**
 * 家事按分経費の合計を計算する
 * - 住宅費系（固定資産税・都市計画税・火災保険・修繕費）× businessSpaceRatio
 * - 住宅ローン利息 × businessSpaceRatio
 * - 建物減価償却費（定額法）× businessSpaceRatio
 * - 光熱費 × utilityRatio（インフレ調整あり）
 */
function calcHomeOfficeDeduction(params: {
  hoe: Scenario['homeOfficeExpense']
  housing: Scenario['housing']
  living: Scenario['living']
  loanInterestPaid: number
  inflationFactor: number
}): { total: number; breakdown: { housing: number; interest: number; depreciation: number; utility: number } } {
  const { hoe, housing, living, loanInterestPaid, inflationFactor } = params
  const spaceRatio = hoe.businessSpaceRatio ?? 0
  const utilityRatio = hoe.utilityRatio ?? 0

  // 住宅費系按分（インフレ調整なし — 固定資産税等は通常固定）
  const housingDeduction = Math.round(
    (housing.fixedAssetTaxAnnual + housing.cityPlanningTaxAnnual + housing.homeInsuranceAnnual + housing.maintenanceAnnual)
    * spaceRatio
  )

  // 住宅ローン利息按分
  const interestDeduction = Math.round(loanInterestPaid * spaceRatio)

  // 建物の減価償却費（定額法）× 事業使用割合
  // 償却率 = 1 / 耐用年数、残存価額10%を考慮
  const usefulLife = Math.max(1, hoe.buildingUsefulLife ?? 22)
  const annualDepreciation = hoe.buildingPrice > 0
    ? Math.round(hoe.buildingPrice * 0.9 / usefulLife * spaceRatio)
    : 0

  // 光熱費按分（インフレ調整あり）
  const utilityDeduction = Math.round((living.monthlyUtilityCost ?? 0) * 12 * utilityRatio * inflationFactor)

  const total = housingDeduction + interestDeduction + annualDepreciation + utilityDeduction
  return { total, breakdown: { housing: housingDeduction, interest: interestDeduction, depreciation: annualDepreciation, utility: utilityDeduction } }
}

export function simulate(scenario: Scenario, disablePrepayment: boolean = false): SimulationResult {
  const { scenario: sc, loan, careerStages, spouseCareerStages, tax, housing, living, assets, events, strategy, mutualAid, homeOfficeExpense } = scenario

  const rows: AnnualRow[] = []
  let cash = assets.initialCash
  let liquidAssets = assets.initialLiquidAssets     // 課税口座
  let nisaBalance = assets.initialNisaBalance ?? 0  // NISA（非課税）
  const loanPrincipal = Math.max(0, loan.principal - (loan.downPayment ?? 0))
  let loanBalance = loanPrincipal

  // NISA上限（新NISA: 生涯1800万、年間360万）
  const NISA_LIFETIME_CAP = 18_000_000
  const NISA_ANNUAL_CAP = 3_600_000
  let nisaContributed = assets.initialNisaBalance ?? 0  // 積立済み累計（初期残高を元手として計上）
  let totalRepayment = 0
  let totalInterest = 0

  // 共済積立の追跡
  let smallBusinessMutualAccumulated = 0
  let smallBusinessMutualYears = 0
  let bankruptcyMutualAccumulated = 0
  let prevWorkStyle: AnnualRow['workStyle'] | null = null
  // 分割受取用の残高と年額
  let annuityBalance = 0
  let annuityAnnual = 0

  const housingCostAnnual =
    housing.fixedAssetTaxAnnual +
    housing.cityPlanningTaxAnnual +
    housing.homeInsuranceAnnual +
    housing.maintenanceAnnual +
    housing.otherHousingCostAnnual
  const housingCostBreakdown = {
    fixedAssetTax: housing.fixedAssetTaxAnnual,
    cityPlanningTax: housing.cityPlanningTaxAnnual,
    homeInsurance: housing.homeInsuranceAnnual,
    maintenance: housing.maintenanceAnnual,
    other: housing.otherHousingCostAnnual,
  }

  for (let age = sc.startAge; age <= sc.endAge; age++) {
    // 頭金: ローン開始年に現金から差し引く
    if (age === loan.startAge && loan.downPayment > 0) {
      cash -= loan.downPayment
    }

    const loanYear = age - loan.startAge + 1 // ローン開始からの年数

    // 1. キャリアステージ解決
    const stage = resolveCareerStage(age, careerStages)

    // 1b. 住宅ローン控除の計算（auto モード: 年末残高ベース）
    // 年末残高を先行計算してから税計算に利用する
    let yearEndLoanBalanceForDeduction = 0
    if (loanBalance > 0 && loanYear >= 1 && loanYear <= loan.loanTermYears) {
      yearEndLoanBalanceForDeduction = calcLoanYear(loan, loanYear, loanBalance).endingBalance
    }
    let effectiveHousingDeduction = tax.housingLoanDeductionAnnual
    if ((tax.housingLoanDeductionMode ?? 'auto') === 'auto') {
      const scheme = HOUSING_LOAN_SCHEMES[tax.housingLoanScheme ?? 'eco']
      if (loanYear >= 1 && loanYear <= scheme.years) {
        effectiveHousingDeduction = Math.floor(
          Math.min(yearEndLoanBalanceForDeduction, scheme.limit) * scheme.rate
        )
      } else {
        effectiveHousingDeduction = 0
      }
    }
    // 住宅ローン控除は居住用部分のみ対象: 事業使用割合を除いた割合で按分
    // （事業使用部分の利息は経費化するため、控除対象から除外）
    const spaceRatio = homeOfficeExpense?.businessSpaceRatio ?? 0
    const residentialRatio = 1 - spaceRatio
    const adjustedHousingDeduction = Math.floor(effectiveHousingDeduction * residentialRatio)
    const fireInsuranceDeduction = housing.homeInsuranceDeductible ? housing.homeInsuranceAnnual : 0
    const effectiveTax = {
      ...tax,
      housingLoanDeductionAnnual: adjustedHousingDeduction,
      otherDeductionAnnual: tax.otherDeductionAnnual + fireInsuranceDeduction,
    }

    // 2. 収入算出
    let grossIncome = 0
    let businessExpenses = 0
    let deductions = 0
    let incomeTax = 0
    let residentTax = 0
    let businessTax = 0
    let socialInsurance = 0
    let pensionContribution = 0
    let smallBusinessMutual = 0
    let bankruptcyMutual = 0
    let mutualAidPayoutNet = 0
    let isTakehome = false
    let socialInsuranceBreakdown: AnnualRow['socialInsuranceBreakdown'] = undefined
    let deductionBreakdown: AnnualRow['deductionBreakdown'] = undefined
    let retirementDrawdown = 0
    let dividendIncome = 0
    let homeOfficeExpenseTotal = 0
    let homeOfficeExpenseBreakdown: AnnualRow['homeOfficeExpenseBreakdown']
    let workStyle: AnnualRow['workStyle'] = 'retired'

    if (stage) {
      workStyle = stage.workStyle

      // 収入のインフレ連動ファクター
      const incomeInflation = sc.incomeInflationRate ?? 0
      const incomeFactor = incomeInflation > 0 ? Math.pow(1 + incomeInflation, age - sc.startAge) : 1

      // ── 共済廃業処理: 自営業 → 非自営業への移行年 ──
      if ((prevWorkStyle === 'self_employed' || prevWorkStyle === 'micro_corporation') && workStyle !== 'self_employed' && workStyle !== 'micro_corporation') {
        // 倒産防止共済: 解約手当金（雑所得）を税引き後で受取
        const bankruptcyNet = calcBankruptcyMutualNet(bankruptcyMutualAccumulated)
        // 小規模企業共済: 選択した方法で受取
        let smallBizNet = 0
        if (mutualAid.smallBusinessMutualPayoutMethod === 'lump_sum') {
          smallBizNet = calcSmallBusinessMutualLumpSumNet(
            smallBusinessMutualAccumulated,
            smallBusinessMutualYears,
          )
        } else {
          // 分割受取: 税引き前総額を指定年数で均等分割（年金所得として課税）
          annuityBalance = smallBusinessMutualAccumulated
          annuityAnnual = Math.ceil(annuityBalance / mutualAid.smallBusinessMutualAnnuityYears)
        }
        mutualAidPayoutNet = bankruptcyNet + smallBizNet
        cash += mutualAidPayoutNet
        // 倒産防止共済は常に一括解約なのでリセット
        bankruptcyMutualAccumulated = 0
        // 小規模企業共済: 一括受取の場合のみ累積額をリセット（分割は退職後に毎年取り崩す）
        if (mutualAid.smallBusinessMutualPayoutMethod === 'lump_sum') {
          smallBusinessMutualAccumulated = 0
        }
      }

      if (stage.workStyle === 'self_employed') {
        // 倒産防止共済の実効拠出額（累計800万円上限を適用）
        const remainingBankruptcyCap = Math.max(0, BANKRUPTCY_MUTUAL_TOTAL_MAX - bankruptcyMutualAccumulated)
        const effectiveBankruptcy = Math.min(
          stage.bankruptcyMutualAnnual ?? 0,
          BANKRUPTCY_MUTUAL_ANNUAL_MAX,
          remainingBankruptcyCap,
        )
        // 小規模企業共済の実効拠出額
        const effectiveSmallBiz = Math.min(stage.smallBusinessMutualAnnual ?? 0, SMALL_BUSINESS_MUTUAL_ANNUAL_MAX)

        // 家事按分経費
        const inflationFactorForHO = Math.pow(1 + sc.inflationRate, age - sc.startAge)
        const loanInterestForHO = loanBalance > 0 && loanYear >= 1 && loanYear <= loan.loanTermYears
          ? calcLoanYear(loan, loanYear, loanBalance).interestPaid
          : 0
        const { total: homeOfficeDeductionTotal, breakdown: homeOfficeDeductionBreakdown } = calcHomeOfficeDeduction({
          hoe: homeOfficeExpense ?? { businessSpaceRatio: 0, utilityRatio: 0, buildingPrice: 0, buildingUsefulLife: 22 },
          housing,
          living,
          loanInterestPaid: loanInterestForHO,
          inflationFactor: inflationFactorForHO,
        })

        // 実効額でステージを上書きして税計算（家事按分分を経費に加算）
        const resolvedStage = {
          ...stage,
          bankruptcyMutualAnnual: effectiveBankruptcy,
          smallBusinessMutualAnnual: effectiveSmallBiz,
          businessExpenseAnnual: stage.businessExpenseAnnual + homeOfficeDeductionTotal,
          ...(incomeFactor !== 1 ? {
            grossRevenueAnnual: Math.round(stage.grossRevenueAnnual * incomeFactor),
            sideIncomeAnnual: Math.round(stage.sideIncomeAnnual * incomeFactor),
          } : {}),
        }
        homeOfficeExpenseTotal = homeOfficeDeductionTotal
        homeOfficeExpenseBreakdown = homeOfficeDeductionBreakdown
        grossIncome = resolvedStage.grossRevenueAnnual + resolvedStage.sideIncomeAnnual
        businessExpenses = resolvedStage.businessExpenseAnnual
        const taxResult = calcSoleProprietorTax(resolvedStage, effectiveTax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        businessTax = taxResult.businessTax
        socialInsurance = taxResult.socialInsurance
        pensionContribution = taxResult.pensionContribution
        socialInsuranceBreakdown = taxResult.socialInsuranceBreakdown
        deductionBreakdown = taxResult.deductionBreakdown
        smallBusinessMutual = effectiveSmallBiz
        bankruptcyMutual = effectiveBankruptcy

        // 積立額・年数を更新
        bankruptcyMutualAccumulated += effectiveBankruptcy
        smallBusinessMutualAccumulated += effectiveSmallBiz
        if (effectiveSmallBiz > 0) smallBusinessMutualYears++
      } else if (stage.workStyle === 'micro_corporation') {
        // 倒産防止共済の実効拠出額（累計800万円上限を適用）
        const remainingBankruptcyCap = Math.max(0, BANKRUPTCY_MUTUAL_TOTAL_MAX - bankruptcyMutualAccumulated)
        const effectiveBankruptcy = Math.min(
          stage.bankruptcyMutualAnnual ?? 0,
          BANKRUPTCY_MUTUAL_ANNUAL_MAX,
          remainingBankruptcyCap,
        )
        const effectiveSmallBiz = Math.min(stage.smallBusinessMutualAnnual ?? 0, SMALL_BUSINESS_MUTUAL_ANNUAL_MAX)

        // 家事按分経費
        const inflationFactorForHO_mc = Math.pow(1 + sc.inflationRate, age - sc.startAge)
        const loanInterestForHO_mc = loanBalance > 0 && loanYear >= 1 && loanYear <= loan.loanTermYears
          ? calcLoanYear(loan, loanYear, loanBalance).interestPaid
          : 0
        const { total: homeOfficeDeductionTotal, breakdown: homeOfficeDeductionBreakdown } = calcHomeOfficeDeduction({
          hoe: homeOfficeExpense ?? { businessSpaceRatio: 0, utilityRatio: 0, buildingPrice: 0, buildingUsefulLife: 22 },
          housing,
          living,
          loanInterestPaid: loanInterestForHO_mc,
          inflationFactor: inflationFactorForHO_mc,
        })

        const resolvedStage = {
          ...stage,
          bankruptcyMutualAnnual: effectiveBankruptcy,
          smallBusinessMutualAnnual: effectiveSmallBiz,
          soloBusinessExpenseAnnual: stage.soloBusinessExpenseAnnual + homeOfficeDeductionTotal,
          ...(incomeFactor !== 1 ? {
            corporateRevenueAnnual: Math.round(stage.corporateRevenueAnnual * incomeFactor),
            directorCompensationAnnual: Math.round(stage.directorCompensationAnnual * incomeFactor),
            soloGrossRevenueAnnual: Math.round(stage.soloGrossRevenueAnnual * incomeFactor),
          } : {}),
        }
        homeOfficeExpenseTotal = homeOfficeDeductionTotal
        homeOfficeExpenseBreakdown = homeOfficeDeductionBreakdown
        const taxResult = calcMicroCorporationTax(resolvedStage, effectiveTax)
        grossIncome = taxResult.grossIncome + taxResult.businessExpenses
        businessExpenses = taxResult.businessExpenses
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        businessTax = taxResult.businessTax
        socialInsurance = taxResult.socialInsurance
        pensionContribution = taxResult.pensionContribution
        socialInsuranceBreakdown = taxResult.socialInsuranceBreakdown
        deductionBreakdown = taxResult.deductionBreakdown
        smallBusinessMutual = effectiveSmallBiz
        bankruptcyMutual = effectiveBankruptcy

        // 積立額・年数を更新
        bankruptcyMutualAccumulated += effectiveBankruptcy
        smallBusinessMutualAccumulated += effectiveSmallBiz
        if (effectiveSmallBiz > 0) smallBusinessMutualYears++
      } else if (stage.workStyle === 'employee') {
        isTakehome = stage.salaryInputMode === 'takehome'
        const inflatedStage = incomeFactor !== 1 ? {
          ...stage,
          grossSalaryAnnual: stage.grossSalaryAnnual ? Math.round(stage.grossSalaryAnnual * incomeFactor) : undefined,
          takehomeSalaryAnnual: stage.takehomeSalaryAnnual ? Math.round(stage.takehomeSalaryAnnual * incomeFactor) : undefined,
          bonusAnnual: Math.round(stage.bonusAnnual * incomeFactor),
          sideIncomeAnnual: Math.round(stage.sideIncomeAnnual * incomeFactor),
        } : stage
        const sal = isTakehome
          ? (inflatedStage.takehomeSalaryAnnual ?? 0) + inflatedStage.bonusAnnual
          : (inflatedStage.grossSalaryAnnual ?? 0) + inflatedStage.bonusAnnual + inflatedStage.sideIncomeAnnual
        grossIncome = sal
        const taxResult = calcEmployeeTax(inflatedStage, effectiveTax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        socialInsurance = taxResult.socialInsurance
        socialInsuranceBreakdown = taxResult.socialInsuranceBreakdown
        deductionBreakdown = taxResult.deductionBreakdown
      } else if (stage.workStyle === 'retired') {
        // 年金のインフレ連動（マクロ経済スライド調整付き）
        // 年金改定率 = インフレ率 - マクロ経済スライド調整率（ただし名目下限0%）
        const macroSlide = sc.macroEconomicSlideRate ?? 0.009
        const pensionAdjustRate = Math.max(0, sc.inflationRate - macroSlide)
        const pensionFactor = Math.pow(1 + pensionAdjustRate, age - sc.startAge)
        const adjustedStage = {
          ...stage,
          retirementNationalPensionAnnual: Math.round(stage.retirementNationalPensionAnnual * pensionFactor),
          retirementEmployeesPensionAnnual: Math.round(stage.retirementEmployeesPensionAnnual * pensionFactor),
        }

        // 小規模企業共済の分割受取分を年金収入に加算して課税
        const annuityThisYear = annuityBalance > 0 ? Math.min(annuityAnnual, annuityBalance) : 0
        const augmentedStage = annuityThisYear > 0
          ? { ...adjustedStage, retirementOtherIncomeAnnual: adjustedStage.retirementOtherIncomeAnnual + annuityThisYear }
          : adjustedStage
        const totalPensionIncome =
          augmentedStage.retirementNationalPensionAnnual +
          augmentedStage.retirementEmployeesPensionAnnual +
          augmentedStage.retirementOtherIncomeAnnual
        // grossIncome からは年金額のみ（共済受取は mutualAidPayoutNet で明示表示）
        grossIncome = totalPensionIncome - annuityThisYear
        mutualAidPayoutNet = annuityThisYear
        const taxResult = calcRetiredTax(augmentedStage, effectiveTax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        socialInsurance = taxResult.socialInsurance
        deductionBreakdown = taxResult.deductionBreakdown
        if (annuityThisYear > 0) {
          annuityBalance = Math.max(0, annuityBalance - annuityThisYear)
          smallBusinessMutualAccumulated = Math.max(0, smallBusinessMutualAccumulated - annuityThisYear)
        }
      }
    }

    prevWorkStyle = workStyle

    // 3. 配偶者収入の計算
    let spouseNetIncome = 0
    if (spouseCareerStages && spouseCareerStages.length > 0) {
      const spouseStage = resolveCareerStage(age, spouseCareerStages)
      if (spouseStage) {
        // 配偶者は基礎控除のみ適用（住宅ローン控除等は世帯主側で計上）
        const spouseTaxConfig = { ...tax, housingLoanDeductionAnnual: 0, spouseDeductionAnnual: 0 }
        if (spouseStage.workStyle === 'employee') {
          const r = calcEmployeeTax(spouseStage, spouseTaxConfig)
          spouseNetIncome = r.grossIncome - r.totalTaxBurden
        } else if (spouseStage.workStyle === 'self_employed') {
          const r = calcSoleProprietorTax(spouseStage, spouseTaxConfig)
          spouseNetIncome = r.grossIncome - r.totalTaxBurden
        } else if (spouseStage.workStyle === 'retired') {
          const r = calcRetiredTax(spouseStage, spouseTaxConfig)
          spouseNetIncome = r.grossIncome - r.totalTaxBurden
        }
      }
    }

    // 4. ローン返済額算出
    let loanRepaymentAnnual = 0
    let interestPaid = 0
    if (loanBalance > 0 && loanYear >= 1 && loanYear <= loan.loanTermYears) {
      const loanYearResult = calcLoanYear(loan, loanYear, loanBalance)
      loanRepaymentAnnual = loanYearResult.annualPayment
      interestPaid = loanYearResult.interestPaid
      totalInterest += interestPaid
    }

    // 5. 住宅費
    const housingTaxAnnual = housingCostAnnual

    // 6. 生活費（インフレ調整）
    const inflationFactor = Math.pow(1 + sc.inflationRate, age - sc.startAge)
    const isRetired = workStyle === 'retired'
    const monthlyLiving = isRetired ? living.monthlyRetirementCost : living.monthlyBaseCost
    const monthlyUtility = living.monthlyUtilityCost ?? 0
    const baseLivingCost = (monthlyLiving + monthlyUtility) * 12 + living.educationCostAnnual + living.carCostAnnual + living.otherFixedCostAnnual
    const livingCostAnnual = baseLivingCost * inflationFactor
    const livingCostBreakdown = {
      base: monthlyLiving * 12 * inflationFactor,
      utility: monthlyUtility * 12 * inflationFactor,
      education: living.educationCostAnnual * inflationFactor,
      car: living.carCostAnnual * inflationFactor,
      other: living.otherFixedCostAnnual * inflationFactor,
    }

    // 7. 特別イベント
    let specialCashflow = 0
    for (const event of events) {
      if (event.age === age) {
        specialCashflow += event.type === 'income' ? event.amount : -event.amount
      }
    }

    // 8. 年間収支
    const totalTaxBurden = incomeTax + residentTax + businessTax + socialInsurance + pensionContribution
    const netCashflow =
      grossIncome -
      businessExpenses -
      totalTaxBurden +
      spouseNetIncome -
      loanRepaymentAnnual -
      housingTaxAnnual -
      livingCostAnnual -
      smallBusinessMutual -
      bankruptcyMutual +
      specialCashflow +
      mutualAidPayoutNet

    // 9. 現金・資産更新
    cash += netCashflow

    // 9b. 退職後の資産取り崩し（NISA → 課税口座 の優先順）
    const annualDrawdown = assets.annualRetirementDrawdown ?? 0
    retirementDrawdown = 0
    if (workStyle === 'retired' && annualDrawdown > 0) {
      const fromNisa = Math.min(annualDrawdown, nisaBalance)
      nisaBalance -= fromNisa
      retirementDrawdown += fromNisa
      const fromLiquid = Math.min(annualDrawdown - fromNisa, liquidAssets)
      liquidAssets -= fromLiquid
      retirementDrawdown += fromLiquid
      cash += retirementDrawdown
    }

    // 投資積立（現金 → 投資口座への移動）
    // 退職後に取り崩し設定がある場合、退職期間は積み立てしない
    const isRetiredWithDrawdown = workStyle === 'retired' && (assets.annualRetirementDrawdown ?? 0) > 0

    const contributionMode = (assets.investmentContributionMode ?? 'separate') as 'separate' | 'unified'
    let effectiveNisaContrib = 0
    let effectiveTaxableContrib = 0

    if (contributionMode === 'unified' && !isRetiredWithDrawdown) {
      // unified mode: NISA優先・残余は課税口座へ
      const totalInvestAmount = assets.totalAnnualInvestment ?? 0
      const nisaRoom = Math.max(0, NISA_LIFETIME_CAP - nisaContributed)
      const nisaAnnualRoom = Math.min(NISA_ANNUAL_CAP, nisaRoom)

      // NISAへの投資 (上限の範囲内)
      const nisaFromTotal = Math.min(totalInvestAmount, nisaAnnualRoom, Math.max(0, cash))
      cash -= nisaFromTotal
      nisaBalance += nisaFromTotal
      nisaContributed += nisaFromTotal

      // 残余 = 課税口座へのオーバーフロー
      const overflowToTaxable = Math.max(0, totalInvestAmount - nisaFromTotal)
      effectiveTaxableContrib = Math.min(overflowToTaxable, Math.max(0, cash))
      cash -= effectiveTaxableContrib
      liquidAssets += effectiveTaxableContrib

      effectiveNisaContrib = nisaFromTotal
    } else if (contributionMode === 'separate' && !isRetiredWithDrawdown) {
      // separate mode
      const annualNisaContrib = assets.annualNisaContribution ?? 0
      const annualTaxableContrib = assets.annualSavingsContribution ?? 0
      const autoOverflow = assets.autoOverflowToTaxableWhenNisaFull ?? true

      // NISA積立（年間上限・生涯上限を考慮）
      const nisaRoom = Math.max(0, NISA_LIFETIME_CAP - nisaContributed)
      effectiveNisaContrib = Math.min(annualNisaContrib, NISA_ANNUAL_CAP, nisaRoom, Math.max(0, cash))
      cash -= effectiveNisaContrib
      nisaBalance += effectiveNisaContrib
      nisaContributed += effectiveNisaContrib

      // autoOverflow: NISAに入りきらなかった分を課税口座に回す
      let overflowAmount = 0
      if (autoOverflow && annualNisaContrib > 0) {
        const nisaShortfall = annualNisaContrib - effectiveNisaContrib
        overflowAmount = Math.min(nisaShortfall, Math.max(0, cash))
        cash -= overflowAmount
        liquidAssets += overflowAmount
      }

      // 通常の課税口座積立（overflow分とは別に積み立て）
      const regularTaxable = Math.min(annualTaxableContrib, Math.max(0, cash))
      cash -= regularTaxable
      liquidAssets += regularTaxable

      effectiveTaxableContrib = overflowAmount + regularTaxable
    }
    // else: isRetiredWithDrawdown => both contributions remain 0

    const investmentContribution = effectiveNisaContrib + effectiveTaxableContrib

    // 資産運用利回り適用（個別株配当を分離）
    const nisaStockRatio = assets.nisaStockRatio ?? 0
    const liquidStockRatio = assets.liquidStockRatio ?? 0
    const stockDividendYield = assets.stockDividendYield ?? 0.03
    const DIVIDEND_TAX_RATE = 0.20315
    dividendIncome = 0

    if (sc.investmentReturnRate > 0 || (stockDividendYield > 0 && (nisaStockRatio > 0 || liquidStockRatio > 0))) {
      // NISA口座: インデックス部分は総利回り、個別株部分は株価上昇のみ（配当は現金へ）
      const nisaIndex = nisaBalance * (1 - nisaStockRatio)
      const nisaStock = nisaBalance * nisaStockRatio
      nisaBalance = nisaIndex * (1 + sc.investmentReturnRate)
                 + nisaStock * (1 + sc.investmentReturnRate - stockDividendYield)
      dividendIncome += nisaStock * stockDividendYield  // NISA配当は非課税

      // 課税口座: 同様に分離
      const liquidIndex = liquidAssets * (1 - liquidStockRatio)
      const liquidStock = liquidAssets * liquidStockRatio
      liquidAssets = liquidIndex * (1 + sc.investmentReturnRate)
                  + liquidStock * (1 + sc.investmentReturnRate - stockDividendYield)
      dividendIncome += liquidStock * stockDividendYield * (1 - DIVIDEND_TAX_RATE)  // 20.315%源泉徴収後

      cash += dividendIncome
    }

    // 10. 繰上返済
    let prepayResult: PrepaymentResult
    if (disablePrepayment) {
      prepayResult = {
        prepaymentAmount: 0,
        newLoanBalance: loanBalance > 0 && loanYear >= 1
          ? Math.max(0, (loanYear <= loan.loanTermYears ? calcLoanYear(loan, loanYear, loanBalance).endingBalance : 0))
          : 0,
        newCash: cash,
        newLiquidAssets: liquidAssets,
      }
    } else {
      prepayResult = applyPrepayments({
        age,
        loanBalance,
        cash,
        liquidAssets,
        minimumCashBuffer: sc.minimumCashBuffer,
        strategy,
      })
    }
    cash = prepayResult.newCash
    liquidAssets = prepayResult.newLiquidAssets
    const newLoanBalance = loanBalance > 0 && loanYear >= 1
      ? Math.max(0, (loanYear <= loan.loanTermYears ? calcLoanYear(loan, loanYear, loanBalance).endingBalance : 0) - prepayResult.prepaymentAmount)
      : 0

    totalRepayment += loanRepaymentAnnual + (disablePrepayment ? 0 : prepayResult.prepaymentAmount)

    const endingAssets = cash + nisaBalance + liquidAssets

    rows.push({
      age,
      workStyle,
      isTakehome: isTakehome || undefined,
      grossIncome,
      businessExpenses,
      deductions,
      incomeTax,
      residentTax,
      businessTax,
      socialInsurance,
      pensionContribution,
      socialInsuranceBreakdown,
      smallBusinessMutual,
      bankruptcyMutual,
      smallBusinessMutualAccumulated,
      bankruptcyMutualAccumulated,
      mutualAidPayoutNet,
      loanRepaymentAnnual,
      housingTaxAnnual,
      housingCostBreakdown,
      livingCostAnnual,
      livingCostBreakdown,
      specialCashflow,
      spouseNetIncome,
      netCashflow,
      investmentContribution,
      retirementDrawdown,
      dividendIncome,
      endingCash: cash,
      endingNisaBalance: nisaBalance,
      endingLiquidAssets: liquidAssets,
      endingAssets,
      loanBalance: newLoanBalance,
      homeOfficeExpenseTotal,
      homeOfficeExpenseBreakdown,
      deductionBreakdown,
    })

    loanBalance = newLoanBalance
  }

  // サマリー生成
  const rate = resolveRate(loan.rateSchedule, 1)
  const currentMonthlyPayment = calcEqualPaymentMonthly(loanPrincipal, rate, loan.loanTermYears * 12)

  const row60 = rows.find((r) => r.age === 60)
  const row65 = rows.find((r) => r.age === 65)
  const balanceAt60 = row60?.loanBalance ?? 0
  const balanceAt65 = row65?.loanBalance ?? 0

  const payoffRow = rows.find((r) => r.loanBalance === 0 && r.age >= loan.startAge)
  const payoffAge = payoffRow ? payoffRow.age : null

  const firstShortageRow = rows.find((r) => r.endingCash < 0)
  const firstShortageAge = firstShortageRow ? firstShortageRow.age : null

  const retirementRows = rows.filter((r) => r.age >= 65)
  let retirementFeasibility: Summary['retirementFeasibility']
  if (firstShortageAge !== null && firstShortageAge >= 65) {
    retirementFeasibility = 'danger'
  } else if (retirementRows.some((r) => r.endingCash < sc.minimumCashBuffer)) {
    retirementFeasibility = 'warning'
  } else {
    retirementFeasibility = 'safe'
  }

  const minimumCashBalance = Math.min(...rows.map((r) => r.endingCash))

  const summary: Summary = {
    currentMonthlyPayment,
    totalRepayment,
    totalInterest,
    balanceAt60,
    balanceAt65,
    payoffAge,
    minimumCashBalance,
    firstShortageAge,
    retirementFeasibility,
  }

  return { summary, rows }
}

/**
 * Compute break-even comparison between scenarios with and without prepayment.
 * Pure function — no side effects, no mutations.
 */
export function computeBreakevenComparison(
  baseResult: SimulationResult,           // 繰上げ返済あり
  withoutPrepaymentResult: SimulationResult, // 繰上げ返済なし
): BreakevenMetrics {
  const rowsWith = baseResult.rows
  const rowsWithout = withoutPrepaymentResult.rows

  const withMap = new Map(rowsWith.map(r => [r.age, r]))

  // Cumulative interest savings by age: 每年的贷款余额差额累加
  const cumulativeInterestSavingsByAge: Array<{ age: number; savings: number }> = []
  let runningSavings = 0
  for (const rowWithout of rowsWithout) {
    const rowWith = withMap.get(rowWithout.age)
    if (rowWith) {
      // 每次提前还款，贷款余额减少 = 节省的利息（近似）
      runningSavings += rowWithout.loanBalance - rowWith.loanBalance
    }
    cumulativeInterestSavingsByAge.push({ age: rowWithout.age, savings: runningSavings })
  }

  // Cash vs loan balance by age
  const cashVsLoanBalanceByAge = rowsWithout.map(rowWithout => {
    const rowWith = withMap.get(rowWithout.age)
    return {
      age: rowWithout.age,
      cashWithPrepayment: rowWith?.endingCash ?? rowWithout.endingCash,
      cashWithoutPrepayment: rowWithout.endingCash,
      loanBalanceWithPrepayment: rowWith?.loanBalance ?? rowWithout.loanBalance,
      loanBalanceWithoutPrepayment: rowWithout.loanBalance,
    }
  })

  const payoffAgeWithout = withoutPrepaymentResult.summary.payoffAge
  const payoffAgeWith = baseResult.summary.payoffAge
  const totalInterestWithout = withoutPrepaymentResult.summary.totalInterest
  const totalInterestWith = baseResult.summary.totalInterest

  return {
    payoffAgeWithoutPrepayment: payoffAgeWithout,
    totalInterestWithoutPrepayment: totalInterestWithout,
    payoffAgeWithPrepayment: payoffAgeWith,
    totalInterestWithPrepayment: totalInterestWith,
    interestSavings: totalInterestWithout - totalInterestWith,
    cumulativeInterestSavingsByAge,
    cashVsLoanBalanceByAge,
  }
}
