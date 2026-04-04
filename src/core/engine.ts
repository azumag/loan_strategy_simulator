import { Scenario, SimulationResult, AnnualRow, Summary } from '../types'
import { calcLoanYear, calcEqualPaymentMonthly, resolveRate } from './loan-calc'
import { calcSoleProprietorTax, calcEmployeeTax, calcRetiredTax } from './tax-calc'
import { resolveCareerStage } from './career-resolver'
import { applyPrepayments } from './prepayment'

export function simulate(scenario: Scenario): SimulationResult {
  const { scenario: sc, loan, careerStages, tax, housing, living, assets, events, strategy } = scenario

  const rows: AnnualRow[] = []
  let cash = assets.initialCash
  let liquidAssets = assets.initialLiquidAssets
  let loanBalance = loan.principal
  let totalRepayment = 0
  let totalInterest = 0

  const housingCostAnnual =
    housing.fixedAssetTaxAnnual +
    housing.cityPlanningTaxAnnual +
    housing.homeInsuranceAnnual +
    housing.maintenanceAnnual +
    housing.otherHousingCostAnnual

  for (let age = sc.startAge; age <= sc.endAge; age++) {
    const loanYear = age - loan.startAge + 1 // ローン開始からの年数

    // 1. キャリアステージ解決
    const stage = resolveCareerStage(age, careerStages)

    // 2. 収入算出
    let grossIncome = 0
    let businessExpenses = 0
    let deductions = 0
    let incomeTax = 0
    let residentTax = 0
    let socialInsurance = 0
    let pensionContribution = 0
    let smallBusinessMutual = 0
    let workStyle: AnnualRow['workStyle'] = 'retired'

    if (stage) {
      workStyle = stage.workStyle
      if (stage.workStyle === 'self_employed') {
        grossIncome = stage.grossRevenueAnnual - stage.businessExpenseAnnual + stage.sideIncomeAnnual
        businessExpenses = stage.businessExpenseAnnual
        const taxResult = calcSoleProprietorTax(stage, tax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        socialInsurance = taxResult.socialInsurance
        pensionContribution = taxResult.pensionContribution
        smallBusinessMutual = taxResult.smallBusinessMutual
      } else if (stage.workStyle === 'employee') {
        const sal = stage.salaryInputMode === 'takehome'
          ? (stage.takehomeSalaryAnnual ?? 0) + stage.bonusAnnual
          : (stage.grossSalaryAnnual ?? 0) + stage.bonusAnnual + stage.sideIncomeAnnual
        grossIncome = sal
        const taxResult = calcEmployeeTax(stage, tax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        socialInsurance = taxResult.socialInsurance
      } else if (stage.workStyle === 'retired') {
        grossIncome = stage.retirementNationalPensionAnnual +
          stage.retirementEmployeesPensionAnnual +
          stage.retirementOtherIncomeAnnual
        const taxResult = calcRetiredTax(stage, tax)
        deductions = taxResult.deductions
        incomeTax = taxResult.incomeTax
        residentTax = taxResult.residentTax
        socialInsurance = taxResult.socialInsurance
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
    const baseLivingCost = monthlyLiving * 12 + living.educationCostAnnual + living.carCostAnnual + living.otherFixedCostAnnual
    const livingCostAnnual = baseLivingCost * inflationFactor

    // 7. 特別イベント
    let specialCashflow = 0
    for (const event of events) {
      if (event.age === age) {
        specialCashflow += event.type === 'income' ? event.amount : -event.amount
      }
    }

    // 8. 年間収支
    const totalTaxBurden = incomeTax + residentTax + socialInsurance + pensionContribution
    const netCashflow =
      grossIncome -
      totalTaxBurden -
      loanRepaymentAnnual -
      housingTaxAnnual -
      livingCostAnnual +
      specialCashflow

    // 9. 現金・資産更新
    cash += netCashflow

    // 資産運用利回り適用
    if (sc.investmentReturnRate > 0) {
      liquidAssets *= (1 + sc.investmentReturnRate)
    }

    // 10. 繰上返済
    const prepayResult = applyPrepayments({
      age,
      loanBalance,
      cash,
      liquidAssets,
      minimumCashBuffer: sc.minimumCashBuffer,
      strategy,
    })
    cash = prepayResult.newCash
    liquidAssets = prepayResult.newLiquidAssets
    const newLoanBalance = loanBalance > 0 && loanYear >= 1
      ? Math.max(0, (loanYear <= loan.loanTermYears ? calcLoanYear(loan, loanYear, loanBalance).endingBalance : 0) - prepayResult.prepaymentAmount)
      : 0

    totalRepayment += loanRepaymentAnnual + prepayResult.prepaymentAmount

    const endingAssets = cash + liquidAssets

    rows.push({
      age,
      workStyle,
      grossIncome,
      businessExpenses,
      deductions,
      incomeTax,
      residentTax,
      socialInsurance,
      pensionContribution,
      smallBusinessMutual,
      loanRepaymentAnnual,
      housingTaxAnnual,
      livingCostAnnual,
      specialCashflow,
      netCashflow,
      endingCash: cash,
      endingAssets,
      loanBalance: newLoanBalance,
    })

    loanBalance = newLoanBalance
  }

  // サマリー生成
  const rate = resolveRate(loan.rateSchedule, 1)
  const currentMonthlyPayment = calcEqualPaymentMonthly(loan.principal, rate, loan.loanTermYears * 12)

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
