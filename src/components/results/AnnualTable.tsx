import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { AnnualRow } from '../../types'

const fmt = (n: number) => Math.round(n / 10000).toLocaleString()
const fmtM = (n: number) => Math.round(n / 10000 / 12 * 10) / 10  // 月次（小数1桁）

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
        <span className="font-medium">{fmt(value)} 万円</span>
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
                <td className="py-1 text-right text-gray-600">-{fmtM(row.businessExpenses)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b border-orange-100 bg-orange-50/50">
              <td className="py-1 pl-3 font-medium text-orange-800">税・社保</td>
              <td className="py-1 text-right font-medium text-orange-800">-{fmtM(totalTax)} 万円/月</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-6 text-gray-400">所得税</td>
              <td className="py-1 text-right text-orange-500">-{fmtM(row.incomeTax)} 万円/月</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-6 text-gray-400">住民税</td>
              <td className="py-1 text-right text-orange-500">-{fmtM(row.residentTax)} 万円/月</td>
            </tr>
            {row.businessTax > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-6 text-gray-400">個人事業税</td>
                <td className="py-1 text-right text-orange-500">-{fmtM(row.businessTax)} 万円/月</td>
              </tr>
            )}
            {row.socialInsuranceBreakdown ? (
              <>
                <tr className="border-b border-gray-100">
                  <td className="py-1 pl-6 text-gray-400">健康保険</td>
                  <td className="py-1 text-right text-orange-400">-{fmtM(row.socialInsuranceBreakdown.healthInsurance)} 万円/月</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 pl-6 text-gray-400">年金</td>
                  <td className="py-1 text-right text-orange-400">-{fmtM(row.socialInsuranceBreakdown.pension + row.pensionContribution)} 万円/月</td>
                </tr>
                {row.socialInsuranceBreakdown.employmentInsurance > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pl-6 text-gray-400">雇用保険</td>
                    <td className="py-1 text-right text-orange-400">-{fmtM(row.socialInsuranceBreakdown.employmentInsurance)} 万円/月</td>
                  </tr>
                )}
              </>
            ) : (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-6 text-gray-400">社会保険</td>
                <td className="py-1 text-right text-orange-400">-{fmtM(row.socialInsurance + row.pensionContribution)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">ローン返済</td>
              <td className="py-1 text-right text-red-600">-{fmtM(row.loanRepaymentAnnual)} 万円/月</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">住宅費</td>
              <td className="py-1 text-right text-red-500">-{fmtM(row.housingTaxAnnual)} 万円/月</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-1 pl-3 text-gray-500">生活費</td>
              <td className="py-1 text-right text-red-500">-{fmtM(row.livingCostAnnual)} 万円/月</td>
            </tr>
            {specialExpense > 0 && (
              <tr className="border-b border-gray-100">
                <td className="py-1 pl-3 text-gray-500">特別支出</td>
                <td className="py-1 text-right text-red-600">-{fmtM(specialExpense)} 万円/月</td>
              </tr>
            )}
            <tr className="border-b-2 border-red-300">
              <td className="py-1 font-semibold text-red-800 pl-1">合計</td>
              <td className="py-1 text-right font-semibold text-red-800">-{fmtM(totalOutgoing)} 万円/月</td>
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
                        <td className="py-1 text-right text-purple-600">-{fmtM(row.bankruptcyMutual)} 万円/月</td>
                      </tr>
                    )}
                    {row.smallBusinessMutual > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1 pl-3 text-gray-500">小規模企業共済</td>
                        <td className="py-1 text-right text-purple-600">-{fmtM(row.smallBusinessMutual)} 万円/月</td>
                      </tr>
                    )}
                  </>
                )}
                {row.investmentContribution > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pl-3 text-gray-500">投資積立（NISA・課税口座）</td>
                    <td className="py-1 text-right text-blue-600">-{fmtM(row.investmentContribution)} 万円/月</td>
                  </tr>
                )}
                <tr className="border-b-2 border-blue-300">
                  <td className="py-1 font-semibold text-blue-800 pl-1">合計</td>
                  <td className="py-1 text-right font-semibold text-blue-800">-{fmtM(totalSavings)} 万円/月</td>
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
            <div className="flex justify-between font-semibold">
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
                <div className="flex justify-between text-purple-700">
                  <span>倒産防止共済</span>
                  <span>{fmt(row.bankruptcyMutualAccumulated)} 万円</span>
                </div>
              )}
              {row.smallBusinessMutualAccumulated > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>小規模企業共済</span>
                  <span>{fmt(row.smallBusinessMutualAccumulated)} 万円</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const COL_COUNT = 19

export function AnnualTable() {
  const { result } = useScenario()
  const { rows, summary } = result
  const [expandedAge, setExpandedAge] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">年次シミュレーション結果</h2>
      <p className="text-xs text-gray-500 px-4 pb-2">単位: 万円　※行をクリックすると月次詳細・資産内訳を表示</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">年齢</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">雇用形態</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">総収入</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">配偶者収入</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">税・社保</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">ローン返済</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">住宅費</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">生活費</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">共済掛金</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">特別CF</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">収支（積立前）</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">投資積立</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">取り崩し</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">配当</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">現金残高</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">NISA</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">課税口座</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">総資産</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">ローン残債</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const totalTax = row.incomeTax + row.residentTax + row.businessTax + row.socialInsurance + row.pensionContribution
              const isHighlight = row.age === 60 || row.age === 65 || row.age === summary.payoffAge
              const isExpanded = expandedAge === row.age

              return (
                <>
                  <tr
                    key={row.age}
                    className={`border-t border-gray-100 cursor-pointer hover:brightness-95 transition-all ${rowClass(row, summary.payoffAge)} ${isHighlight ? 'border-l-4 border-l-blue-400' : ''} ${isExpanded ? 'border-b-0' : ''}`}
                    onClick={() => setExpandedAge(isExpanded ? null : row.age)}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="mr-1 text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                      {row.age}歳
                      {row.age === summary.payoffAge && <span className="ml-1 text-xs text-green-600">完済</span>}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{WORK_STYLE_LABEL[row.workStyle] ?? row.workStyle}</td>
                    <td className="px-3 py-1.5 text-right">{fmt(row.grossIncome)}</td>
                    <td className="px-3 py-1.5 text-right text-teal-600">
                      {row.spouseNetIncome > 0 ? fmt(row.spouseNetIncome) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-orange-700">{fmt(totalTax)}</td>
                    <td className="px-3 py-1.5 text-right text-red-700">{fmt(row.loanRepaymentAnnual)}</td>
                    <td className="px-3 py-1.5 text-right text-red-600">{fmt(row.housingTaxAnnual)}</td>
                    <td className="px-3 py-1.5 text-right text-red-600">{fmt(row.livingCostAnnual)}</td>
                    <td className="px-3 py-1.5 text-right text-purple-700">
                      {(row.smallBusinessMutual + row.bankruptcyMutual) > 0 ? fmt(row.smallBusinessMutual + row.bankruptcyMutual) : '-'}
                    </td>
                    <td className={`px-3 py-1.5 text-right ${row.specialCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.specialCashflow !== 0 ? (row.specialCashflow > 0 ? '+' : '') + fmt(row.specialCashflow) : '-'}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-medium ${row.netCashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {row.netCashflow > 0 ? '+' : ''}{fmt(row.netCashflow)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-blue-600">
                      {row.investmentContribution > 0 ? fmt(row.investmentContribution) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-orange-600">
                      {row.retirementDrawdown > 0 ? fmt(row.retirementDrawdown) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-yellow-600">
                      {row.dividendIncome > 0 ? fmt(row.dividendIncome) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                      {fmt(row.endingCash)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-green-700">
                      {row.endingNisaBalance > 0 ? fmt(row.endingNisaBalance) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-purple-700">
                      {row.endingLiquidAssets > 0 ? fmt(row.endingLiquidAssets) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700">{fmt(row.endingAssets)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{fmt(row.loanBalance)}</td>
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
