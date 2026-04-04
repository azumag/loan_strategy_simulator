import { useScenario } from '../../store/scenario-store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const fmtMan = (n: number) => `${Math.round(n / 10000).toLocaleString()}万円`

export function SummaryCard() {
  const { result } = useScenario()
  const { summary } = result

  const feasibilityColor = {
    safe: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-red-600 bg-red-50',
  }[summary.retirementFeasibility]

  const feasibilityLabel = {
    safe: '安全',
    warning: '注意',
    danger: '危険',
  }[summary.retirementFeasibility]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">サマリー</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">月返済額</div>
          <div className="text-lg font-bold text-gray-900">¥{fmt(summary.currentMonthlyPayment)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">総返済額</div>
          <div className="text-lg font-bold text-gray-900">{fmtMan(summary.totalRepayment)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">総利息</div>
          <div className="text-lg font-bold text-gray-900">{fmtMan(summary.totalInterest)}</div>
        </div>
        <div className={`rounded-lg p-3 ${feasibilityColor}`}>
          <div className="text-xs mb-1">老後判定</div>
          <div className="text-lg font-bold">{feasibilityLabel}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">60歳時残債</div>
          <div className="text-lg font-bold text-gray-900">{fmtMan(summary.balanceAt60)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">65歳時残債</div>
          <div className="text-lg font-bold text-gray-900">{fmtMan(summary.balanceAt65)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">完済年齢</div>
          <div className="text-lg font-bold text-gray-900">
            {summary.payoffAge ? `${summary.payoffAge}歳` : '未完済'}
          </div>
        </div>
        <div className={`rounded-lg p-3 ${summary.firstShortageAge ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className={`text-xs mb-1 ${summary.firstShortageAge ? 'text-red-600' : 'text-green-600'}`}>
            資金ショート
          </div>
          <div className={`text-lg font-bold ${summary.firstShortageAge ? 'text-red-700' : 'text-green-700'}`}>
            {summary.firstShortageAge ? `${summary.firstShortageAge}歳` : 'なし'}
          </div>
        </div>
      </div>
    </div>
  )
}
