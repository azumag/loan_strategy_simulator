import { useScenario } from '../../store/scenario-store'

export function Header() {
  const { scenario, result } = useScenario()
  const { summary } = result
  const monthly = Math.round(summary.currentMonthlyPayment).toLocaleString()
  const payoff = summary.payoffAge ? `${summary.payoffAge}歳` : '未完済'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">ローン返済戦略シミュレータ</h1>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>月返済: <span className="font-semibold text-gray-900">¥{monthly}</span></span>
          <span>完済: <span className="font-semibold text-gray-900">{payoff}</span></span>
          {summary.firstShortageAge && (
            <span className="text-red-600 font-semibold">⚠ {summary.firstShortageAge}歳で資金ショート</span>
          )}
          <span className="text-xs text-gray-500">{scenario.scenario.name}</span>
        </div>
      </div>
    </header>
  )
}
