import { useScenario } from '../../store/scenario-store'

export function TaxSettingForm() {
  const { scenario, dispatch } = useScenario()
  const tax = scenario.tax

  const update = (key: keyof typeof tax, value: number | boolean) =>
    dispatch({ type: 'UPDATE_TAX', payload: { [key]: value } })

  const fields: { key: keyof typeof tax; label: string }[] = [
    { key: 'basicDeductionAnnual', label: '基礎控除（万円）' },
    { key: 'spouseDeductionAnnual', label: '配偶者控除（万円）' },
    { key: 'dependentDeductionAnnual', label: '扶養控除（万円）' },
    { key: 'lifeInsuranceDeductionAnnual', label: '生命保険料控除（万円）' },
    { key: 'earthquakeInsuranceDeductionAnnual', label: '地震保険料控除（万円）' },
    { key: 'medicalDeductionAnnual', label: '医療費控除（万円）' },
    { key: 'otherDeductionAnnual', label: 'その他控除（万円）' },
    { key: 'housingLoanDeductionAnnual', label: '住宅ローン控除（万円）' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">税・控除設定</h2>
        <p className="text-xs text-amber-600">※税計算は概算です</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              value={(tax[key] as number) / 10000}
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
