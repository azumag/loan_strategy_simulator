import { useScenario } from '../../store/scenario-store'
import { AnnualRow } from '../../types'

const fmt = (n: number) => Math.round(n / 10000).toLocaleString()

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

export function AnnualTable() {
  const { result } = useScenario()
  const { rows, summary } = result

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">年次シミュレーション結果</h2>
      <p className="text-xs text-gray-500 px-4 pb-2">単位: 万円</p>
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
              return (
                <tr
                  key={row.age}
                  className={`border-t border-gray-100 ${rowClass(row, summary.firstShortageAge, summary.payoffAge)} ${isHighlight ? 'border-l-4 border-l-blue-400' : ''}`}
                >
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {row.age}歳
                    {row.age === 60 && <span className="ml-1 text-xs text-blue-600">60</span>}
                    {row.age === 65 && <span className="ml-1 text-xs text-blue-600">65</span>}
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
