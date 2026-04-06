import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { AnnualRow } from '../../types'

const fmt = (n: number) => Math.round(n / 10000).toLocaleString()
const fmtM = (n: number) => Math.round(n / 10000 / 12 * 10) / 10  // 月次（小数1桁）
const fmtMan = (n: number) => (Math.round(n / 10000)).toLocaleString()  // 万円（年額）
// 負の表示用: 0 のときは "-0" にならないよう "0" を返す
const negM = (n: number) => { const v = Math.round(n / 10000 / 12 * 10) / 10; return v === 0 ? '0' : `-${v}` }
const negMan = (n: number) => { const v = Math.round(n / 10000); return v === 0 ? '0' : `-${v.toLocaleString()}` }

function rowClass(row: AnnualRow, payoffAge: number | null) {
  if (row.age === 60 || row.age === 65 || row.age === payoffAge) {
    return 'bg-blue-50 font-semibold'
  }
  return row.age % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
}

const WORK_STYLE_LABEL: Record<string, string> = {
  self_employed: '個人事業',
  employee: '会社員',
  retired: '退職後',
}

function AssetBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{fmt(value)} 万円</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function DetailPanel({ row }: { row: AnnualRow }) {
  const totalTax = row.incomeTax + row.residentTax + row.businessTax + row.socialInsurance + row.pensionContribution
  const totalMutual = row.smallBusinessMutual + row.bankruptcyMutual
  const netWorth = row.endingAssets - row.loanBalance

  const specialIncome = row.specialCashflow > 0 ? row.specialCashflow : 0
  const specialExpense = row.specialCashflow < 0 ? -row.specialCashflow : 0

  // 入るお金
  const totalIncome = row.grossIncome + row.spouseNetIncome + row.retirementDrawdown + row.dividendIncome + specialIncome
  // 出ていくお金（税・ローン・住宅費・生活費・特別支出）
  const totalOutgoing = row.businessExpenses + totalTax + row.loanRepaymentAnnual + row.housingTaxAnnual + row.livingCostAnnual + specialExpense
  // 貯めるお金（共済掛金 + 投資積立）
  const totalSavings = totalMutual + row.investmentContribution
  // 最終合計
  const netTotal = totalIncome - totalOutgoing - totalSavings

  // Collapsible sections state (all closed by default)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (key: string) => setOpen(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  // Helper: indicator character
  const ind = (key: string) => open.has(key) ? '▾' : '▸'

  return (
    <div className="bg-gray-50 border-t border-blue-200 px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 月次収支内訳 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">月次収支内訳（年÷12 概算）</p>
        <table className="w-full text-xs">
          <tbody>
            {/* ── 入るお金 ── */}
            <tr className="bg-green-50">
              <td className="py-1 font-semibold text-green-800" colSpan={2}>入るお金</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">収入（本人）</td>
              <td className="py-1 text-right text-green-700">+{fmtM(row.grossIncome)} 万円/月</td>
            </tr>
            {row.spouseNetIncome > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">収入（配偶者・手取）</td>
                <td className="py-1 text-right text-teal-600">+{fmtM(row.spouseNetIncome)} 万円/月</td>
              </tr>
            )}
            {row.retirementDrawdown > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">資産取り崩し</td>
                <td className="py-1 text-right text-orange-600">+{fmtM(row.retirementDrawdown)} 万円/月</td>
              </tr>
            )}
            {row.dividendIncome > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">配当収入（税引後）</td>
                <td className="py-1 text-right text-yellow-600">+{fmtM(row.dividendIncome)} 万円/月</td>
              </tr>
            )}
            {specialIncome > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">特別収入</td>
                <td className="py-1 text-right text-green-600">+{fmtM(specialIncome)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b-2 border-green-300">
              <td className="py-1 font-semibold text-green-800 pl-1">合計</td>
              <td className="py-1 text-right font-semibold text-green-800">+{fmtM(totalIncome)} 万円/月</td>
            </tr>

            {/* ── 出ていくお金 ── */}
            <tr className="bg-red-50 mt-1">
              <td className="py-1 font-semibold text-red-800 pt-2" colSpan={2}>出ていくお金</td>
            </tr>
            {row.businessExpenses > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">経費</td>
                <td className="py-1 text-right text-gray-600">{negM(row.businessExpenses)} 万円/月</td>
              </tr>
            )}
            {row.homeOfficeExpenseTotal > 0 && (
              <>
                <tr className="border-b border-gray-100">
                  <td className="py-1 pl-6 text-gray-500">うち家事按分</td>
                  <td className="py-1 text-right text-teal-600">{fmtM(row.homeOfficeExpenseTotal)} 万円/月</td>
                </tr>
                {row.homeOfficeExpenseBreakdown?.housing && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">住居費按分（固定資産税等）</td>
                    <td className="py-0.5 text-right text-xs text-teal-500">{fmtM(row.homeOfficeExpenseBreakdown.housing)} 万円/月</td>
                  </tr>
                )}
                {row.homeOfficeExpenseBreakdown?.interest && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">住宅ローン利息按分</td>
                    <td className="py-0.5 text-right text-xs text-teal-500">{fmtM(row.homeOfficeExpenseBreakdown.interest)} 万円/月</td>
                  </tr>
                )}
                {row.homeOfficeExpenseBreakdown?.depreciation && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">建物減価償却費按分</td>
                    <td className="py-0.5 text-right text-xs text-teal-500">{fmtM(row.homeOfficeExpenseBreakdown.depreciation)} 万円/月</td>
                  </tr>
                )}
                {row.homeOfficeExpenseBreakdown?.utility && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">光熱費按分</td>
                    <td className="py-0.5 text-right text-xs text-teal-500">{fmtM(row.homeOfficeExpenseBreakdown.utility)} 万円/月</td>
                  </tr>
                )}
              </>
            )}
            <tr className="border-b border-orange-100 bg-orange-50/50">
              <td className="py-1 pl-3 font-medium text-orange-800">税・社保</td>
              <td className="py-1 text-right font-medium text-orange-800">{negM(totalTax)} 万円/月</td>
            </tr>
            <tr className={`border-b border-gray-100 ${row.deductionBreakdown ? 'cursor-pointer select-none hover:bg-orange-50/30' : ''}`} onClick={() => row.deductionBreakdown && toggle('incomeTax')}>
              <td className="py-1 pl-6 text-gray-400">
                所得税 {row.deductionBreakdown ? <span className="text-gray-300">{ind('incomeTax')}</span> : null}
              </td>
              <td className="py-1 text-right text-orange-500">{negM(row.incomeTax)} 万円/月</td>
            </tr>
            {open.has('incomeTax') && row.deductionBreakdown && (
              <>
                <tr className="border-b border-gray-50 bg-amber-50/30">
                  <td className="py-0.5 pl-9 text-xs text-gray-400" colSpan={2}>── 課税所得の計算 ──</td>
                </tr>
                {row.deductionBreakdown.employment != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">給与所得控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.employment)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.bluePenalty != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">青色申告特別控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.bluePenalty)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.socialInsuranceDeduction > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">社会保険料控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.socialInsuranceDeduction)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.smallBizMutual != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">共済掛金控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.smallBizMutual)} 万円</td>
                  </tr>
                )}
                <tr className="border-b border-gray-50">
                  <td className="py-0.5 pl-9 text-xs text-gray-400">基礎控除</td>
                  <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.basic)} 万円</td>
                </tr>
                {row.deductionBreakdown.spouse != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">配偶者控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.spouse)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.dependent != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">扶養控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.dependent)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.lifeInsurance != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">生命保険料控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.lifeInsurance)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.earthquake != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">地震保険料控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.earthquake)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.medical != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">医療費控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.medical)} 万円</td>
                  </tr>
                )}
                {row.deductionBreakdown.other != null && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">その他控除</td>
                    <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.deductionBreakdown.other)} 万円</td>
                  </tr>
                )}
                <tr className="border-b border-gray-100 bg-amber-50/50">
                  <td className="py-0.5 pl-9 text-xs font-medium text-gray-500">課税所得</td>
                  <td className="py-0.5 text-right text-xs font-medium text-gray-700">{fmtMan(row.deductionBreakdown.taxableIncome)} 万円</td>
                </tr>
                {row.deductionBreakdown.housingLoanCredit != null && (
                  <>
                    <tr className="border-b border-gray-50">
                      <td className="py-0.5 pl-9 text-xs text-gray-400">所得税（控除前）</td>
                      <td className="py-0.5 text-right text-xs text-orange-400">{fmtMan(row.deductionBreakdown.incomeTaxBeforeCredit)} 万円</td>
                    </tr>
                    <tr className="border-b border-gray-50 bg-green-50/50">
                      <td className="py-0.5 pl-9 text-xs text-green-700 font-medium">住宅ローン控除（税額控除）</td>
                      <td className="py-0.5 text-right text-xs text-green-700 font-medium">{negMan(row.deductionBreakdown.housingLoanCredit)} 万円</td>
                    </tr>
                  </>
                )}
              </>
            )}
            <tr className={`border-b border-gray-100 ${row.deductionBreakdown ? 'cursor-pointer select-none hover:bg-orange-50/30' : ''}`} onClick={() => row.deductionBreakdown && toggle('residentTax')}>
              <td className="py-1 pl-6 text-gray-400">
                住民税 {row.deductionBreakdown ? <span className="text-gray-300">{ind('residentTax')}</span> : null}
              </td>
              <td className="py-1 text-right text-orange-500">{negM(row.residentTax)} 万円/月</td>
            </tr>
            {open.has('residentTax') && row.deductionBreakdown && (
              <>
                <tr className="border-b border-gray-50">
                  <td className="py-0.5 pl-9 text-xs text-gray-400">課税所得（所得税と同じ）</td>
                  <td className="py-0.5 text-right text-xs text-gray-500">{fmtMan(row.deductionBreakdown.taxableIncome)} 万円</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-0.5 pl-9 text-xs text-gray-400">所得割 × 10%</td>
                  <td className="py-0.5 text-right text-xs text-amber-600">{negMan(Math.round(row.deductionBreakdown.taxableIncome * 0.1))} 万円</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-0.5 pl-9 text-xs text-gray-400">均等割（概算）</td>
                  <td className="py-0.5 text-right text-xs text-amber-600">-0 万円</td>
                </tr>
              </>
            )}
            {row.businessTax > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-6 text-gray-400">個人事業税</td>
                <td className="py-1 text-right text-orange-500">{negM(row.businessTax)} 万円/月</td>
              </tr>
            )}
            {row.socialInsuranceBreakdown ? (
              <>
                {/* 健康保険 - collapsible */}
                <tr className="border-b border-gray-100 cursor-pointer select-none hover:bg-orange-50/30" onClick={() => toggle('healthInsurance')}>
                  <td className="py-1 pl-6 text-gray-400">
                    健康保険 <span className="text-gray-300">{ind('healthInsurance')}</span>
                  </td>
                  <td className="py-1 text-right text-orange-400">{negM(row.socialInsuranceBreakdown.healthInsurance)} 万円/月</td>
                </tr>
                {open.has('healthInsurance') && (() => {
                  const si = row.socialInsuranceBreakdown!
                  if (si.standardMonthlyRemuneration != null) {
                    // 会社員・マイクロ法人: 標準報酬月額ベース
                    const stdMonthly = si.standardMonthlyRemuneration
                    const hiMonthly = Math.floor(stdMonthly * 0.04985)
                    return (
                      <>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">標準報酬月額</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">{fmtMan(stdMonthly)} 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">料率（協会けんぽ東京）</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">4.985%</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">月額 × 12ヶ月</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">{hiMonthly.toLocaleString()} 円 × 12</td>
                        </tr>
                      </>
                    )
                  } else if (si.netBusinessIncomeForNHI != null) {
                    // 自営業: 国民健康保険
                    const base = Math.max(0, si.netBusinessIncomeForNHI - 430_000)
                    const incomeLevy = Math.floor(base * 0.085)
                    const cap = 1_020_000
                    return (
                      <>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">所得割基礎額（所得 - 43万）</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">{fmtMan(base)} 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">所得割 × 8.5%</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">{negMan(incomeLevy)} 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">均等割（概算）</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">-5 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">上限 {fmtMan(cap)} 万円</td>
                          <td className="py-0.5 text-right text-xs text-gray-400">合計（上限適用後）</td>
                        </tr>
                      </>
                    )
                  }
                  return null
                })()}

                {/* 年金 - collapsible */}
                <tr className="border-b border-gray-100 cursor-pointer select-none hover:bg-orange-50/30" onClick={() => toggle('pension')}>
                  <td className="py-1 pl-6 text-gray-400">
                    年金 <span className="text-gray-300">{ind('pension')}</span>
                  </td>
                  <td className="py-1 text-right text-orange-400">{negM(row.socialInsuranceBreakdown.pension + row.pensionContribution)} 万円/月</td>
                </tr>
                {open.has('pension') && (() => {
                  const si = row.socialInsuranceBreakdown!
                  if (si.standardMonthlyRemuneration != null) {
                    // 会社員・マイクロ法人: 厚生年金
                    const stdMonthly = Math.min(si.standardMonthlyRemuneration, 650_000)
                    const pensionMonthly = Math.floor(stdMonthly * 0.0915)
                    return (
                      <>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">標準報酬月額（上限65万）</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">{fmtMan(stdMonthly)} 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">料率（厚生年金）</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">9.15%</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">月額 × 12ヶ月</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">{pensionMonthly.toLocaleString()} 円 × 12</td>
                        </tr>
                      </>
                    )
                  } else {
                    // 自営業: 国民年金
                    return (
                      <>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">国民年金 16,980円/月（2024年度）</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">-20 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">× 12ヶ月</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">16,980 × 12</td>
                        </tr>
                      </>
                    )
                  }
                })()}

                {/* 雇用保険 - collapsible */}
                {row.socialInsuranceBreakdown.employmentInsurance > 0 && (
                  <>
                    <tr className="border-b border-gray-100 cursor-pointer select-none hover:bg-orange-50/30" onClick={() => toggle('employmentInsurance')}>
                      <td className="py-1 pl-6 text-gray-400">
                        雇用保険 <span className="text-gray-300">{ind('employmentInsurance')}</span>
                      </td>
                      <td className="py-1 text-right text-orange-400">{negM(row.socialInsuranceBreakdown.employmentInsurance)} 万円/月</td>
                    </tr>
                    {open.has('employmentInsurance') && row.socialInsuranceBreakdown.annualSalaryBase != null && (
                      <>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">社保基準年収</td>
                          <td className="py-0.5 text-right text-xs text-gray-500">{fmtMan(row.socialInsuranceBreakdown.annualSalaryBase)} 万円</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-0.5 pl-9 text-xs text-gray-400">料率 0.6%</td>
                          <td className="py-0.5 text-right text-xs text-amber-600">{negMan(row.socialInsuranceBreakdown.employmentInsurance)} 万円</td>
                        </tr>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-6 text-gray-400">社会保険</td>
                <td className="py-1 text-right text-orange-400">{negM(row.socialInsurance + row.pensionContribution)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">ローン返済</td>
              <td className="py-1 text-right text-red-600">{negM(row.loanRepaymentAnnual)} 万円/月</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">住宅費</td>
              <td className="py-1 text-right text-red-500">{negM(row.housingTaxAnnual)} 万円/月</td>
            </tr>
            <tr className={`border-b border-gray-100 ${row.livingCostBreakdown ? 'cursor-pointer select-none hover:bg-red-50/30' : ''}`} onClick={() => row.livingCostBreakdown && toggle('living')}>
              <td className="py-1 pl-3 text-gray-500">
                生活費 {row.livingCostBreakdown ? <span className="text-gray-300">{ind('living')}</span> : null}
              </td>
              <td className="py-1 text-right text-red-500">{negM(row.livingCostAnnual)} 万円/月</td>
            </tr>
            {open.has('living') && row.livingCostBreakdown && (
              <>
                {row.livingCostBreakdown.base > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">基本生活費</td>
                    <td className="py-0.5 text-right text-xs text-red-400">{negM(row.livingCostBreakdown.base)} 万円/月</td>
                  </tr>
                )}
                {row.livingCostBreakdown.utility > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">光熱費</td>
                    <td className="py-0.5 text-right text-xs text-red-400">{negM(row.livingCostBreakdown.utility)} 万円/月</td>
                  </tr>
                )}
                {row.livingCostBreakdown.education > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">教育費</td>
                    <td className="py-0.5 text-right text-xs text-red-400">{negM(row.livingCostBreakdown.education)} 万円/月</td>
                  </tr>
                )}
                {row.livingCostBreakdown.car > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">車維持費</td>
                    <td className="py-0.5 text-right text-xs text-red-400">{negM(row.livingCostBreakdown.car)} 万円/月</td>
                  </tr>
                )}
                {row.livingCostBreakdown.other > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-0.5 pl-9 text-xs text-gray-400">その他固定費</td>
                    <td className="py-0.5 text-right text-xs text-red-400">{negM(row.livingCostBreakdown.other)} 万円/月</td>
                  </tr>
                )}
              </>
            )}
            {specialExpense > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">特別支出</td>
                <td className="py-1 text-right text-red-600">{negM(specialExpense)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b-2 border-red-300">
              <td className="py-1 font-semibold text-red-800 pl-1">合計</td>
              <td className="py-1 text-right font-semibold text-red-800">{negM(totalOutgoing)} 万円/月</td>
            </tr>

            {/* ── 貯めるお金 ── */}
            {totalSavings > 0 && (
              <>
                <tr className="bg-blue-50">
                  <td className="py-1 font-semibold text-blue-800 pt-2" colSpan={2}>貯めるお金（投資・共済）</td>
                </tr>
                {totalMutual > 0 && (
                  <>
                    {row.bankruptcyMutual > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pl-3 text-gray-500">倒産防止共済</td>
                        <td className="py-1 text-right text-purple-600">{negM(row.bankruptcyMutual)} 万円/月</td>
                      </tr>
                    )}
                    {row.smallBusinessMutual > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pl-3 text-gray-500">小規模企業共済</td>
                        <td className="py-1 text-right text-purple-600">{negM(row.smallBusinessMutual)} 万円/月</td>
                      </tr>
                    )}
                  </>
                )}
                {row.investmentContribution > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pl-3 text-gray-500">投資積立（NISA・課税口座）</td>
                    <td className="py-1 text-right text-blue-600">{negM(row.investmentContribution)} 万円/月</td>
                  </tr>
                )}
                <tr className="border-b-2 border-blue-300">
                  <td className="py-1 font-semibold text-blue-800 pl-1">合計</td>
                  <td className="py-1 text-right font-semibold text-blue-800">{negM(totalSavings)} 万円/月</td>
                </tr>
              </>
            )}

            {/* ── 最終合計 ── */}
            <tr className="border-t-2 border-gray-400 bg-gray-100">
              <td className="py-1.5 font-bold text-gray-900">月次収支（手残り）</td>
              <td className={`py-1.5 text-right font-bold ${netTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netTotal >= 0 ? '+' : ''}{fmtM(netTotal)} 万円/月
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 総資産内訳 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">年末資産内訳</p>
        <div className="space-y-2">
          <AssetBar label="現金" value={row.endingCash} total={row.endingAssets} color="bg-blue-400" />
          {row.endingNisaBalance > 0 && (
            <AssetBar label="NISA（非課税）" value={row.endingNisaBalance} total={row.endingAssets} color="bg-green-400" />
          )}
          {row.endingLiquidAssets > 0 && (
            <AssetBar label="課税口座" value={row.endingLiquidAssets} total={row.endingAssets} color="bg-purple-400" />
          )}
          <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-gray-900">
              <span>総資産</span>
              <span>{fmt(row.endingAssets)} 万円</span>
            </div>
            {row.loanBalance > 0 && (
              <div className="flex justify-between text-red-600">
                <span>ローン残債</span>
                <span>−{fmt(row.loanBalance)} 万円</span>
              </div>
            )}
            <div className={`flex justify-between font-bold ${netWorth >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>純資産</span>
              <span>{netWorth >= 0 ? '' : '−'}{fmt(Math.abs(netWorth))} 万円</span>
            </div>
          </div>
          {(row.smallBusinessMutualAccumulated > 0 || row.bankruptcyMutualAccumulated > 0) && (
            <div className="border-t border-purple-200 pt-2 mt-2 space-y-1 text-xs">
              <p className="font-semibold text-purple-800">共済積立累計（別枠）</p>
              {row.bankruptcyMutualAccumulated > 0 && (
                <div className="flex justify-between">
                  <span className="text-purple-700">倒産防止共済</span>
                  <span className="text-purple-700">{fmt(row.bankruptcyMutualAccumulated)} 万円</span>
                </div>
              )}
              {row.smallBusinessMutualAccumulated > 0 && (
                <div className="flex justify-between">
                  <span className="text-purple-700">小規模企業共済</span>
                  <span className="text-purple-700">{fmt(row.smallBusinessMutualAccumulated)} 万円</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const COL_COUNT = 12

export function AnnualTable() {
  const { result } = useScenario()
  const { rows, summary } = result
  const [expandedAge, setExpandedAge] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">年次シミュレーション結果</h2>
      <p className="text-xs text-gray-500 px-4 pb-2">単位: 万円　※行をクリックすると詳細を表示</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left whitespace-nowrap">年齢</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">形態</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">総収入</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">税・社保</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">ローン</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">住宅費</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">生活費</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">収支</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">現金残高</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">投資残高</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">総資産</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">ローン残債</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const totalTax = row.incomeTax + row.residentTax + row.businessTax + row.socialInsurance + row.pensionContribution
              const totalMutual = row.smallBusinessMutual + row.bankruptcyMutual
              const investmentBalance = row.endingNisaBalance + row.endingLiquidAssets
              // 収支 = 入るお金 - 出ていくお金 - 貯めるお金
              const totalOutgoing = row.businessExpenses + totalTax + row.loanRepaymentAnnual + row.housingTaxAnnual + row.livingCostAnnual + (row.specialCashflow < 0 ? -row.specialCashflow : 0)
              const specialIncome = row.specialCashflow > 0 ? row.specialCashflow : 0
              const totalIncome = row.grossIncome + row.spouseNetIncome + row.retirementDrawdown + row.dividendIncome + specialIncome
              const totalSavings = totalMutual + row.investmentContribution
              const netTotal = totalIncome - totalOutgoing - totalSavings
              const isHighlight = row.age === 60 || row.age === 65 || row.age === summary.payoffAge
              const isExpanded = expandedAge === row.age

              return (
                <>
                  <tr
                    key={row.age}
                    className={`border-t border-gray-100 cursor-pointer hover:brightness-95 transition-all ${rowClass(row, summary.payoffAge)} ${isHighlight ? 'border-l-4 border-l-blue-400' : ''} ${isExpanded ? 'border-b-0' : ''}`}
                    onClick={() => setExpandedAge(isExpanded ? null : row.age)}
                  >
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className="mr-1 text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                      {row.age}歳
                      {row.age === summary.payoffAge && <span className="ml-1 text-xs text-green-600">完済</span>}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-gray-600">{WORK_STYLE_LABEL[row.workStyle] ?? row.workStyle}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(row.grossIncome)}</td>
                    <td className="px-2 py-1.5 text-right text-orange-700">{fmt(totalTax)}</td>
                    <td className="px-2 py-1.5 text-right text-red-700">{fmt(row.loanRepaymentAnnual)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmt(row.housingTaxAnnual)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmt(row.livingCostAnnual)}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${netTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {netTotal > 0 ? '+' : ''}{fmt(netTotal)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-gray-900">
                      {fmt(row.endingCash)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-green-700">
                      {investmentBalance > 0 ? fmt(investmentBalance) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right text-gray-700">{fmt(row.endingAssets)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmt(row.loanBalance)}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`detail-${row.age}`} className="border-b border-blue-200">
                      <td colSpan={COL_COUNT} className="p-0">
                        <DetailPanel row={row} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
