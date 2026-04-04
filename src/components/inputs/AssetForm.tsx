import { useScenario } from '../../store/scenario-store'

export function AssetForm() {
  const { scenario, dispatch } = useScenario()
  const assets = scenario.assets

  const update = (key: keyof typeof assets, value: number) =>
    dispatch({ type: 'UPDATE_ASSETS', payload: { [key]: value } })

  const fields: { key: keyof typeof assets; label: string }[] = [
    { key: 'initialCash', label: '初期現金（万円）' },
    { key: 'initialLiquidAssets', label: '流動資産（万円）' },
    { key: 'initialSemiLiquidAssets', label: '準流動資産（万円）' },
    { key: 'initialRetirementAssets', label: '退職金見込み（万円）' },
    { key: 'annualSavingsContribution', label: '年間追加積立（万円）' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">資産・防衛資金</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              value={(assets[key] as number) / 10000}
              onChange={(e) => update(key, Number(e.target.value) * 10000)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">緊急時使用可能割合（%）</label>
          <input
            type="number"
            value={assets.emergencyUsableRatio * 100}
            onChange={(e) => dispatch({ type: 'UPDATE_ASSETS', payload: { emergencyUsableRatio: Number(e.target.value) / 100 } })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            max={100}
          />
        </div>
      </div>
    </div>
  )
}
