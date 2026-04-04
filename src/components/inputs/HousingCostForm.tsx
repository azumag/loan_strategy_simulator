import { useScenario } from '../../store/scenario-store'

export function HousingCostForm() {
  const { scenario, dispatch } = useScenario()
  const housing = scenario.housing

  const update = (key: keyof typeof housing, value: number) =>
    dispatch({ type: 'UPDATE_HOUSING', payload: { [key]: value } })

  const fields: { key: keyof typeof housing; label: string }[] = [
    { key: 'fixedAssetTaxAnnual', label: '固定資産税（万円）' },
    { key: 'cityPlanningTaxAnnual', label: '都市計画税（万円）' },
    { key: 'homeInsuranceAnnual', label: '火災保険料（万円）' },
    { key: 'maintenanceAnnual', label: '修繕積立・維持費（万円）' },
    { key: 'otherHousingCostAnnual', label: 'その他住宅費（万円）' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">住宅費</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              value={housing[key] / 10000}
              onChange={(e) => update(key, Number(e.target.value) * 10000)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
