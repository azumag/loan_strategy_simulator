import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { AnnualRow } from '../../types'

const fmt = (n: number) => Math.round(n / 10000).toLocaleString()
const fmtM = (n: number) => Math.round(n / 10000 / 12 * 10) / 10  // 月次（小数1桁）

function rowClass(row: AnnualRow, firstShortageAge: number | null, payoffAge: number | null) {
  if (row.endingCash < 0 || (firstShortageAge !== null && row.age >= firstShortageAge && row.endingCash < 0)) {
    return 'bg-red-50'
  }
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
  const totalTax = row.incomeTax + row.residentTax + row.socialInsurance + row.pensionContribution
  const netWorth = row.endingAssets - row.loanBalance

  const monthlyItems = [
    { label: '収入', value: fmtM(row.grossIncome), color: 'text-green-700' },
    { label: '税・社保', value: `-${fmtM(totalTax)}`, color: 'text-orange-600' },
    { label: 'ローン返済', value: `-${fmtM(row.loanRepaymentAnnual)}`, color: 'text-red-600' },
    { label: '住宅費', value: `-${fmtM(row.housingTaxAnnual)}`, color: 'text-red-500' },
    { label: '生活費', value: `-${fmtM(row.livingCostAnnual)}`, color: 'text-red-500' },
    { label: '投資積立', value: row.investmentContribution > 0 ? `-${fmtM(row.investmentContribution)}` : '-', color: 'text-blue-600' },
    {
      label: '月次収支',
      value: `${fmtM(row.netCashflow) >= 0 ? '+' : ''}${fmtM(row.netCashflow)}`,
      color: row.netCashflow >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold',
    },
  ]

  return (
    <div className="bg-gray-50 border-t border-blue-200 px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 月次収支内訳 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">月次収支内訳（年÷12 概算）</p>
        <table className="w-full text-xs">
          <tbody>
            {monthlyItems.map(({ label, value, color }) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="py-1 text-gray-500">{label}</td>
                <td className={`py-1 text-right ${color}`}>{value} 万円/月</td>
              </tr>
            ))}
          </tbody>
        </table>
        {row.specialCashflow !== 0 && (
          <p className={`text-xs mt-1 ${row.specialCashflow > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ※ 特別CF {row.specialCashflow > 0 ? '+' : ''}{fmt(row.specialCashflow)} 万円（年間）を含む
          </p>
        )}
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
        </div>
      </div>
    </div>
  )
}

const COL_COUNT = 15

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
              <th className="px-3 py-2 text-right whitespace-nowrap">税・社保</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">ローン返済</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">住宅費</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">生活費</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">特別CF</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">年間収支</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">積立</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">現金残高</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">NISA</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">課税口座</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">総資産</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">ローン残債</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const totalTax = row.incomeTax + row.residentTax + row.socialInsurance + row.pensionContribution
              const isHighlight = row.age === 60 || row.age === 65 || row.age === summary.payoffAge
              const isShortage = row.endingCash < 0
              const isExpanded = expandedAge === row.age

              return (
                <>
                  <tr
                    key={row.age}
                    className={`border-t border-gray-100 cursor-pointer hover:brightness-95 transition-all ${rowClass(row, summary.firstShortageAge, summary.payoffAge)} ${isHighlight ? 'border-l-4 border-l-blue-400' : ''} ${isExpanded ? 'border-b-0' : ''}`}
                    onClick={() => setExpandedAge(isExpanded ? null : row.age)}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="mr-1 text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                      {row.age}歳
                      {row.age === summary.payoffAge && <span className="ml-1 text-xs text-green-600">完済</span>}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{WORK_STYLE_LABEL[row.workStyle] ?? row.workStyle}</td>
                    <td className="px-3 py-1.5 text-right">{fmt(row.grossIncome)}</td>
                    <td className="px-3 py-1.5 text-right text-orange-700">{fmt(totalTax)}</td>
                    <td className="px-3 py-1.5 text-right text-red-700">{fmt(row.loanRepaymentAnnual)}</td>
                    <td className="px-3 py-1.5 text-right text-red-600">{fmt(row.housingTaxAnnual)}</td>
                    <td className="px-3 py-1.5 text-right text-red-600">{fmt(row.livingCostAnnual)}</td>
                    <td className={`px-3 py-1.5 text-right ${row.specialCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.specialCashflow !== 0 ? (row.specialCashflow > 0 ? '+' : '') + fmt(row.specialCashflow) : '-'}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-medium ${row.netCashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {row.netCashflow > 0 ? '+' : ''}{fmt(row.netCashflow)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-blue-600">
                      {row.investmentContribution > 0 ? fmt(row.investmentContribution) : '-'}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-semibold ${isShortage ? 'text-red-700' : 'text-gray-900'}`}>
                      {isShortage ? '⚠ ' : ''}{fmt(row.endingCash)}
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
