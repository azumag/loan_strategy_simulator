import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'

export function HousingCostForm() {
  const { scenario, dispatch } = useScenario()
  const housing = scenario.housing
  const loanPrincipal = scenario.loan.principal

  const [showCalc, setShowCalc] = useState(false)
  const [propertyPrice, setPropertyPrice] = useState(Math.round(loanPrincipal / 10000))
  const [assessmentRatio, setAssessmentRatio] = useState(70)

  const update = (key: keyof typeof housing, value: number) =>
    dispatch({ type: 'UPDATE_HOUSING', payload: { [key]: value } })

  const calcAndApply = () => {
    const priceYen = propertyPrice * 10000
    const assessed = priceYen * (assessmentRatio / 100)
    const fixedAssetTax = Math.round(assessed * 0.014)
    const cityPlanningTax = Math.round(assessed * 0.003)
    dispatch({ type: 'UPDATE_HOUSING', payload: { fixedAssetTaxAnnual: fixedAssetTax, cityPlanningTaxAnnual: cityPlanningTax } })
    setShowCalc(false)
  }

  const fields: { key: keyof typeof housing; label: string }[] = [
    { key: 'fixedAssetTaxAnnual', label: '固定資産税年額（万円）' },
    { key: 'cityPlanningTaxAnnual', label: '都市計画税年額（万円）' },
    { key: 'homeInsuranceAnnual', label: '火災保険料年額（万円）' },
    { key: 'maintenanceAnnual', label: '修繕積立・維持費年額（万円）' },
    { key: 'otherHousingCostAnnual', label: 'その他住宅費年額（万円）' },
  ]

  const assessed = propertyPrice * (assessmentRatio / 100)
  const previewFixed = Math.round(assessed * 0.014 * 100) / 100
  const previewCity = Math.round(assessed * 0.003 * 100) / 100

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">住宅費</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-700">固定資産税年額（万円）</label>
            <button
              onClick={() => setShowCalc((v) => !v)}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
            >
              概算自動計算
            </button>
          </div>
          <input
            type="number"
            value={housing.fixedAssetTaxAnnual / 10000}
            onChange={(e) => update('fixedAssetTaxAnnual', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        {fields.filter(f => f.key !== 'fixedAssetTaxAnnual').map(({ key, label }) => (
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

      {showCalc && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
          <p className="text-xs text-gray-600">物件価格と評価割合から固定資産税・都市計画税を概算します（税率: 固定資産税1.4%、都市計画税0.3%）。</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">物件価格（万円）</label>
              <input
                type="number"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">評価割合（%）</label>
              <input
                type="number"
                value={assessmentRatio}
                onChange={(e) => setAssessmentRatio(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                min={1}
                max={100}
              />
            </div>
          </div>
          <div className="text-xs text-gray-700 space-y-0.5">
            <div>固定資産税: <span className="font-semibold">{previewFixed.toFixed(1)} 万円/年</span></div>
            <div>都市計画税: <span className="font-semibold">{previewCity.toFixed(1)} 万円/年</span></div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={calcAndApply}
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
            >
              この値を適用
            </button>
            <button
              onClick={() => setShowCalc(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
