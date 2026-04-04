import { useScenario } from '../../store/scenario-store'

export function LivingCostForm() {
  const { scenario, dispatch } = useScenario()
  const living = scenario.living

  const update = (key: keyof typeof living, value: number) =>
    dispatch({ type: 'UPDATE_LIVING', payload: { [key]: value } })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">生活費</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">月間生活費（万円）</label>
          <input
            type="number"
            value={living.monthlyBaseCost / 10000}
            onChange={(e) => update('monthlyBaseCost', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">退職後月間生活費（万円）</label>
          <input
            type="number"
            value={living.monthlyRetirementCost / 10000}
            onChange={(e) => update('monthlyRetirementCost', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">教育費（年・万円）</label>
          <input
            type="number"
            value={living.educationCostAnnual / 10000}
            onChange={(e) => update('educationCostAnnual', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">車維持費（年・万円）</label>
          <input
            type="number"
            value={living.carCostAnnual / 10000}
            onChange={(e) => update('carCostAnnual', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">その他固定費（年・万円）</label>
          <input
            type="number"
            value={living.otherFixedCostAnnual / 10000}
            onChange={(e) => update('otherFixedCostAnnual', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>
      </div>
    </div>
  )
}
