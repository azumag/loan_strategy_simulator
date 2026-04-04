import { useScenario } from '../../store/scenario-store'

export function BasicConditionForm() {
  const { scenario, dispatch } = useScenario()
  const sc = scenario.scenario

  const update = (key: keyof typeof sc, value: string | number) =>
    dispatch({ type: 'UPDATE_SCENARIO', payload: { [key]: value } })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">基本条件</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">シナリオ名</label>
          <input
            type="text"
            value={sc.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">最低現金バッファ（万円）</label>
          <input
            type="number"
            value={sc.minimumCashBuffer / 10000}
            onChange={(e) => update('minimumCashBuffer', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">シミュレーション開始年齢</label>
          <input
            type="number"
            value={sc.startAge}
            onChange={(e) => update('startAge', Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={18}
            max={99}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">シミュレーション終了年齢</label>
          <input
            type="number"
            value={sc.endAge}
            onChange={(e) => update('endAge', Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={18}
            max={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">運用利回り（%）</label>
          <input
            type="number"
            value={(sc.investmentReturnRate * 100).toFixed(1)}
            onChange={(e) => update('investmentReturnRate', Number(e.target.value) / 100)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            step={0.1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">インフレ率（%）</label>
          <input
            type="number"
            value={(sc.inflationRate * 100).toFixed(1)}
            onChange={(e) => update('inflationRate', Number(e.target.value) / 100)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            step={0.1}
          />
        </div>
      </div>
    </div>
  )
}
